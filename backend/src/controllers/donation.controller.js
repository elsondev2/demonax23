import Donation from '../models/Donation.js';
import User from '../models/User.js';

// Get donation statistics for the donate view
export const getDonationStats = async (req, res) => {
  try {
    const stats = await Donation.getStats();

    // Get recent donations for display (last 10, non-anonymous only)
    const recentDonations = await Donation.find({
      isAnonymous: false,
      status: 'completed'
    })
      .populate('donatedBy', 'fullName profilePic')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('amount donorName message tier createdAt donatedBy')
      .lean();

    // Format recent donations for display
    const formattedRecentDonations = recentDonations.map(donation => ({
      id: donation._id,
      name: donation.donatedBy?.fullName || donation.donorName,
      amount: donation.amount,
      message: donation.message,
      tier: donation.tier,
      time: getTimeAgo(donation.createdAt),
      avatar: donation.donatedBy?.profilePic
    }));

    res.json({
      stats,
      recentDonations: formattedRecentDonations,
      success: true
    });
  } catch (error) {
    console.error('Error getting donation stats:', error);
    res.status(500).json({
      message: 'Failed to load donation statistics',
      success: false
    });
  }
};

// Create a new donation (for when payment integration is added)
export const createDonation = async (req, res) => {
  try {
    const {
      amount,
      currency = 'USD',
      donorName,
      donorEmail,
      isAnonymous = false,
      message = '',
      tier = 'custom',
      paymentMethod = 'other',
      transactionId
    } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: 'Valid amount is required',
        success: false
      });
    }

    if (!donorName || !donorEmail) {
      return res.status(400).json({
        message: 'Donor name and email are required',
        success: false
      });
    }

    // If user is authenticated, use their info
    let donatedBy = null;
    if (req.user) {
      donatedBy = req.user._id;
    }

    const donation = await Donation.create({
      amount,
      currency,
      donorName,
      donorEmail,
      isAnonymous,
      message,
      tier,
      status: 'completed', // For now, assume completed
      paymentMethod,
      transactionId,
      donatedBy
    });

    res.status(201).json({
      message: 'Donation recorded successfully',
      donation: {
        id: donation._id,
        amount: donation.amount,
        tier: donation.tier,
        message: donation.message,
        createdAt: donation.createdAt
      },
      success: true
    });
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({
      message: 'Failed to record donation',
      success: false
    });
  }
};

// Get donation leaderboard (top supporters)
export const getDonationLeaderboard = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const leaderboard = await Donation.aggregate([
      { $match: { status: 'completed', isAnonymous: false } },
      { $group: { _id: '$donatedBy', totalAmount: { $sum: '$amount' }, donationCount: { $sum: 1 } } },
      { $sort: { totalAmount: -1 } },
      { $limit: parseInt(limit) },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: {
        totalAmount: { $round: ['$totalAmount', 2] },
        donationCount: 1,
        user: {
          _id: '$user._id',
          fullName: '$user.fullName',
          profilePic: '$user.profilePic'
        }
      }}
    ]);

    res.json({
      leaderboard,
      success: true
    });
  } catch (error) {
    console.error('Error getting donation leaderboard:', error);
    res.status(500).json({
      message: 'Failed to load donation leaderboard',
      success: false
    });
  }
}

// Get public stats (no auth required)
export const getPublicStats = async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;

    // Get basic public stats
    const activeUsers = await User.countDocuments({});

    res.json({
      activeUsers,
      success: true
    });
  } catch (error) {
    console.error('Error getting public stats:', error);
    res.status(500).json({
      message: 'Failed to load public statistics',
      success: false
    });
  }
};

// Helper function to format time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
}