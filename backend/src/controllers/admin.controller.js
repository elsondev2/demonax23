import User from "../models/User.js";
import Group from "../models/Group.js";
import Message from "../models/Message.js";
import Status from "../models/Status.js";
import Post from "../models/Post.js";
import Donation from "../models/Donation.js";
import { generateToken } from "../lib/utils.js";
import { cacheWrap, cacheInvalidate } from "../lib/cache.js";
import { removeFromSupabase } from "../lib/supabase.js";

// Hardcoded admin credentials
const ADMIN_USERNAME = "elsondev26";
const ADMIN_PASSWORD = "irenendonde";

export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check hardcoded credentials
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    // Find or create admin user
    let adminUser = await User.findOne({ email: "admin@demonax.com" });

    if (!adminUser) {
      // Create admin user if doesn't exist
      adminUser = await User.create({
        email: "admin@demonax.com",
        fullName: "Admin",
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD,
        role: "admin",
      });
    } else if (adminUser.role !== "admin") {
      // Ensure user has admin role
      adminUser.role = "admin";
      await adminUser.save();
    }

    // Generate token
    const token = generateToken(adminUser._id, res);

    res.json({
      _id: adminUser._id,
      fullName: adminUser.fullName,
      email: adminUser.email,
      username: adminUser.username,
      role: adminUser.role,
      profilePic: adminUser.profilePic,
      token, // Include token in response for cross-origin requests
    });
  } catch (e) {
    console.error("Admin login error:", e);
    res.status(500).json({ message: "Failed to login" });
  }
};

export const getOverview = async (_req, res) => {
  try {
    const [users, groups, messages, statuses, donations, dbStats] = await cacheWrap('admin:overview', 30000, async () => {
      const [userCount, groupCount, messageCount, statusCount] = await Promise.all([
        User.countDocuments({}),
        Group.countDocuments({}),
        Message.countDocuments({}),
        Status.countDocuments({ expiresAt: { $gt: new Date() } }),
      ]);

      // Get donation statistics
      const donationStats = await Donation.getStats();

      // Get database size information
      let databaseSize = 0;
      let storageSize = 0;

      try {
        // Get MongoDB database stats using different approaches
        const db = User.db;

        // Try multiple methods to get database size
        try {
          const stats = await db.stats();
          // Use storageSize (includes indexes) to match MongoDB Compass display
          databaseSize = stats.storageSize || stats.dataSize || 0;
          console.log('Database stats:', {
            dataSize: stats.dataSize,
            storageSize: stats.storageSize,
            indexSize: stats.indexSize,
            totalSize: stats.storageSize,
            using: 'storageSize'
          });
        } catch (statsError) {
          console.warn('db.stats() failed:', statsError.message);

          // Fallback: estimate based on collection sizes
          try {
            const collections = await db.listCollections().toArray();
            let estimatedSize = 0;

            for (const collection of collections) {
              try {
                const collStats = await db.collection(collection.name).stats();
                // Use storageSize (includes indexes) to match total storage
                const collectionSize = collStats.storageSize || collStats.size || 0;
                estimatedSize += collectionSize;
                console.log(`Collection ${collection.name}:`, {
                  size: collStats.size,
                  storageSize: collStats.storageSize,
                  using: collectionSize
                });
              } catch (collError) {
                console.warn(`Could not get stats for collection ${collection.name}:`, collError.message);
              }
            }

            databaseSize = estimatedSize;
            console.log('Estimated database size from collections:', estimatedSize);
          } catch (collectionError) {
            console.warn('Collection stats fallback failed:', collectionError.message);

            // Final fallback: rough estimate based on document counts (including MongoDB overhead)
            const documentEstimate = (userCount * 1000) + (messageCount * 500) + (groupCount * 2000) + (statusCount * 1500);
            // Add MongoDB overhead (indexes, metadata, etc.) - typically 30-50% more
            const roughEstimate = Math.round(documentEstimate * 1.4);
            databaseSize = roughEstimate;
            console.log('Using rough estimate for database size:', { documentEstimate, withOverhead: roughEstimate });
          }
        }
      } catch (error) {
        console.warn('Could not get database stats:', error.message);
        // Very rough estimate if all else fails (including MongoDB overhead)
        const baseEstimate = (userCount * 1000) + (messageCount * 500) + (groupCount * 2000) + (statusCount * 1500);
        const veryRoughEstimate = Math.round(baseEstimate * 1.4); // Add 40% for indexes and overhead
        databaseSize = veryRoughEstimate;
      }

      try {
        // Get storage size from Supabase (approximate calculation)
        // Count total uploads and estimate size
        const totalUploads = await Promise.all([
          User.countDocuments({ profilePic: { $exists: true, $ne: null } }),
          Group.countDocuments({ groupPic: { $exists: true, $ne: null } }),
          Message.countDocuments({
            $or: [
              { image: { $exists: true, $ne: null } },
              { file: { $exists: true, $ne: null } }
            ]
          }),
          Status.countDocuments({ mediaUrl: { $exists: true, $ne: null } }),
          Post.countDocuments({ items: { $exists: true, $ne: [] } })
        ]);

        // Rough estimation: average file size assumptions
        const profilePics = totalUploads[0] * 150000; // ~150KB per profile pic
        const groupPics = totalUploads[1] * 150000; // ~150KB per group pic
        const messageFiles = totalUploads[2] * 500000; // ~500KB per message file
        const statusMedia = totalUploads[3] * 1000000; // ~1MB per status media
        const postMedia = totalUploads[4] * 800000; // ~800KB per post media

        storageSize = profilePics + groupPics + messageFiles + statusMedia + postMedia;
      } catch (error) {
        console.warn('Could not estimate storage size:', error.message);
      }

      return [userCount, groupCount, messageCount, statusCount, donationStats, { databaseSize, storageSize }];
    });

    res.json({
      users,
      groups,
      messages,
      activeStatuses: statuses,
      donations,
      databaseSize: dbStats.databaseSize,
      storageSize: dbStats.storageSize
    });
  } catch (e) {
    console.error('Overview error:', e);
    res.status(500).json({ message: "Failed to load overview" });
  }
};

export const listUsers = async (_req, res) => {
  try {
    const users = await cacheWrap('admin:users', 60000, async () => User.find({}).select("email fullName username role isBanned createdAt profilePic").sort({ createdAt: -1 }).limit(200));
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: "Failed to list users" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isBanned, fullName, email } = req.body || {};
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (typeof role === 'string') user.role = role;
    if (typeof isBanned === 'boolean') user.isBanned = isBanned;
    if (typeof fullName === 'string') user.fullName = fullName;
    if (typeof email === 'string') user.email = email;
    await user.save();
    res.json({ message: 'Updated', user });
    cacheInvalidate('admin:');
  } catch (e) {
    res.status(500).json({ message: "Failed to update user" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Delete all posts created by this user
    try {
      const Post = (await import('../models/Post.js')).default;
      const deletedPosts = await Post.deleteMany({ postedBy: id });
      console.log(`Deleted ${deletedPosts.deletedCount} posts from user ${id}`);
    } catch (postErr) {
      console.error('Failed to delete user posts:', postErr);
    }
    
    // Delete all statuses created by this user
    try {
      const Status = (await import('../models/Status.js')).default;
      const deletedStatuses = await Status.deleteMany({ userId: id });
      console.log(`Deleted ${deletedStatuses.deletedCount} statuses from user ${id}`);
    } catch (statusErr) {
      console.error('Failed to delete user statuses:', statusErr);
    }
    
    res.json({ message: 'User deleted successfully' });
    cacheInvalidate('admin:');
  } catch (e) {
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// Messages Management (Direct only)
export const listMessages = async (req, res) => {
  try {
    const { limit = 100, skip = 0, q = "" } = req.query;
    const directFilter = { $or: [{ groupId: { $exists: false } }, { groupId: null }] };
    const textFilter = q ? { text: { $regex: String(q), $options: 'i' } } : {};
    const findFilter = { ...directFilter, ...textFilter };

    const messages = await cacheWrap(`admin:messages:${limit}:${skip}:${q}`, 15000, async () => Message.find(findFilter)
      .populate('senderId', 'fullName email profilePic')
      .populate('receiverId', 'fullName email profilePic')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip)));
    const total = await Message.countDocuments(findFilter); // count not cached to reflect near-realtime
    res.json({ messages, total });
  } catch (e) {
    res.status(500).json({ message: "Failed to list messages" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findByIdAndDelete(id);
    if (!message) return res.status(404).json({ message: "Message not found" });
    res.json({ message: 'Message deleted successfully' });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete message" });
  }
};

export const updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Message not found" });
    if (text) message.text = text;
    await message.save();
    res.json({ message: 'Message updated', data: message });
  } catch (e) {
    res.status(500).json({ message: "Failed to update message" });
  }
};

// Groups Management
export const listGroups = async (req, res) => {
  try {
    const { limit = 200, skip = 0, q = "" } = req.query;
    const filter = q ? { name: { $regex: String(q), $options: 'i' } } : {};
    const groups = await cacheWrap(`admin:groups:${limit}:${skip}:${q}`, 30000, async () => Group.find(filter)
      .populate('members', 'fullName email profilePic')
      .populate('admin', 'fullName email profilePic')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip)));
    const total = await Group.countDocuments(filter);
    res.json({ groups, total });
  } catch (e) {
    res.status(500).json({ message: "Failed to list groups" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const group = await Group.findByIdAndDelete(id);
    if (!group) return res.status(404).json({ message: "Group not found" });
    // Also delete all messages in this group
    await Message.deleteMany({ groupId: id });
    res.json({ message: 'Group deleted successfully' });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete group" });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const group = await Group.findById(id);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (typeof name === 'string') group.name = name;
    if (typeof description === 'string') group.description = description;
    await group.save();
    res.json({ message: 'Group updated', group });
  } catch (e) {
    res.status(500).json({ message: "Failed to update group" });
  }
};

// Statuses Management
export const listStatuses = async (req, res) => {
  try {
    const statuses = await Status.find({})
      .populate('userId', 'fullName email profilePic')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(statuses);
  } catch (e) {
    res.status(500).json({ message: "Failed to list statuses" });
  }
};

// Conversations (Direct DM Threads)
export const listConversations = async (req, res) => {
  try {
    const directFilter = { $or: [{ groupId: { $exists: false } }, { groupId: null }] };
    const { limit = 200, skip = 0 } = req.query;
    const pipeline = [
      { $match: directFilter },
      {
        $project: {
          senderId: 1,
          receiverId: 1,
          text: 1,
          createdAt: 1,
          participants: {
            $cond: [
              { $gt: ["$senderId", "$receiverId"] },
              ["$receiverId", "$senderId"],
              ["$senderId", "$receiverId"]
            ]
          }
        }
      },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$participants", lastMessage: { $first: "$$ROOT" } } },
      { $skip: parseInt(skip) },
      { $limit: parseInt(limit) },
      { $lookup: { from: "users", localField: "lastMessage.senderId", foreignField: "_id", as: "sender" } },
      { $lookup: { from: "users", localField: "lastMessage.receiverId", foreignField: "_id", as: "receiver" } },
      { $unwind: "$sender" },
      { $unwind: "$receiver" },
      {
        $project: {
          participants: "$_id",
          lastMessage: 1,
          sender: { _id: "$sender._id", fullName: "$sender.fullName", email: "$sender.email", profilePic: "$sender.profilePic" },
          receiver: { _id: "$receiver._id", fullName: "$receiver.fullName", email: "$receiver.email", profilePic: "$receiver.profilePic" }
        }
      }
    ];

    const result = await cacheWrap(`admin:dmConversations:${limit}:${skip}`, 15000, async () => Message.aggregate(pipeline));
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to list conversations" });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { a, b } = req.params; // user ids
    const { limit = 500, q = "" } = req.query;
    const directFilter = { $or: [{ groupId: { $exists: false } }, { groupId: null }] };
    const textFilter = q ? { text: { $regex: String(q), $options: 'i' } } : {};
    const messages = await cacheWrap(`admin:dmThread:${a}:${b}:${limit}:${q}`, 120000, async () => Message.find({
      ...directFilter,
      ...textFilter,
      $or: [
        { senderId: a, receiverId: b },
        { senderId: b, receiverId: a }
      ]
    })
      .populate('senderId', 'fullName email profilePic')
      .populate('receiverId', 'fullName email profilePic')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit)));
    res.json(messages);
  } catch (e) {
    res.status(500).json({ message: "Failed to load conversation" });
  }
};

// Group Conversations (messages in groups)
export const listGroupConversations = async (req, res) => {
  try {
    const { limit = 200, skip = 0 } = req.query;
    const pipeline = [
      { $match: { groupId: { $ne: null } } },
      { $sort: { createdAt: -1 } },
      { $group: { _id: "$groupId", lastMessage: { $first: "$$ROOT" }, count: { $sum: 1 } } },
      { $skip: parseInt(skip) },
      { $limit: parseInt(limit) },
      { $lookup: { from: "groups", localField: "_id", foreignField: "_id", as: "group" } },
      { $unwind: "$group" },
      { $lookup: { from: "users", localField: "lastMessage.senderId", foreignField: "_id", as: "sender" } },
      { $unwind: "$sender" },
      {
        $project: {
          group: {
            _id: "$group._id",
            name: "$group.name",
            groupPic: "$group.groupPic"
          },
          lastMessage: {
            _id: "$lastMessage._id",
            text: "$lastMessage.text",
            createdAt: "$lastMessage.createdAt"
          },
          sender: { _id: "$sender._id", fullName: "$sender.fullName", profilePic: "$sender.profilePic" },
          count: 1
        }
      }
    ];
    const result = await cacheWrap(`admin:groupConversations:${limit}:${skip}`, 15000, async () => Message.aggregate(pipeline));
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to list group conversations" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { limit = 500, q = "" } = req.query;
    const textFilter = q ? { text: { $regex: String(q), $options: 'i' } } : {};
    const messages = await cacheWrap(`admin:groupThread:${groupId}:${limit}:${q}`, 120000, async () => Message.find({ groupId, ...textFilter })
      .populate('senderId', 'fullName email profilePic')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit)));
    res.json(messages);
  } catch (e) {
    res.status(500).json({ message: "Failed to load group messages" });
  }
};

// Uploads Listing (from messages attachments/images and statuses)
export const listUploads = async (req, res) => {
  try {
    const { limit = 100, skip = 0, q = "" } = req.query;
    const uploads = [];

    // Message attachments
    const msgAttach = await Message.find({ "attachments.0": { $exists: true } })
      .select("attachments senderId receiverId groupId createdAt")
      .populate('senderId', 'fullName email')
      .populate('receiverId', 'fullName email');
    msgAttach.forEach(m => {
      (m.attachments || []).forEach(att => {
        if (!att.url) return; // Skip attachments without URLs
        if (q && !(`${att.filename || ''} ${att.contentType || ''}`.toLowerCase().includes(String(q).toLowerCase()))) return;
        uploads.push({
          _id: `${m._id}:${att.storageKey || att.url}`,
          kind: 'message-attachment',
          url: att.url,
          storageKey: att.storageKey,
          filename: att.filename,
          contentType: att.contentType,
          size: att.size,
          user: m.senderId ? { _id: m.senderId._id, fullName: m.senderId.fullName, email: m.senderId.email } : null,
          where: m.groupId ? { type: 'group', id: m.groupId } : { type: 'dm', id: m.receiverId?._id },
          createdAt: m.createdAt,
        });
      });
    });

    // Message images
    const msgImages = await Message.find({ image: { $exists: true, $ne: "" } })
      .select("image imageStorageKey senderId receiverId groupId createdAt")
      .populate('senderId', 'fullName email')
      .populate('receiverId', 'fullName email');
    msgImages.forEach(m => {
      if (!m.image) return; // Skip messages without images
      if (q && !((m.image || '').toLowerCase().includes(String(q).toLowerCase()))) return;
      uploads.push({
        _id: `${m._id}:image`,
        kind: 'message-image',
        url: m.image,
        storageKey: m.imageStorageKey,
        filename: null,
        contentType: 'image/*',
        size: null,
        user: m.senderId ? { _id: m.senderId._id, fullName: m.senderId.fullName, email: m.senderId.email } : null,
        where: m.groupId ? { type: 'group', id: m.groupId } : { type: 'dm', id: m.receiverId?._id },
        createdAt: m.createdAt,
      });
    });

    // Status media and audio
    const statuses = await Status.find({}).select("userId mediaUrl storageKey audioUrl audioStorageKey mediaType createdAt").populate('userId', 'fullName email');
    statuses.forEach(s => {
      if (s.mediaUrl && (!q || (s.mediaUrl || '').toLowerCase().includes(String(q).toLowerCase()))) {
        uploads.push({
          _id: `${s._id}:status-media`,
          kind: 'status-media',
          url: s.mediaUrl,
          storageKey: s.storageKey,
          filename: null,
          contentType: s.mediaType,
          size: null,
          user: s.userId ? { _id: s.userId._id, fullName: s.userId.fullName, email: s.userId.email } : null,
          where: { type: 'status', id: s._id },
          createdAt: s.createdAt,
        });
      }
      if (s.audioUrl) {
        uploads.push({
          _id: `${s._id}:status-audio`,
          kind: 'status-audio',
          url: s.audioUrl,
          storageKey: s.audioStorageKey,
          filename: null,
          contentType: 'audio/*',
          size: s.audioDurationSec ? s.audioDurationSec * 1000 : null,
          user: s.userId ? { _id: s.userId._id, fullName: s.userId.fullName, email: s.userId.email } : null,
          where: { type: 'status', id: s._id },
          createdAt: s.createdAt,
        });
      }
    });

    // User profile pictures
    const users = await User.find({ profilePic: { $exists: true, $ne: "" } }).select("profilePic fullName email createdAt");
    users.forEach(u => {
      if (q && !(u.profilePic || '').toLowerCase().includes(String(q).toLowerCase())) return;
      uploads.push({
        _id: `${u._id}:profile-pic`,
        kind: 'profile-picture',
        url: u.profilePic,
        storageKey: null, // Profile pics might not have storage keys if uploaded via external services
        filename: null,
        contentType: 'image/*',
        size: null,
        user: { _id: u._id, fullName: u.fullName, email: u.email },
        where: { type: 'user-profile', id: u._id },
        createdAt: u.createdAt,
      });
    });

    // Group pictures
    const groups = await Group.find({ groupPic: { $exists: true, $ne: "" } }).select("groupPic name admin createdAt").populate('admin', 'fullName email');
    groups.forEach(g => {
      if (q && !(g.groupPic || '').toLowerCase().includes(String(q).toLowerCase())) return;
      uploads.push({
        _id: `${g._id}:group-pic`,
        kind: 'group-picture',
        url: g.groupPic,
        storageKey: null, // Group pics might not have storage keys
        filename: null,
        contentType: 'image/*',
        size: null,
        user: g.admin ? { _id: g.admin._id, fullName: g.admin.fullName, email: g.admin.email } : null,
        where: { type: 'group', id: g._id },
        createdAt: g.createdAt,
      });
    });

    // Filter out any uploads with null/undefined URLs and sort
    const validUploads = uploads.filter(u => u && u.url && u._id);
    validUploads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = validUploads.length;
    const start = parseInt(skip);
    const end = start + parseInt(limit);
    const page = validUploads.slice(start, end);

    res.json({ uploads: page, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Failed to list uploads" });
  }
};

// Delete upload helper endpoint (best-effort) by kind and storageKey
export const deleteUpload = async (req, res) => {
  try {
    const { kind, refId, storageKey } = req.body || {};
    if (!kind) return res.status(400).json({ message: 'kind is required' });

    if (kind === 'message-attachment') {
      if (!refId || !storageKey) return res.status(400).json({ message: 'refId and storageKey required' });
      await Message.updateOne({ _id: refId }, { $pull: { attachments: { storageKey } } });
      try { if (storageKey) await removeFromSupabase(storageKey); } catch { }
      cacheInvalidate('admin:');
      return res.json({ message: 'Attachment removed' });
    }
    if (kind === 'message-image') {
      if (!refId) return res.status(400).json({ message: 'refId required' });
      const msg = await Message.findById(refId);
      if (msg?.imageStorageKey) { try { await removeFromSupabase(msg.imageStorageKey); } catch { } }
      msg.image = ""; msg.imageStorageKey = ""; await msg.save();
      cacheInvalidate('admin:');
      return res.json({ message: 'Image removed' });
    }
    if (kind === 'status-media' || kind === 'status-audio') {
      if (!refId) return res.status(400).json({ message: 'refId required' });
      const status = await Status.findById(refId);
      if (!status) return res.status(404).json({ message: 'Not found' });
      if (kind === 'status-media' && status.storageKey) { try { await removeFromSupabase(status.storageKey); } catch { } status.mediaUrl = ''; status.storageKey = ''; }
      if (kind === 'status-audio' && status.audioStorageKey) { try { await removeFromSupabase(status.audioStorageKey); } catch { } status.audioUrl = ''; status.audioStorageKey = ''; }
      await status.save();
      cacheInvalidate('admin:');
      return res.json({ message: 'Status asset removed' });
    }
    if (kind === 'profile-picture') {
      if (!refId) return res.status(400).json({ message: 'refId required' });
      const user = await User.findById(refId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      // Note: Profile pics might be external URLs, so we only clear the field
      user.profilePic = '';
      await user.save();
      cacheInvalidate('admin:');
      return res.json({ message: 'Profile picture removed' });
    }
    if (kind === 'group-picture') {
      if (!refId) return res.status(400).json({ message: 'refId required' });
      const group = await Group.findById(refId);
      if (!group) return res.status(404).json({ message: 'Group not found' });
      // Note: Group pics might be external URLs, so we only clear the field
      group.groupPic = '';
      await group.save();
      cacheInvalidate('admin:');
      return res.json({ message: 'Group picture removed' });
    }
    return res.status(400).json({ message: 'Unsupported kind' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete upload' });
  }
};

export const deleteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const status = await Status.findByIdAndDelete(id);
    if (!status) return res.status(404).json({ message: "Status not found" });
    res.json({ message: 'Status deleted successfully' });
  } catch (e) {
    res.status(500).json({ message: "Failed to delete status" });
  }
};

// Posts Management
export const listPosts = async (req, res) => {
  try {
    const { limit = 100, skip = 0, q = "", visibility = "" } = req.query;
    let filter = {};

    // Filter by visibility if specified
    if (visibility && ["public", "members"].includes(visibility)) {
      filter.visibility = visibility;
    }

    // Text search in title and caption
    if (q) {
      filter.$or = [
        { title: { $regex: String(q), $options: 'i' } },
        { caption: { $regex: String(q), $options: 'i' } }
      ];
    }

    const posts = await Post.find(filter)
      .populate('postedBy', 'fullName email profilePic')
      .populate('comments.user', 'fullName email profilePic')
      .populate('comments.replies.user', 'fullName email profilePic')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Post.countDocuments(filter);
    res.json({ posts, total });
  } catch (e) {
    console.error('Error in listPosts:', e);
    res.status(500).json({ message: "Failed to list posts" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByIdAndDelete(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Clean up associated files
    try {
      for (const item of post.items || []) {
        if (item.storageKey) {
          try { await removeFromSupabase(item.storageKey); } catch { }
        }
      }
    } catch { }

    res.json({ message: 'Post deleted successfully' });
    cacheInvalidate('admin:');
  } catch (e) {
    res.status(500).json({ message: "Failed to delete post" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments = post.comments.filter(comment => comment._id.toString() !== commentId);
    await post.save();

    res.json({ message: 'Comment deleted successfully' });
    cacheInvalidate('admin:');
  } catch (e) {
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

export const deleteReply = async (req, res) => {
  try {
    const { postId, commentId, replyId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // Recursively find and remove reply
    const removeReply = (replies, targetId) => {
      for (let i = 0; i < replies.length; i++) {
        if (replies[i]._id.toString() === targetId) {
          replies.splice(i, 1);
          return true;
        }
        if (replies[i].replies && removeReply(replies[i].replies, targetId)) {
          return true;
        }
      }
      return false;
    };

    removeReply(comment.replies, replyId);
    await post.save();

    res.json({ message: 'Reply deleted successfully' });
    cacheInvalidate('admin:');
  } catch (e) {
    res.status(500).json({ message: "Failed to delete reply" });
  }
};

// Community Groups Management
export const listCommunityGroups = async (req, res) => {
  try {
    const groups = await Group.find({ isCommunity: true })
      .populate('createdBy', 'fullName email profilePic')
      .populate('members', 'fullName email profilePic')
      .sort({ createdAt: -1 });
    
    res.json(groups);
  } catch (e) {
    console.error('Error listing community groups:', e);
    res.status(500).json({ message: "Failed to fetch community groups" });
  }
};

export const createCommunityGroup = async (req, res) => {
  try {
    const { name, description, groupPic } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    // Check if community group with same name exists
    const existingGroup = await Group.findOne({ 
      name: name.trim(), 
      isCommunity: true 
    });
    
    if (existingGroup) {
      return res.status(400).json({ message: "A community group with this name already exists" });
    }

    const newGroup = await Group.create({
      name: name.trim(),
      description: description?.trim() || '',
      groupPic: groupPic || null,
      isCommunity: true,
      createdBy: req.user._id,
      members: [req.user._id],
      admin: req.user._id,
      admins: [req.user._id]
    });

    await newGroup.populate('createdBy', 'fullName email profilePic');
    await newGroup.populate('members', 'fullName email profilePic');

    res.status(201).json(newGroup);
    cacheInvalidate('admin:');
  } catch (e) {
    console.error('Error creating community group:', e);
    res.status(500).json({ message: "Failed to create community group" });
  }
};

export const updateCommunityGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, groupPic } = req.body;
    
    const group = await Group.findOne({ _id: id, isCommunity: true });
    if (!group) {
      return res.status(404).json({ message: "Community group not found" });
    }

    // Check if name is being changed and if it conflicts with another community group
    if (name && name.trim() !== group.name) {
      const existingGroup = await Group.findOne({ 
        name: name.trim(), 
        isCommunity: true,
        _id: { $ne: id }
      });
      
      if (existingGroup) {
        return res.status(400).json({ message: "A community group with this name already exists" });
      }
      group.name = name.trim();
    }

    if (description !== undefined) {
      group.description = description?.trim() || '';
    }

    if (groupPic !== undefined) {
      group.groupPic = groupPic;
    }

    await group.save();
    await group.populate('createdBy', 'fullName email profilePic');
    await group.populate('members', 'fullName email profilePic');

    res.json(group);
    cacheInvalidate('admin:');
  } catch (e) {
    console.error('Error updating community group:', e);
    res.status(500).json({ message: "Failed to update community group" });
  }
};

export const deleteCommunityGroup = async (req, res) => {
  try {
    const { id } = req.params;
    
    const group = await Group.findOne({ _id: id, isCommunity: true });
    if (!group) {
      return res.status(404).json({ message: "Community group not found" });
    }

    // Delete group picture from storage if exists
    if (group.groupPic) {
      try {
        await removeFromSupabase(group.groupPic);
      } catch (err) {
        console.error('Error removing group picture:', err);
      }
    }

    // Delete all messages in this group
    await Message.deleteMany({ groupId: id });

    // Delete the group
    await Group.findByIdAndDelete(id);

    res.json({ message: 'Community group deleted successfully' });
    cacheInvalidate('admin:');
  } catch (e) {
    console.error('Error deleting community group:', e);
    res.status(500).json({ message: "Failed to delete community group" });
  }
};

// Follow Leaderboard
export const getFollowLeaderboard = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    // Get users sorted by follower count
    const users = await User.find({})
      .select('fullName email username profilePic followers following')
      .sort({ 'followers': -1 })
      .limit(parseInt(limit));

    // Map to include counts
    const leaderboard = users.map(user => ({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      profilePic: user.profilePic,
      followersCount: user.followers.length,
      followingCount: user.following.length,
    }));

    // Sort by followers count descending
    leaderboard.sort((a, b) => b.followersCount - a.followersCount);

    res.json(leaderboard);
  } catch (e) {
    console.error('Error getting follow leaderboard:', e);
    res.status(500).json({ message: "Failed to fetch follow leaderboard" });
  }
};
