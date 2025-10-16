import FeatureRequest from '../models/FeatureRequest.js';
import { sendFeatureRequestNotification, sendVoteUpdateNotification, sendStatusUpdateNotification } from '../services/discordWebhook.js';

// Rate limiting store (in production, use Redis)
// Clear rate limit store for testing
const rateLimitStore = new Map();
rateLimitStore.clear(); // Clear rate limits for testing

/**
 * Submit a new feature request
 */
export const submitFeatureRequest = async (req, res) => {
  try {
    const { title, description, category, contactEmail, tags, isAnonymous = false } = req.body;
    const userId = req.user?._id; // Optional authentication

    // Debug logging
    console.log('Feature request submission:', {
      userId: userId || 'No user ID',
      isAnonymous,
      hasUser: !!req.user,
      title: title?.substring(0, 50) + '...',
      category
    });

    /*
    // Rate limiting check (50 requests per hour per IP for testing)
    const clientIP = req.ip || req.connection.remoteAddress;
    const rateLimitKey = `feature_request_${clientIP}`;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (rateLimitStore.has(rateLimitKey)) {
      const lastRequest = rateLimitStore.get(rateLimitKey);
      if (now - lastRequest < oneHour) {
        return res.status(429).json({
          message: 'Too many feature requests. Please wait before submitting another.',
          success: false
        });
      }
    }
    */

    // Input validation
    if (!title?.trim() || !description?.trim() || !category) {
      return res.status(400).json({
        message: 'Title, description, and category are required.',
        success: false
      });
    }

    if (title.length < 5 || title.length > 100) {
      return res.status(400).json({
        message: 'Title must be between 5 and 100 characters.',
        success: false
      });
    }

    if (description.length < 20 || description.length > 1000) {
      return res.status(400).json({
        message: 'Description must be between 20 and 1000 characters.',
        success: false
      });
    }

    // Validate category
    const validCategories = ['ui', 'feature', 'improvement', 'bug'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        message: 'Invalid category selected.',
        success: false
      });
    }

    // Validate email if provided
    if (contactEmail && !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(contactEmail)) {
      return res.status(400).json({
        message: 'Please provide a valid email address.',
        success: false
      });
    }

    // Determine if request should be anonymous
    // If user is not authenticated, force anonymous
    // If user is authenticated but isAnonymous is true, make it anonymous
    const shouldBeAnonymous = !userId || isAnonymous;

    // Create the feature request
    const featureRequest = await FeatureRequest.create({
      title: title.trim(),
      description: description.trim(),
      category,
      contactEmail: contactEmail?.trim().toLowerCase(),
      tags: tags?.filter(tag => tag.trim()).map(tag => tag.trim()) || [],
      submittedBy: shouldBeAnonymous ? null : userId
    });

    // Populate user data if not anonymous and user exists
    if (!shouldBeAnonymous && userId) {
      await featureRequest.populate('submittedBy', 'fullName profilePic');
    }

    // Send Discord notification (don't wait for it)
    sendFeatureRequestNotification(featureRequest).catch(error => {
      console.error('Failed to send Discord notification:', error);
    });

    // Update rate limiting
    // rateLimitStore.set(rateLimitKey, now);

    res.status(201).json({
      message: `Feature request submitted successfully! ${shouldBeAnonymous ? '(Anonymous)' : '(Public)'}`,
      featureRequest: {
        id: featureRequest._id,
        title: featureRequest.title,
        category: featureRequest.category,
        status: featureRequest.status,
        upvotes: featureRequest.upvotes,
        downvotes: featureRequest.downvotes,
        isAnonymous: shouldBeAnonymous,
        submittedBy: shouldBeAnonymous ? null : featureRequest.submittedBy,
        createdAt: featureRequest.createdAt
      },
      success: true
    });

  } catch (error) {
    console.error('Error submitting feature request:', error);
    res.status(500).json({
      message: 'Failed to submit feature request. Please try again.',
      success: false
    });
  }
};

/**
 * Vote on a feature request
 */
export const voteOnFeatureRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // 'up' or 'down'
    const userId = req.user?._id;

    // Require authentication for voting
    if (!userId) {
      return res.status(401).json({
        message: 'Authentication required to vote.',
        success: false
      });
    }

    // Validate vote type
    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({
        message: 'Invalid vote type. Must be "up" or "down".',
        success: false
      });
    }

    // Find the feature request
    const featureRequest = await FeatureRequest.findById(id);
    if (!featureRequest) {
      return res.status(404).json({
        message: 'Feature request not found.',
        success: false
      });
    }

    // Check if user already voted
    const existingVote = featureRequest.userVotes.find(vote => vote.userId.toString() === userId.toString());

    // Calculate old score for comparison
    const oldScore = featureRequest.upvotes - featureRequest.downvotes;

    // Toggle vote
    await featureRequest.toggleVote(userId, voteType);

    // Refresh the document
    await featureRequest.populate('submittedBy', 'fullName profilePic');

    // Calculate new score
    const newScore = featureRequest.upvotes - featureRequest.downvotes;

    // Send Discord notification for significant vote changes
    if (Math.abs(newScore - oldScore) > 0) {
      sendVoteUpdateNotification(featureRequest, voteType, newScore).catch(error => {
        console.error('Failed to send vote notification:', error);
      });
    }

    // Emit real-time update via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('featureRequest:vote', {
        id: featureRequest._id,
        upvotes: featureRequest.upvotes,
        downvotes: featureRequest.downvotes,
        voteScore: newScore,
        userVote: voteType,
        title: featureRequest.title,
        category: featureRequest.category,
        status: featureRequest.status
      });
    }

    res.json({
      message: 'Vote recorded successfully!',
      featureRequest: {
        id: featureRequest._id,
        upvotes: featureRequest.upvotes,
        downvotes: featureRequest.downvotes,
        voteScore: newScore,
        userVote: voteType
      },
      success: true
    });

  } catch (error) {
    console.error('Error voting on feature request:', error);
    res.status(500).json({
      message: 'Failed to record vote. Please try again.',
      success: false
    });
  }
};

/**
 * Get trending feature requests
 */
export const getTrendingRequests = async (req, res) => {
  try {
    const { limit = 10, category } = req.query;

    let query = { status: { $in: ['pending', 'reviewing', 'approved'] } };
    if (category && category !== 'all') {
      query.category = category;
    }

    const requests = await FeatureRequest.find(query)
      .sort({ voteScore: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .populate('submittedBy', 'fullName profilePic')
      .lean();

    // Get user's votes if authenticated
    if (req.user) {
      const userVotes = await FeatureRequest.getUserVote(null, req.user._id);
      // Add user vote info to each request
      requests.forEach(request => {
        const userVote = request.userVotes?.find(vote => vote.userId.toString() === req.user._id.toString());
        request.userVote = userVote ? userVote.voteType : null;
      });
    }

    res.json({
      requests,
      success: true
    });

  } catch (error) {
    console.error('Error getting trending requests:', error);
    res.status(500).json({
      message: 'Failed to load feature requests.',
      success: false
    });
  }
};

/**
 * Get user's vote on a specific request
 */
export const getUserVote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        message: 'Authentication required.',
        success: false
      });
    }

    const userVote = await FeatureRequest.getUserVote(id, userId);

    res.json({
      userVote,
      success: true
    });

  } catch (error) {
    console.error('Error getting user vote:', error);
    res.status(500).json({
      message: 'Failed to get vote information.',
      success: false
    });
  }
};

/**
 * Get feature requests by category
 */
export const getRequestsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20 } = req.query;

    const validCategories = ['ui', 'feature', 'improvement', 'bug'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        message: 'Invalid category.',
        success: false
      });
    }

    const requests = await FeatureRequest.getByCategory(category, parseInt(limit));

    res.json({
      requests,
      success: true
    });

  } catch (error) {
    console.error('Error getting requests by category:', error);
    res.status(500).json({
      message: 'Failed to load requests.',
      success: false
    });
  }
};

// Admin-only functions
export const getAllFeatureRequests = async (req, res) => {
  try {
    const requests = await FeatureRequest.find()
      .sort({ createdAt: -1 })
      .populate('submittedBy', 'fullName profilePic');
    res.json({ requests, success: true });
  } catch (error) {
    console.error('Error getting all feature requests:', error);
    res.status(500).json({ message: 'Failed to load feature requests.', success: false });
  }
};

export const updateFeatureRequestStatus = async (req, res) => {
   try {
     const { id } = req.params;
     const { status, category } = req.body;

     const validStatuses = ['pending', 'reviewing', 'approved', 'denied', 'implemented'];
     if (!validStatuses.includes(status)) {
       return res.status(400).json({ message: 'Invalid status.', success: false });
     }

     const updateData = { status };
     if (category) updateData.category = category;

     const featureRequest = await FeatureRequest.findByIdAndUpdate(id, updateData, { new: true })
       .populate('submittedBy', 'fullName profilePic');

     if (!featureRequest) {
       return res.status(404).json({ message: 'Feature request not found.', success: false });
     }

     // Emit real-time update via Socket.io
     const io = req.app.get('io');
     if (io) {
       io.emit('featureRequest:statusUpdated', {
         id: featureRequest._id,
         status: featureRequest.status,
         category: featureRequest.category,
         title: featureRequest.title,
         updatedAt: featureRequest.updatedAt
       });
     }

     res.json({ featureRequest, success: true });
   } catch (error) {
     console.error('Error updating feature request status:', error);
     res.status(500).json({ message: 'Failed to update status.', success: false });
   }
};

export const deleteFeatureRequest = async (req, res) => {
   try {
     const { id } = req.params;
     const featureRequest = await FeatureRequest.findByIdAndDelete(id);

     if (!featureRequest) {
       return res.status(404).json({ message: 'Feature request not found.', success: false });
     }

     // Emit real-time update via Socket.io
     const io = req.app.get('io');
     if (io) {
       io.emit('featureRequest:deleted', {
         id: featureRequest._id,
         title: featureRequest.title
       });
     }

     res.json({ message: 'Feature request deleted successfully.', success: true });
   } catch (error) {
     console.error('Error deleting feature request:', error);
     res.status(500).json({ message: 'Failed to delete feature request.', success: false });
   }
};

/**
 * Approve a feature request
 */
export const approveFeatureRequest = async (req, res) => {
   try {
     const { id } = req.params;
     const adminId = req.user._id;

     const featureRequest = await FeatureRequest.findByIdAndUpdate(
       id,
       {
         status: 'approved',
         $unset: { denialReason: 1, deniedAt: 1, deniedBy: 1 }
       },
       { new: true }
     ).populate('submittedBy', 'fullName profilePic');

     if (!featureRequest) {
       return res.status(404).json({ message: 'Feature request not found.', success: false });
     }

     // Send Discord notification
     sendStatusUpdateNotification(featureRequest, 'approved').catch(error => {
       console.error('Failed to send approval notification:', error);
     });

     // Emit real-time update via Socket.io
     const io = req.app.get('io');
     if (io) {
       io.emit('featureRequest:statusUpdated', {
         id: featureRequest._id,
         status: featureRequest.status,
         category: featureRequest.category,
         title: featureRequest.title,
         updatedAt: featureRequest.updatedAt
       });
     }

     res.json({
       message: 'Feature request approved successfully!',
       featureRequest,
       success: true
     });
   } catch (error) {
     console.error('Error approving feature request:', error);
     res.status(500).json({ message: 'Failed to approve feature request.', success: false });
   }
};

/**
 * Decline/Deny a feature request
 */
export const declineFeatureRequest = async (req, res) => {
   try {
     const { id } = req.params;
     const { reason } = req.body;
     const adminId = req.user._id;

     // Validate reason
     if (!reason?.trim()) {
       return res.status(400).json({
         message: 'Denial reason is required.',
         success: false
       });
     }

     if (reason.length > 500) {
       return res.status(400).json({
         message: 'Denial reason must be less than 500 characters.',
         success: false
       });
     }

     const featureRequest = await FeatureRequest.findByIdAndUpdate(
       id,
       {
         status: 'denied',
         denialReason: reason.trim(),
         deniedAt: new Date(),
         deniedBy: adminId
       },
       { new: true }
     ).populate('submittedBy', 'fullName profilePic').populate('deniedBy', 'fullName');

     if (!featureRequest) {
       return res.status(404).json({ message: 'Feature request not found.', success: false });
     }

     // Send Discord notification
     sendStatusUpdateNotification(featureRequest, 'denied', reason).catch(error => {
       console.error('Failed to send denial notification:', error);
     });

     // Emit real-time update via Socket.io
     const io = req.app.get('io');
     if (io) {
       io.emit('featureRequest:statusUpdated', {
         id: featureRequest._id,
         status: featureRequest.status,
         category: featureRequest.category,
         title: featureRequest.title,
         updatedAt: featureRequest.updatedAt
       });
     }

     res.json({
       message: 'Feature request denied successfully!',
       featureRequest,
       success: true
     });
   } catch (error) {
     console.error('Error denying feature request:', error);
     res.status(500).json({ message: 'Failed to deny feature request.', success: false });
   }
};

/**
 * Clean up old denied requests (older than 1 day)
 */
export const cleanupDeniedRequests = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await FeatureRequest.deleteMany({
      status: 'denied',
      deniedAt: { $lt: oneDayAgo }
    });

    res.json({
      message: `Cleaned up ${result.deletedCount} old denied requests.`,
      deletedCount: result.deletedCount,
      success: true
    });
  } catch (error) {
    console.error('Error cleaning up denied requests:', error);
    res.status(500).json({ message: 'Failed to cleanup denied requests.', success: false });
  }
};