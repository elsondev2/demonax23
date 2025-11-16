import cron from 'node-cron';
import User from '../models/User.js';

/**
 * Check and expire premium subscriptions
 * Runs daily at midnight
 */
export const startPremiumExpirationJob = () => {
  // Run every day at midnight (0 0 * * *)
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('🔍 Running premium expiration check...');
      
      const now = new Date();
      
      // Find all premium users whose subscription has expired
      const expiredUsers = await User.find({
        isPremium: true,
        premiumTier: { $ne: 'lifetime' }, // Don't check lifetime users
        premiumEndDate: { $lte: now }
      });
      
      if (expiredUsers.length === 0) {
        console.log('✅ No expired premium subscriptions found');
        return;
      }
      
      console.log(`⚠️  Found ${expiredUsers.length} expired premium subscriptions`);
      
      // Update each expired user
      for (const user of expiredUsers) {
        user.isPremium = false;
        user.premiumTier = 'free';
        user.paymentStatus = 'expired';
        await user.save();
        
        console.log(`   ❌ Expired premium for user: ${user.email}`);
        
        // TODO: Send notification email to user
        // await sendExpirationEmail(user.email, user.fullName);
      }
      
      console.log(`✅ Premium expiration check completed. ${expiredUsers.length} subscriptions expired.`);
    } catch (error) {
      console.error('❌ Error in premium expiration job:', error);
    }
  });
  
  console.log('✅ Premium expiration cron job started (runs daily at midnight)');
};

/**
 * Manual check for testing purposes
 */
export const checkExpiredPremiumNow = async () => {
  try {
    console.log('🔍 Manual premium expiration check...');
    
    const now = new Date();
    
    const expiredUsers = await User.find({
      isPremium: true,
      premiumTier: { $ne: 'lifetime' },
      premiumEndDate: { $lte: now }
    });
    
    if (expiredUsers.length === 0) {
      console.log('✅ No expired premium subscriptions found');
      return { expired: 0 };
    }
    
    for (const user of expiredUsers) {
      user.isPremium = false;
      user.premiumTier = 'free';
      user.paymentStatus = 'expired';
      await user.save();
      
      console.log(`   ❌ Expired premium for user: ${user.email}`);
    }
    
    console.log(`✅ Expired ${expiredUsers.length} premium subscriptions`);
    return { expired: expiredUsers.length };
  } catch (error) {
    console.error('❌ Error in manual premium expiration check:', error);
    throw error;
  }
};
