import Announcement from "../models/announcement.model.js";
import User from "../models/User.js";
import { sendDiscordWebhook } from "../lib/discordWebhook.js";
import {
	uploadBase64ImageToSupabase,
	removeFromSupabase,
} from "../lib/supabase.js";

// Get all announcements (sorted by date, newest first)
export const getAnnouncements = async (req, res) => {
	try {
		const userId = req.user._id;

		const announcements = await Announcement.find()
			.sort({ createdAt: -1 })
			.limit(50);

		// Add read status for current user
		const announcementsWithReadStatus = announcements.map((announcement) => {
			const readEntry = announcement.readBy.find(
				(entry) => entry.user.toString() === userId.toString()
			);

			return {
				...announcement.toObject(),
				isRead: !!readEntry,
				readAt: readEntry?.readAt || null,
			};
		});

		res.status(200).json(announcementsWithReadStatus);
	} catch (error) {
		console.error("Error in getAnnouncements:", error.message);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Create announcement (admin only)
export const createAnnouncement = async (req, res) => {
	try {
		const { title, content, priority } = req.body;

		if (!title || !content) {
			return res
				.status(400)
				.json({ message: "Title and content are required" });
		}

		let bannerImage = null;
		let bannerImagePublicId = null;

		// Handle image upload if provided
		if (req.file) {
			try {
				const base64 = `data:${
					req.file.mimetype
				};base64,${req.file.buffer.toString("base64")}`;
				const { url, key } = await uploadBase64ImageToSupabase({
					base64,
					folder: "announcements",
				});

				bannerImage = url;
				bannerImagePublicId = key;
			} catch (uploadError) {
				console.error("Image upload failed:", uploadError);
				return res
					.status(400)
					.json({ message: `Image upload failed: ${uploadError.message}` });
			}
		}

		const announcement = new Announcement({
			title,
			content,
			priority: priority || "normal",
			bannerImage,
			bannerImagePublicId,
			createdBy: req.user._id,
		});

		await announcement.save();

		// Send Discord webhook (non-blocking)
		try {
			sendDiscordWebhook(announcement).catch((error) => {
				console.error("Webhook failed (non-blocking):", error.message);
			});
		} catch (error) {
			console.error("Error initiating webhook (non-blocking):", error.message);
		}

		res.status(201).json(announcement);
	} catch (error) {
		console.error("Error in createAnnouncement:", error.message);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Update announcement (admin only)
export const updateAnnouncement = async (req, res) => {
	try {
		const { id } = req.params;
		const { title, content, priority } = req.body;

		if (!title || !content) {
			return res
				.status(400)
				.json({ message: "Title and content are required" });
		}

		const announcement = await Announcement.findById(id);

		if (!announcement) {
			return res.status(404).json({ message: "Announcement not found" });
		}

		// Handle image update if provided
		if (req.file) {
			try {
				// Delete old image if exists
				if (announcement.bannerImagePublicId) {
					await removeFromSupabase(announcement.bannerImagePublicId);
				}

				const base64 = `data:${
					req.file.mimetype
				};base64,${req.file.buffer.toString("base64")}`;
				const { url, key } = await uploadBase64ImageToSupabase({
					base64,
					folder: "announcements",
				});

				announcement.bannerImage = url;
				announcement.bannerImagePublicId = key;
			} catch (uploadError) {
				console.error("Image upload failed:", uploadError);
				return res
					.status(400)
					.json({ message: `Image upload failed: ${uploadError.message}` });
			}
		}

		// Update the announcement
		announcement.title = title;
		announcement.content = content;
		announcement.priority = priority || "normal";

		await announcement.save();

		// Send Discord webhook for edited announcement (non-blocking)
		try {
			sendDiscordWebhook(announcement, true).catch((error) => {
				console.error("Webhook failed (non-blocking):", error.message);
			});
		} catch (error) {
			console.error("Error initiating webhook (non-blocking):", error.message);
		}

		res.status(200).json(announcement);
	} catch (error) {
		console.error("Error in updateAnnouncement:", error.message);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Delete announcement (admin only)
export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    if (announcement.bannerImagePublicId) {
      await removeFromSupabase(announcement.bannerImagePublicId);
    }

    res.status(200).json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Error in deleteAnnouncement:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};


// Mark announcement as read
export const markAnnouncementAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // Check if already read
    const existingReadEntry = announcement.readBy.find(
      entry => entry.user.toString() === userId.toString()
    );

    if (existingReadEntry) {
      return res.status(200).json({
        message: "Announcement already marked as read",
        readAt: existingReadEntry.readAt
      });
    }

    // Add read entry
    announcement.readBy.push({
      user: userId,
      readAt: new Date()
    });

    await announcement.save();

    res.status(200).json({
      message: "Announcement marked as read",
      readAt: announcement.readBy[announcement.readBy.length - 1].readAt
    });
  } catch (error) {
    console.error("Error in markAnnouncementAsRead:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark multiple announcements as read
export const markAnnouncementsAsRead = async (req, res) => {
  try {
    const { announcementIds } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(announcementIds) || announcementIds.length === 0) {
      return res.status(400).json({ message: "Announcement IDs array is required" });
    }

    const results = [];

    for (const id of announcementIds) {
      try {
        const announcement = await Announcement.findById(id);
        if (!announcement) {
          results.push({ id, success: false, error: "Announcement not found" });
          continue;
        }

        // Check if already read
        const existingReadEntry = announcement.readBy.find(
          entry => entry.user.toString() === userId.toString()
        );

        if (!existingReadEntry) {
          announcement.readBy.push({
            user: userId,
            readAt: new Date()
          });
          await announcement.save();
          results.push({ id, success: true, readAt: announcement.readBy[announcement.readBy.length - 1].readAt });
        } else {
          results.push({ id, success: true, readAt: existingReadEntry.readAt, alreadyRead: true });
        }
      }
      catch (error) {
        results.push({ id, success: false, error: error.message });
      }
    }

    res.status(200).json({ results });
  } catch (error) {
    console.error("Error in markAnnouncementsAsRead:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get unread announcements count for current user
export const getUnreadAnnouncementsCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Announcement.countDocuments({
      readBy: {
        $not: {
          $elemMatch: { user: userId }
        }
      }
    });

    res.status(200).json({ count: unreadCount });
  } catch (error) {
    console.error("Error in getUnreadAnnouncementsCount:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get user rankings by followers
export const getRankings = async (req, res) => {
  try {
    // TODO: Implement proper follower/subscriber system
    // For now, return users sorted by a placeholder field
    const users = await User.find()
      .select('fullName email profilePic followersCount')
      .sort({ followersCount: -1 })
      .limit(50);

    // Add placeholder follower counts if not present
    const usersWithCounts = users.map(user => ({
      ...user.toObject(),
      followersCount: user.followersCount || 0
    }));

    res.status(200).json(usersWithCounts);
  } catch (error) {
    console.error("Error in getRankings:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};