import User from "../models/User.js";
import { io } from "../lib/socket.js";

export const followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const userToFollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already following
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // Add to following list of current user
    currentUser.following.push(userId);
    await currentUser.save();

    // Add to followers list of target user
    userToFollow.followers.push(currentUserId);
    await userToFollow.save();

    // Emit socket event for live updates
    io.to(userId).emit("newFollower", {
      followerId: currentUserId,
      followerName: currentUser.fullName,
      followerPic: currentUser.profilePic,
    });

    res.status(200).json({
      message: "Successfully followed user",
      following: currentUser.following,
      followers: userToFollow.followers,
    });
  } catch (error) {
    console.error("Error in followUser:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: "You cannot unfollow yourself" });
    }

    const userToUnfollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToUnfollow) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if not following
    if (!currentUser.following.includes(userId)) {
      return res.status(400).json({ message: "Not following this user" });
    }

    // Remove from following list of current user
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== userId
    );
    await currentUser.save();

    // Remove from followers list of target user
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== currentUserId.toString()
    );
    await userToUnfollow.save();

    // Emit socket event for live updates
    io.to(userId).emit("followerRemoved", {
      followerId: currentUserId,
    });

    res.status(200).json({
      message: "Successfully unfollowed user",
      following: currentUser.following,
      followers: userToUnfollow.followers,
    });
  } catch (error) {
    console.error("Error in unfollowUser:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate(
      "followers",
      "fullName email profilePic username"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.followers);
  } catch (error) {
    console.error("Error in getFollowers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate(
      "following",
      "fullName email profilePic username"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.following);
  } catch (error) {
    console.error("Error in getFollowing:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFollowStats = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      followersCount: user.followers.length,
      followingCount: user.following.length,
    });
  } catch (error) {
    console.error("Error in getFollowStats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
