import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  donorName: {
    type: String,
    required: true,
    trim: true
  },
  donorEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500
  },
  tier: {
    type: String,
    enum: ['coffee', 'lunch', 'premium', 'custom'],
    default: 'custom'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed' // For now, assume all donations are completed
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'crypto', 'other'],
    default: 'other'
  },
  transactionId: {
    type: String,
    trim: true
  },
  donatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Index for efficient queries
donationSchema.index({ createdAt: -1 });
donationSchema.index({ donatedBy: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ tier: 1 });

// Virtual for formatted amount
donationSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Static method to get donation stats
donationSchema.statics.getStats = async function() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    totalSupporters,
    monthlyDonations,
    yearlyDonations,
    averageDonation,
    topDonors
  ] = await Promise.all([
    // Total unique supporters
    this.distinct('donatedBy').then(ids => ids.length),

    // Monthly donations total
    this.aggregate([
      { $match: { createdAt: { $gte: startOfMonth }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).then(result => result[0]?.total || 0),

    // Yearly donations total
    this.aggregate([
      { $match: { createdAt: { $gte: startOfYear }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).then(result => result[0]?.total || 0),

    // Average donation amount
    this.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$amount' } } }
    ]).then(result => result[0]?.avg || 0),

    // Top donors by total amount
    this.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$donatedBy', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { total: 1, count: 1, user: { fullName: 1, email: 1 } } }
    ])
  ]);

  return {
    totalSupporters,
    monthlyDonations: Math.round(monthlyDonations * 100) / 100,
    yearlyDonations: Math.round(yearlyDonations * 100) / 100,
    averageDonation: Math.round(averageDonation * 100) / 100,
    topDonors
  };
};

const Donation = mongoose.Schema ? mongoose.model('Donation', donationSchema) : mongoose.model('Donation');

export default Donation;