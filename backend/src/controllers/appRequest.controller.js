import AppRequest from "../models/AppRequest.js";
import User from "../models/User.js";

const APP_REQUEST_WEBHOOK_URL = 'https://discord.com/api/webhooks/1443750264493445242/6f9KA-bPAYbhLKgYzmNP9Dy6S5Bpja1GOfC7_umy3w8bou5_bw349Mg6UM5sGEtkDVh-yh';

/**
 * Send app request to Discord
 */
const sendAppRequestToDiscord = async (appRequest, user, isUpdate = false) => {
  try {
    const embed = {
      title: `${isUpdate ? '📝' : '🆕'} App Integration Request: ${appRequest.appName}`,
      description: appRequest.appDescription,
      color: isUpdate ? 16776960 : 5814783, // Yellow for update, blue for new
      fields: [
        {
          name: '📱 App Details',
          value: `**Name:** ${appRequest.appName}\n**Category:** ${appRequest.appCategory}\n${appRequest.appUrl ? `**URL:** ${appRequest.appUrl}` : ''}`,
          inline: false
        },
        {
          name: '👤 Requested By',
          value: `**User:** ${user.fullName}\n**Email:** ${user.email}\n**Username:** @${user.username || 'N/A'}`,
          inline: true
        },
        {
          name: '📊 Status',
          value: `**Status:** ${appRequest.status.toUpperCase()}\n**Votes:** 👍 ${appRequest.votes.upvotes.length} | 👎 ${appRequest.votes.downvotes.length}\n**Net Score:** ${appRequest.votes.upvotes.length - appRequest.votes.downvotes.length}`,
          inline: true
        },
        {
          name: '🔗 Quick Links',
          value: `[View in Admin Panel](${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin)\n[View All Requests](${process.env.FRONTEND_URL || 'http://localhost:3000'}/apps)`,
          inline: false
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: `Request ID: ${appRequest._id} • ${isUpdate ? 'Updated' : 'Created'} ${new Date().toLocaleString()}`,
        icon_url: user.profilePic || 'https://cdn.discordapp.com/embed/avatars/0.png'
      }
    };

    const payload = {
      embeds: [embed],
      username: 'App Request System',
      avatar_url: 'https://cdn.discordapp.com/embed/avatars/0.png'
    };

    const response = await fetch(APP_REQUEST_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      return data.id; // Discord message ID
    }

    return null;
  } catch (error) {
    console.error('Error sending app request to Discord:', error);
    return null;
  }
};

/**
 * Create a new app request
 */
export const createAppRequest = async (req, res) => {
  try {
    const { appName, appDescription, appUrl, appCategory } = req.body;
    const userId = req.user._id;

    if (!appName || !appDescription) {
      return res.status(400).json({ message: "App name and description are required" });
    }

    // Check if user already requested this app
    const existingRequest = await AppRequest.findOne({
      appName: { $regex: new RegExp(`^${appName}$`, 'i') },
      requestedBy: userId
    });

    if (existingRequest) {
      return res.status(400).json({ message: "You have already requested this app" });
    }

    const appRequest = new AppRequest({
      appName,
      appDescription,
      appUrl,
      appCategory: appCategory || 'other',
      requestedBy: userId,
      votes: {
        upvotes: [userId], // Auto-upvote own request
        downvotes: []
      }
    });

    await appRequest.save();

    // Populate user data
    await appRequest.populate('requestedBy', 'fullName email username profilePic');

    // Send to Discord
    const discordMessageId = await sendAppRequestToDiscord(appRequest, req.user);
    if (discordMessageId) {
      appRequest.discordMessageId = discordMessageId;
      await appRequest.save();
    }

    res.status(201).json({
      success: true,
      message: "App request submitted successfully",
      appRequest
    });
  } catch (error) {
    console.error("Error creating app request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get all app requests (with optional filters)
 */
export const getAppRequests = async (req, res) => {
  try {
    const { status, category, sort = '-createdAt' } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.appCategory = category;

    const appRequests = await AppRequest.find(filter)
      .populate('requestedBy', 'fullName email username profilePic subscriptionPlan premiumTier')
      .sort(sort)
      .lean();

    // Calculate vote counts
    const requestsWithVotes = appRequests.map(request => ({
      ...request,
      voteCount: (request.votes.upvotes?.length || 0) - (request.votes.downvotes?.length || 0),
      upvoteCount: request.votes.upvotes?.length || 0,
      downvoteCount: request.votes.downvotes?.length || 0
    }));

    res.status(200).json({
      success: true,
      appRequests: requestsWithVotes
    });
  } catch (error) {
    console.error("Error fetching app requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get a single app request
 */
export const getAppRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const appRequest = await AppRequest.findById(id)
      .populate('requestedBy', 'fullName email username profilePic subscriptionPlan premiumTier')
      .populate('votes.upvotes', 'fullName profilePic')
      .populate('votes.downvotes', 'fullName profilePic');

    if (!appRequest) {
      return res.status(404).json({ message: "App request not found" });
    }

    res.status(200).json({
      success: true,
      appRequest
    });
  } catch (error) {
    console.error("Error fetching app request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Vote on an app request
 */
export const voteAppRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // 'upvote' or 'downvote'
    const userId = req.user._id;

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ message: "Invalid vote type" });
    }

    const appRequest = await AppRequest.findById(id);
    if (!appRequest) {
      return res.status(404).json({ message: "App request not found" });
    }

    const hasUpvoted = appRequest.votes.upvotes.includes(userId);
    const hasDownvoted = appRequest.votes.downvotes.includes(userId);

    if (voteType === 'upvote') {
      if (hasUpvoted) {
        // Remove upvote
        appRequest.votes.upvotes = appRequest.votes.upvotes.filter(id => id.toString() !== userId.toString());
      } else {
        // Add upvote and remove downvote if exists
        appRequest.votes.upvotes.push(userId);
        appRequest.votes.downvotes = appRequest.votes.downvotes.filter(id => id.toString() !== userId.toString());
      }
    } else {
      if (hasDownvoted) {
        // Remove downvote
        appRequest.votes.downvotes = appRequest.votes.downvotes.filter(id => id.toString() !== userId.toString());
      } else {
        // Add downvote and remove upvote if exists
        appRequest.votes.downvotes.push(userId);
        appRequest.votes.upvotes = appRequest.votes.upvotes.filter(id => id.toString() !== userId.toString());
      }
    }

    await appRequest.save();
    await appRequest.populate('requestedBy', 'fullName email username profilePic subscriptionPlan premiumTier');

    res.status(200).json({
      success: true,
      message: "Vote recorded successfully",
      appRequest,
      voteCount: appRequest.votes.upvotes.length - appRequest.votes.downvotes.length
    });
  } catch (error) {
    console.error("Error voting on app request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Update app request status (Admin only)
 */
export const updateAppRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['pending', 'reviewing', 'approved', 'rejected', 'implemented'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const appRequest = await AppRequest.findById(id);
    if (!appRequest) {
      return res.status(404).json({ message: "App request not found" });
    }

    appRequest.status = status;
    if (adminNotes) appRequest.adminNotes = adminNotes;
    if (status === 'implemented') appRequest.implementationDate = new Date();

    await appRequest.save();
    await appRequest.populate('requestedBy', 'fullName email username profilePic');

    // Send update to Discord
    await sendAppRequestToDiscord(appRequest, appRequest.requestedBy, true);

    res.status(200).json({
      success: true,
      message: "App request status updated successfully",
      appRequest
    });
  } catch (error) {
    console.error("Error updating app request status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Delete app request (Admin only)
 */
export const deleteAppRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const appRequest = await AppRequest.findByIdAndDelete(id);
    if (!appRequest) {
      return res.status(404).json({ message: "App request not found" });
    }

    res.status(200).json({
      success: true,
      message: "App request deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting app request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get app request statistics (Admin only)
 */
export const getAppRequestStats = async (req, res) => {
  try {
    const total = await AppRequest.countDocuments();
    const pending = await AppRequest.countDocuments({ status: 'pending' });
    const reviewing = await AppRequest.countDocuments({ status: 'reviewing' });
    const approved = await AppRequest.countDocuments({ status: 'approved' });
    const rejected = await AppRequest.countDocuments({ status: 'rejected' });
    const implemented = await AppRequest.countDocuments({ status: 'implemented' });

    // Get top requested apps by votes
    const topRequests = await AppRequest.aggregate([
      {
        $addFields: {
          voteCount: {
            $subtract: [
              { $size: { $ifNull: ['$votes.upvotes', []] } },
              { $size: { $ifNull: ['$votes.downvotes', []] } }
            ]
          }
        }
      },
      { $sort: { voteCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: 'requestedBy',
          foreignField: '_id',
          as: 'requestedBy'
        }
      },
      { $unwind: '$requestedBy' }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        reviewing,
        approved,
        rejected,
        implemented,
        topRequests
      }
    });
  } catch (error) {
    console.error("Error fetching app request stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
