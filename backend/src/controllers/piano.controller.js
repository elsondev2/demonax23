import PianoProfile from "../models/PianoProfile.js";
import PianoRecording from "../models/PianoRecording.js";
import User from "../models/User.js";

// Get or create piano profile
export const getProfile = async (req, res) => {
  try {
    let profile = await PianoProfile.findOne({ userId: req.user._id })
      .populate('followers', 'fullName profilePic')
      .populate('following', 'fullName profilePic');

    if (!profile) {
      profile = await PianoProfile.create({ userId: req.user._id });
    }

    res.json(profile);
  } catch (error) {
    console.error("Error getting piano profile:", error);
    res.status(500).json({ message: "Failed to get profile" });
  }
};

// Create piano profile
export const createProfile = async (req, res) => {
  try {
    const existing = await PianoProfile.findOne({ userId: req.user._id });
    if (existing) {
      return res.json(existing);
    }

    const profile = await PianoProfile.create({ userId: req.user._id });
    res.status(201).json(profile);
  } catch (error) {
    console.error("Error creating piano profile:", error);
    res.status(500).json({ message: "Failed to create profile" });
  }
};

// Update play time
export const updatePlayTime = async (req, res) => {
  try {
    const { seconds } = req.body;
    
    const profile = await PianoProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { totalPlayTime: seconds } },
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (error) {
    console.error("Error updating play time:", error);
    res.status(500).json({ message: "Failed to update play time" });
  }
};

// Get leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const { type = 'playTime', limit = 20 } = req.query;

    let sortField = 'totalPlayTime';
    if (type === 'listeners') sortField = 'totalListeners';
    if (type === 'streams') sortField = 'totalStreams';
    if (type === 'followers') sortField = 'followers';

    const profiles = await PianoProfile.find()
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'fullName profilePic');

    const leaderboard = profiles.map((profile, index) => ({
      rank: index + 1,
      userId: profile.userId._id,
      name: profile.userId.fullName,
      avatar: profile.userId.profilePic,
      totalPlayTime: profile.totalPlayTime,
      totalStreams: profile.totalStreams,
      totalListeners: profile.totalListeners,
      followersCount: profile.followers.length,
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    res.status(500).json({ message: "Failed to get leaderboard" });
  }
};

// Follow a pianist
export const followPianist = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    if (userId === myId.toString()) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    // Add to my following
    await PianoProfile.findOneAndUpdate(
      { userId: myId },
      { $addToSet: { following: userId } },
      { upsert: true }
    );

    // Add to their followers
    await PianoProfile.findOneAndUpdate(
      { userId },
      { $addToSet: { followers: myId } },
      { upsert: true }
    );

    res.json({ message: "Followed successfully" });
  } catch (error) {
    console.error("Error following pianist:", error);
    res.status(500).json({ message: "Failed to follow" });
  }
};

// Unfollow a pianist
export const unfollowPianist = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    // Remove from my following
    await PianoProfile.findOneAndUpdate(
      { userId: myId },
      { $pull: { following: userId } }
    );

    // Remove from their followers
    await PianoProfile.findOneAndUpdate(
      { userId },
      { $pull: { followers: myId } }
    );

    res.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Error unfollowing pianist:", error);
    res.status(500).json({ message: "Failed to unfollow" });
  }
};

// Get recordings (cloud)
export const getRecordings = async (req, res) => {
  try {
    const recordings = await PianoRecording.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(recordings);
  } catch (error) {
    console.error("Error getting recordings:", error);
    res.status(500).json({ message: "Failed to get recordings" });
  }
};

// Save recording to cloud (premium only)
export const saveRecording = async (req, res) => {
  try {
    // Check if user is premium
    const user = await User.findById(req.user._id);
    if (!user.isPremium) {
      return res.status(403).json({ message: "Cloud storage is a premium feature" });
    }

    const { title, duration, instrument, events } = req.body;

    if (!title || !duration || !events) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const recording = await PianoRecording.create({
      userId: req.user._id,
      title,
      duration,
      instrument: instrument || 'grand-piano',
      events,
      isCloud: true,
    });

    // Update profile recording count
    await PianoProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { recordingsCount: 1 } },
      { upsert: true }
    );

    res.status(201).json(recording);
  } catch (error) {
    console.error("Error saving recording:", error);
    res.status(500).json({ message: "Failed to save recording" });
  }
};

// Delete recording
export const deleteRecording = async (req, res) => {
  try {
    const { recordingId } = req.params;

    const recording = await PianoRecording.findOneAndDelete({
      _id: recordingId,
      userId: req.user._id,
    });

    if (!recording) {
      return res.status(404).json({ message: "Recording not found" });
    }

    // Update profile recording count
    await PianoProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { recordingsCount: -1 } }
    );

    res.json({ message: "Recording deleted" });
  } catch (error) {
    console.error("Error deleting recording:", error);
    res.status(500).json({ message: "Failed to delete recording" });
  }
};

// Get live streams (placeholder - actual streams managed via socket)
export const getLiveStreams = async (req, res) => {
  try {
    // This would typically come from Redis or in-memory store
    // For now, return empty array - streams are managed via socket
    res.json([]);
  } catch (error) {
    console.error("Error getting live streams:", error);
    res.status(500).json({ message: "Failed to get streams" });
  }
};
