import Vote from "../models/Vote.js";
import User from "../models/User.js";
import { io } from "../lib/socket.js";

// Submit or update vote
export const submitVote = async (req, res) => {
  try {
    const userId = req.user._id;
    const { vote, reason } = req.body;

    if (!["stay", "go"].includes(vote)) {
      return res.status(400).json({ message: "Invalid vote. Must be 'stay' or 'go'" });
    }

    const user = await User.findById(userId).select("fullName email profilePic");

    // Check if user already voted
    let existingVote = await Vote.findOne({ userId });

    if (existingVote) {
      // Update existing vote
      existingVote.vote = vote;
      existingVote.reason = reason || "";
      existingVote.userInfo = {
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic
      };
      await existingVote.save();
    } else {
      // Create new vote
      existingVote = await Vote.create({
        userId,
        vote,
        reason: reason || "",
        userInfo: {
          fullName: user.fullName,
          email: user.email,
          profilePic: user.profilePic
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers["user-agent"] || ""
      });
    }

    // Get updated statistics
    const stats = await getVoteStatistics();

    // Emit real-time update to all connected clients
    // Only send aggregate stats, no user details
    io.emit("vote:update", {
      stats: {
        totalVotes: stats.totalVotes,
        stayVotes: stats.stayVotes,
        goVotes: stats.goVotes,
        stayPercentage: stats.stayPercentage,
        goPercentage: stats.goPercentage
      }
    });

    res.status(200).json({
      message: "Vote submitted successfully",
      vote: {
        vote: existingVote.vote,
        reason: existingVote.reason,
        createdAt: existingVote.createdAt,
        updatedAt: existingVote.updatedAt
      },
      stats: {
        totalVotes: stats.totalVotes,
        stayVotes: stats.stayVotes,
        goVotes: stats.goVotes,
        stayPercentage: stats.stayPercentage,
        goPercentage: stats.goPercentage
      }
    });
  } catch (error) {
    console.error("Error in submitVote:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get user's vote
export const getMyVote = async (req, res) => {
  try {
    const userId = req.user._id;

    const vote = await Vote.findOne({ userId });

    if (!vote) {
      return res.status(200).json({ hasVoted: false, vote: null });
    }

    res.status(200).json({
      hasVoted: true,
      vote: {
        vote: vote.vote,
        reason: vote.reason,
        createdAt: vote.createdAt,
        updatedAt: vote.updatedAt
      }
    });
  } catch (error) {
    console.error("Error in getMyVote:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get vote statistics (public - no user details)
export const getVoteStats = async (req, res) => {
  try {
    const totalVotes = await Vote.countDocuments();
    const stayVotes = await Vote.countDocuments({ vote: "stay" });
    const goVotes = await Vote.countDocuments({ vote: "go" });

    const stayPercentage = totalVotes > 0 ? ((stayVotes / totalVotes) * 100).toFixed(2) : 0;
    const goPercentage = totalVotes > 0 ? ((goVotes / totalVotes) * 100).toFixed(2) : 0;

    // Only return aggregate numbers, no user details
    res.status(200).json({
      totalVotes,
      stayVotes,
      goVotes,
      stayPercentage: parseFloat(stayPercentage),
      goPercentage: parseFloat(goPercentage)
    });
  } catch (error) {
    console.error("Error in getVoteStats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Helper function to calculate statistics
async function getVoteStatistics() {
  const totalVotes = await Vote.countDocuments();
  const stayVotes = await Vote.countDocuments({ vote: "stay" });
  const goVotes = await Vote.countDocuments({ vote: "go" });

  const stayPercentage = totalVotes > 0 ? ((stayVotes / totalVotes) * 100).toFixed(2) : 0;
  const goPercentage = totalVotes > 0 ? ((goVotes / totalVotes) * 100).toFixed(2) : 0;

  // Get recent votes
  const recentVotes = await Vote.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select("vote reason userInfo createdAt");

  // Get votes over time (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const votesOverTime = await Vote.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          vote: "$vote"
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.date": 1 }
    }
  ]);

  // Get hourly distribution (last 24 hours)
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const hourlyDistribution = await Vote.aggregate([
    {
      $match: {
        createdAt: { $gte: twentyFourHoursAgo }
      }
    },
    {
      $group: {
        _id: {
          hour: { $hour: "$createdAt" },
          vote: "$vote"
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.hour": 1 }
    }
  ]);

  return {
    totalVotes,
    stayVotes,
    goVotes,
    stayPercentage: parseFloat(stayPercentage),
    goPercentage: parseFloat(goPercentage),
    recentVotes,
    votesOverTime,
    hourlyDistribution
  };
}

// Admin: Get all votes
export const getAllVotes = async (req, res) => {
  try {
    const { page = 1, limit = 20, filter = "all", sort = "recent" } = req.query;

    const query = {};
    if (filter === "stay") {
      query.vote = "stay";
    } else if (filter === "go") {
      query.vote = "go";
    }

    let sortOption = {};
    if (sort === "recent") {
      sortOption = { createdAt: -1 };
    } else if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    }

    const votes = await Vote.find(query)
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Vote.countDocuments(query);

    res.status(200).json({
      votes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error in getAllVotes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin: Get detailed analytics
export const getVoteAnalytics = async (req, res) => {
  try {
    const stats = await getVoteStatistics();

    // Get votes by day of week
    const votesByDayOfWeek = await Vote.aggregate([
      {
        $group: {
          _id: {
            dayOfWeek: { $dayOfWeek: "$createdAt" },
            vote: "$vote"
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.dayOfWeek": 1 }
      }
    ]);

    // Get top reasons for each vote type
    const topStayReasons = await Vote.find({ vote: "stay", reason: { $ne: "" } })
      .select("reason")
      .limit(10)
      .sort({ createdAt: -1 });

    const topGoReasons = await Vote.find({ vote: "go", reason: { $ne: "" } })
      .select("reason")
      .limit(10)
      .sort({ createdAt: -1 });

    // Get voting rate (votes per hour)
    const firstVote = await Vote.findOne().sort({ createdAt: 1 });
    const lastVote = await Vote.findOne().sort({ createdAt: -1 });

    let votingRate = 0;
    if (firstVote && lastVote) {
      const hoursDiff = (lastVote.createdAt - firstVote.createdAt) / (1000 * 60 * 60);
      votingRate = hoursDiff > 0 ? (stats.totalVotes / hoursDiff).toFixed(2) : 0;
    }

    res.status(200).json({
      ...stats,
      votesByDayOfWeek,
      topStayReasons,
      topGoReasons,
      votingRate: parseFloat(votingRate),
      firstVoteDate: firstVote?.createdAt,
      lastVoteDate: lastVote?.createdAt
    });
  } catch (error) {
    console.error("Error in getVoteAnalytics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin: Delete vote
export const deleteVote = async (req, res) => {
  try {
    const { voteId } = req.params;

    const vote = await Vote.findByIdAndDelete(voteId);

    if (!vote) {
      return res.status(404).json({ message: "Vote not found" });
    }

    // Get updated statistics
    const stats = await getVoteStatistics();

    // Emit real-time update
    io.emit("vote:update", { stats });

    res.status(200).json({
      message: "Vote deleted successfully",
      stats
    });
  } catch (error) {
    console.error("Error in deleteVote:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin: Clear all votes
export const clearAllVotes = async (req, res) => {
  try {
    await Vote.deleteMany({});

    // Emit real-time update
    io.emit("vote:update", {
      stats: {
        totalVotes: 0,
        stayVotes: 0,
        goVotes: 0,
        stayPercentage: 0,
        goPercentage: 0,
        recentVotes: [],
        votesOverTime: [],
        hourlyDistribution: []
      }
    });

    res.status(200).json({ message: "All votes cleared successfully" });
  } catch (error) {
    console.error("Error in clearAllVotes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
