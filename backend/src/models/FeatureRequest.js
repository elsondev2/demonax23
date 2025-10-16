import mongoose from 'mongoose';

const featureRequestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 20,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['ui', 'feature', 'improvement', 'bug'],
    default: 'feature'
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'approved', 'denied', 'implemented'],
    default: 'pending'
  },
  denialReason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  deniedAt: {
    type: Date,
    default: null
  },
  deniedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  // Voting system
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  userVotes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    voteType: {
      type: String,
      enum: ['up', 'down'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Enhanced fields
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Allow anonymous submissions
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],

  // Discord integration
  discordMessageId: {
    type: String,
    default: null
  },

  // Metadata
  viewCount: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
featureRequestSchema.index({ createdAt: -1 });
featureRequestSchema.index({ status: 1, createdAt: -1 });
featureRequestSchema.index({ category: 1, status: 1 });
featureRequestSchema.index({ upvotes: -1, createdAt: -1 });
featureRequestSchema.index({ 'userVotes.userId': 1 }); // For vote lookup

// Virtual for vote score
featureRequestSchema.virtual('voteScore').get(function() {
  return this.upvotes - this.downvotes;
});

// Virtual for total votes
featureRequestSchema.virtual('totalVotes').get(function() {
  return this.upvotes + this.downvotes;
});

// Static method to get trending requests
featureRequestSchema.statics.getTrending = async function(limit = 10) {
  return this.find({ status: { $in: ['pending', 'reviewing', 'approved'] } })
    .sort({ voteScore: -1, createdAt: -1 })
    .limit(limit)
    .populate('submittedBy', 'fullName profilePic')
    .lean();
};

// Static method to get requests by category
featureRequestSchema.statics.getByCategory = async function(category, limit = 20) {
  return this.find({ category, status: { $in: ['pending', 'reviewing', 'approved'] } })
    .sort({ voteScore: -1, createdAt: -1 })
    .limit(limit)
    .populate('submittedBy', 'fullName profilePic')
    .lean();
};

// Instance method to add/remove vote
featureRequestSchema.methods.toggleVote = async function(userId, voteType) {
  const existingVote = this.userVotes.find(vote => vote.userId.toString() === userId.toString());

  if (existingVote) {
    // If same vote type, remove the vote
    if (existingVote.voteType === voteType) {
      this.userVotes = this.userVotes.filter(vote => vote.userId.toString() !== userId.toString());
      if (voteType === 'up') {
        this.upvotes = Math.max(0, this.upvotes - 1);
      } else {
        this.downvotes = Math.max(0, this.downvotes - 1);
      }
    } else {
      // Change vote type
      if (voteType === 'up') {
        this.upvotes += 1;
        this.downvotes = Math.max(0, this.downvotes - 1);
      } else {
        this.downvotes += 1;
        this.upvotes = Math.max(0, this.upvotes - 1);
      }
      existingVote.voteType = voteType;
    }
  } else {
    // New vote
    this.userVotes.push({ userId, voteType });
    if (voteType === 'up') {
      this.upvotes += 1;
    } else {
      this.downvotes += 1;
    }
  }

  this.lastActivity = new Date();
  return this.save();
};

// Static method to get user's vote on a request
featureRequestSchema.statics.getUserVote = async function(requestId, userId) {
  const request = await this.findById(requestId);
  if (!request) return null;

  const userVote = request.userVotes.find(vote => vote.userId.toString() === userId.toString());
  return userVote ? userVote.voteType : null;
};

const FeatureRequest = mongoose.model('FeatureRequest', featureRequestSchema);

export default FeatureRequest;