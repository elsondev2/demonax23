import User from "../models/User.js";

// Get all users with payment info (Admin only)
export const getAllPayments = async (req, res) => {
  try {
    const { filter } = req.query; // 'all', 'premium', 'supporters', 'expired'
    
    let query = {};
    
    if (filter === 'premium') {
      query.isPremium = true;
    } else if (filter === 'supporters') {
      query.isSupporter = true;
    } else if (filter === 'expired') {
      query.paymentStatus = 'expired';
    }
    
    const users = await User.find(query)
      .select('fullName email username profilePic isPremium premiumTier premiumStartDate premiumEndDate isSupporter supporterTier totalDonated paymentStatus')
      .sort({ createdAt: -1 });
    
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in getAllPayments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get payment statistics (Admin only)
export const getPaymentStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({ isPremium: true });
    const supporters = await User.countDocuments({ isSupporter: true });
    
    // Calculate total revenue
    const allUsers = await User.find().select('totalDonated');
    const totalRevenue = allUsers.reduce((sum, user) => sum + (user.totalDonated || 0), 0);
    
    // Expiring soon (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const expiringSoon = await User.countDocuments({
      isPremium: true,
      premiumEndDate: { $lte: sevenDaysFromNow, $gte: new Date() }
    });
    
    res.status(200).json({
      totalUsers,
      premiumUsers,
      supporters,
      totalRevenue,
      expiringSoon,
      conversionRate: totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error("Error in getPaymentStats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Set user premium status (Admin only)
export const setPremium = async (req, res) => {
  try {
    const { userId } = req.params;
    const { tier, duration } = req.body; // tier: 'basic', 'pro', 'lifetime'; duration in days
    
    if (!tier || !['basic', 'pro', 'lifetime'].includes(tier)) {
      return res.status(400).json({ message: "Invalid premium tier" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const startDate = new Date();
    let endDate = null;
    let premiumDuration = 0;
    
    if (tier === 'lifetime') {
      endDate = null; // No expiration
      premiumDuration = -1; // Indicates lifetime
    } else {
      if (!duration || duration <= 0) {
        return res.status(400).json({ message: "Duration required for non-lifetime premium" });
      }
      premiumDuration = duration;
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration);
    }
    
    user.isPremium = true;
    user.premiumTier = tier;
    user.premiumStartDate = startDate;
    user.premiumEndDate = endDate;
    user.premiumDuration = premiumDuration;
    user.paymentStatus = 'active';
    
    await user.save();
    
    res.status(200).json({
      message: "Premium status updated successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        isPremium: user.isPremium,
        premiumTier: user.premiumTier,
        premiumStartDate: user.premiumStartDate,
        premiumEndDate: user.premiumEndDate
      }
    });
  } catch (error) {
    console.error("Error in setPremium:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Extend premium duration (Admin only)
export const extendPremium = async (req, res) => {
  try {
    const { userId } = req.params;
    const { additionalDays } = req.body;
    
    if (!additionalDays || additionalDays <= 0) {
      return res.status(400).json({ message: "Invalid additional days" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.isPremium) {
      return res.status(400).json({ message: "User is not premium" });
    }
    
    if (user.premiumTier === 'lifetime') {
      return res.status(400).json({ message: "Cannot extend lifetime premium" });
    }
    
    // Extend from current end date or now (whichever is later)
    const baseDate = user.premiumEndDate && user.premiumEndDate > new Date() 
      ? new Date(user.premiumEndDate) 
      : new Date();
    
    const newEndDate = new Date(baseDate);
    newEndDate.setDate(newEndDate.getDate() + additionalDays);
    
    user.premiumEndDate = newEndDate;
    user.premiumDuration += additionalDays;
    user.paymentStatus = 'active';
    
    await user.save();
    
    res.status(200).json({
      message: `Premium extended by ${additionalDays} days`,
      user: {
        _id: user._id,
        fullName: user.fullName,
        premiumEndDate: user.premiumEndDate
      }
    });
  } catch (error) {
    console.error("Error in extendPremium:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Cancel premium (Admin only)
export const cancelPremium = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    user.isPremium = false;
    user.premiumTier = 'free';
    user.premiumEndDate = null;
    user.paymentStatus = 'cancelled';
    
    await user.save();
    
    res.status(200).json({
      message: "Premium cancelled successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    console.error("Error in cancelPremium:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add donation (Admin only)
export const addDonation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, note } = req.body;
    const adminId = req.user._id;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid donation amount" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Add to donation history
    user.donationHistory.push({
      amount,
      note: note || "",
      addedBy: adminId,
      date: new Date()
    });
    
    // Update total donated
    user.totalDonated += amount;
    user.lastDonationDate = new Date();
    user.isSupporter = true;
    
    // Determine supporter tier based on total donated
    if (user.totalDonated >= 100) {
      user.supporterTier = 'platinum';
    } else if (user.totalDonated >= 50) {
      user.supporterTier = 'gold';
    } else if (user.totalDonated >= 20) {
      user.supporterTier = 'silver';
    } else if (user.totalDonated >= 5) {
      user.supporterTier = 'bronze';
    }
    
    await user.save();
    
    res.status(200).json({
      message: "Donation added successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        totalDonated: user.totalDonated,
        supporterTier: user.supporterTier,
        donationHistory: user.donationHistory
      }
    });
  } catch (error) {
    console.error("Error in addDonation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update donation (Admin only)
export const updateDonation = async (req, res) => {
  try {
    const { userId, donationIndex } = req.params;
    const { amount, note } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid donation amount" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.donationHistory || user.donationHistory.length === 0) {
      return res.status(400).json({ message: "No donation history found" });
    }
    
    const index = parseInt(donationIndex);
    if (isNaN(index) || index < 0 || index >= user.donationHistory.length) {
      return res.status(400).json({ message: "Invalid donation index" });
    }
    
    // Get the old amount
    const oldAmount = user.donationHistory[index].amount;
    
    // Update the donation
    user.donationHistory[index].amount = amount;
    user.donationHistory[index].note = note || "";
    
    // Update total donated
    user.totalDonated = user.totalDonated - oldAmount + amount;
    
    // Recalculate supporter tier based on new total
    if (user.totalDonated >= 100000) {
      user.supporterTier = 'platinum';
    } else if (user.totalDonated >= 50000) {
      user.supporterTier = 'gold';
    } else if (user.totalDonated >= 20000) {
      user.supporterTier = 'silver';
    } else if (user.totalDonated >= 6000) {
      user.supporterTier = 'bronze';
    } else {
      user.supporterTier = null;
      user.isSupporter = user.totalDonated > 0;
    }
    
    await user.save();
    
    res.status(200).json({
      message: "Donation updated successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        totalDonated: user.totalDonated,
        supporterTier: user.supporterTier,
        donationHistory: user.donationHistory
      }
    });
  } catch (error) {
    console.error("Error in updateDonation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove donation (Admin only)
export const removeDonation = async (req, res) => {
  try {
    const { userId, donationIndex } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.donationHistory || user.donationHistory.length === 0) {
      return res.status(400).json({ message: "No donation history found" });
    }
    
    const index = parseInt(donationIndex);
    if (isNaN(index) || index < 0 || index >= user.donationHistory.length) {
      return res.status(400).json({ message: "Invalid donation index" });
    }
    
    // Get the donation amount before removing
    const removedDonation = user.donationHistory[index];
    const removedAmount = removedDonation.amount;
    
    // Remove the donation from history
    user.donationHistory.splice(index, 1);
    
    // Update total donated
    user.totalDonated = Math.max(0, user.totalDonated - removedAmount);
    
    // Recalculate supporter tier based on new total (TSh amounts)
    if (user.totalDonated >= 100000) {
      user.supporterTier = 'platinum';
    } else if (user.totalDonated >= 50000) {
      user.supporterTier = 'gold';
    } else if (user.totalDonated >= 20000) {
      user.supporterTier = 'silver';
    } else if (user.totalDonated >= 6000) {
      user.supporterTier = 'bronze';
    } else {
      user.supporterTier = null;
      user.isSupporter = false;
    }
    
    // Update last donation date if there are remaining donations
    if (user.donationHistory.length > 0) {
      const lastDonation = user.donationHistory[user.donationHistory.length - 1];
      user.lastDonationDate = lastDonation.date;
    } else {
      user.lastDonationDate = null;
    }
    
    await user.save();
    
    res.status(200).json({
      message: "Donation removed successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        totalDonated: user.totalDonated,
        supporterTier: user.supporterTier,
        isSupporter: user.isSupporter,
        donationHistory: user.donationHistory
      }
    });
  } catch (error) {
    console.error("Error in removeDonation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update supporter status (Admin only)
export const updateSupporterStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { supporterTier, totalDonated, isSupporter } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Validate supporter tier
    const validTiers = ['bronze', 'silver', 'gold', 'platinum'];
    if (supporterTier && !validTiers.includes(supporterTier)) {
      return res.status(400).json({ message: "Invalid supporter tier" });
    }
    
    // Update supporter status
    user.supporterTier = supporterTier;
    user.totalDonated = totalDonated || 0;
    user.isSupporter = isSupporter !== undefined ? isSupporter : (totalDonated > 0);
    
    await user.save();
    
    res.status(200).json({
      message: "Supporter status updated successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        supporterTier: user.supporterTier,
        totalDonated: user.totalDonated,
        isSupporter: user.isSupporter
      }
    });
  } catch (error) {
    console.error("Error in updateSupporterStatus:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove supporter status (Admin only)
export const removeSupporterStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Remove supporter status and clear donation history
    user.isSupporter = false;
    user.supporterTier = null;
    user.totalDonated = 0;
    user.donationHistory = [];
    user.lastDonationDate = null;
    
    await user.save();
    
    res.status(200).json({
      message: "Supporter status removed successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        isSupporter: user.isSupporter,
        supporterTier: user.supporterTier,
        totalDonated: user.totalDonated
      }
    });
  } catch (error) {
    console.error("Error in removeSupporterStatus:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update payment notes (Admin only)
export const updatePaymentNotes = async (req, res) => {
  try {
    const { userId } = req.params;
    const { notes } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    user.paymentNotes = notes || "";
    await user.save();
    
    res.status(200).json({
      message: "Payment notes updated successfully",
      paymentNotes: user.paymentNotes
    });
  } catch (error) {
    console.error("Error in updatePaymentNotes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get user's own premium status
export const getMyPremiumStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId)
      .select('isPremium premiumTier premiumStartDate premiumEndDate isSupporter supporterTier totalDonated paymentStatus subscriptionPlan');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({
      isPremium: user.isPremium,
      premiumTier: user.premiumTier,
      subscriptionPlan: user.subscriptionPlan,
      premiumStartDate: user.premiumStartDate,
      premiumEndDate: user.premiumEndDate,
      isSupporter: user.isSupporter,
      supporterTier: user.supporterTier,
      totalDonated: user.totalDonated,
      paymentStatus: user.paymentStatus,
      daysRemaining: user.premiumEndDate ? Math.ceil((user.premiumEndDate - new Date()) / (1000 * 60 * 60 * 24)) : null
    });
  } catch (error) {
    console.error("Error in getMyPremiumStatus:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Activate subscription (Admin only)
export const activateSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan, duration, donationAmount } = req.body; // plan: 'base', 'pro', 'premium'; duration in days
    
    if (!plan || !['base', 'pro', 'premium'].includes(plan)) {
      return res.status(400).json({ message: "Invalid subscription plan" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Set subscription duration (default 30 days)
    const subscriptionDuration = duration || 30;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + subscriptionDuration);
    
    // Map plan to premium tier
    let premiumTier = 'basic';
    if (plan === 'pro') premiumTier = 'pro';
    if (plan === 'premium') premiumTier = 'pro'; // Both pro and premium use 'pro' tier
    
    // Update subscription
    user.isPremium = true;
    user.premiumTier = premiumTier;
    user.subscriptionPlan = plan;
    user.premiumStartDate = startDate;
    user.premiumEndDate = endDate;
    user.premiumDuration = subscriptionDuration;
    user.paymentStatus = 'active';
    
    // Handle donation if provided
    if (donationAmount && donationAmount > 0) {
      user.donationHistory.push({
        amount: donationAmount,
        note: `Donation with ${plan} plan subscription`,
        addedBy: req.user._id,
        date: new Date()
      });
      
      user.totalDonated += donationAmount;
      user.lastDonationDate = new Date();
      user.isSupporter = true;
      
      // Update supporter tier based on total donated (TSh)
      if (user.totalDonated >= 100000) {
        user.supporterTier = 'platinum';
      } else if (user.totalDonated >= 50000) {
        user.supporterTier = 'gold';
      } else if (user.totalDonated >= 20000) {
        user.supporterTier = 'silver';
      } else if (user.totalDonated >= 6000) {
        user.supporterTier = 'bronze';
      }
    }
    
    await user.save();
    
    res.status(200).json({
      message: "Subscription activated successfully",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        isPremium: user.isPremium,
        subscriptionPlan: user.subscriptionPlan,
        premiumTier: user.premiumTier,
        premiumStartDate: user.premiumStartDate,
        premiumEndDate: user.premiumEndDate,
        isSupporter: user.isSupporter,
        supporterTier: user.supporterTier,
        totalDonated: user.totalDonated
      }
    });
  } catch (error) {
    console.error("Error in activateSubscription:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
