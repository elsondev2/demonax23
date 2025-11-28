import AppRequest from "../models/AppRequest.js";

const APP_REQUEST_WEBHOOK_URL = 'https://discord.com/api/webhooks/1443750264493445242/6f9KA-bPAYbhLKgYzmNP9Dy6S5Bpja1GOfC7_umy3w8bou5_bw349Mg6UM5sGEtkDVh-yh';

const sendAppRequestToDiscord = async (appRequest, user, isUpdate = false) => {
  try {
    const embed = {
      title: `${isUpdate ? '📝' : '🆕'} App Integration Request: ${appRequest.appName}`,
      description: appRequest.appDescription,
      color: isUpdate ? 16776960 : 5814783,
      fields: [
        { name: '📱 App Details', value: `**Name:** ${appRequest.appName}\n**Category:** ${appRequest.appCategory}`, inline: false },
        { name: '👤 Requested By', value: `**User:** ${user.fullName}`, inline: true },
        { name: '📊 Status', value: `**Status:** ${appRequest.status.toUpperCase()}`, inline: true }
      ],
      timestamp: new Date().toISOString()
    };
    await fetch(APP_REQUEST_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed], username: 'App Request System' })
    });
  } catch (error) {
    console.error('Error sending to Discord:', error);
  }
};

export const createAppRequest = async (req, res) => {
  try {
    const { appName, appDescription, appUrl, appCategory } = req.body;
    const userId = req.user._id;

    if (!appName || !appDescription) {
      return res.status(400).json({ message: "App name and description are required" });
    }

    const existingRequest = await AppRequest.findOne({
      appName: { $regex: new RegExp(`^${appName}$`, 'i') },
      requestedBy: userId
    });

    if (existingRequest) {
      return res.status(400).json({ message: "You have already requested this app" });
    }

    const appRequest = new AppRequest({
      appName, appDescription, appUrl,
      appCategory: appCategory || 'other',
      requestedBy: userId,
      votes: { upvotes: [userId], downvotes: [] }
    });

    await appRequest.save();
    await appRequest.populate('requestedBy', 'fullName email username profilePic');

    await sendAppRequestToDiscord(appRequest, req.user);

    res.status(201).json({ success: true, message: "App request submitted successfully", appRequest });
  } catch (error) {
    console.error("Error creating app request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

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

    const requestsWithVotes = appRequests.map(request => ({
      ...request,
      voteCount: (request.votes.upvotes?.length || 0) - (request.votes.downvotes?.length || 0),
      upvoteCount: request.votes.upvotes?.length || 0,
      downvoteCount: request.votes.downvotes?.length || 0
    }));

    res.status(200).json({ success: true, appRequests: requestsWithVotes });
  } catch (error) {
    console.error("Error fetching app requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

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
    res.status(200).json({ success: true, appRequest });
  } catch (error) {
    console.error("Error fetching app request:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const voteAppRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
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
        appRequest.votes.upvotes = appRequest.votes.upvotes.filter(i => i.toString() !== userId.toString());
      } else {
        appRequest.votes.upvotes.push(userId);
        appRequest.votes.downvotes = appRequest.votes.downvotes.filter(i => i.toString() !== userId.toString());
      }
    } else {
      if (hasDownvoted) {
        appRequest.votes.downvotes = appRequest.votes.downvotes.filter(i => i.toString() !== userId.toString());
      } else {
        appRequest.votes.downvotes.push(userId);
        appRequest.votes.upvotes = appRequest.votes.upvotes.filter(i => i.toString() !== userId.toString());
      }
    }

    await appRequest.save();
    await appRequest.populate('requestedBy', 'fullName email username profilePic subscriptionPlan premiumTier');

    res.status(200).json({ success: true, message: "Vote recorded", appRequest });
  } catch (error) {
    console.error("Error voting:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


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
    await sendAppRequestToDiscord(appRequest, appRequest.requestedBy, true);

    res.status(200).json({ success: true, message: "Status updated", appRequest });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAppRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const appRequest = await AppRequest.findByIdAndDelete(id);
    if (!appRequest) {
      return res.status(404).json({ message: "App request not found" });
    }
    res.status(200).json({ success: true, message: "App request deleted" });
  } catch (error) {
    console.error("Error deleting:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAppRequestStats = async (req, res) => {
  try {
    const total = await AppRequest.countDocuments();
    const pending = await AppRequest.countDocuments({ status: 'pending' });
    const reviewing = await AppRequest.countDocuments({ status: 'reviewing' });
    const approved = await AppRequest.countDocuments({ status: 'approved' });
    const rejected = await AppRequest.countDocuments({ status: 'rejected' });
    const implemented = await AppRequest.countDocuments({ status: 'implemented' });

    res.status(200).json({
      success: true,
      stats: { total, pending, reviewing, approved, rejected, implemented }
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
