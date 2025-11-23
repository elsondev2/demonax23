# Payment System Implementation Guide

## Overview
This payment system implements a subscription-based model for **Demonax** with a free trial ending on **November 28, 2025**. Users are called **Monarcs**.

## Features Implemented

### 1. Payment Notification Modal (`PaymentNotificationModal.jsx`)
- Shows on first login after update
- Displays days remaining until trial ends
- Daily reminders (every 12 hours) until Nov 28
- Can be dismissed but will reappear
- Direct link to payment instructions

### 2. Payment Block Screen (`PaymentBlockScreen.jsx`)
- Activates after November 28, 2025
- Blocks all app access for Monarcs without active subscription
- Shows what features they're missing
- Direct link to payment instructions
- Option to logout

### 3. Payment Instructions Page (`PaymentInstructionsPage.jsx`)
- Accessible via route: `/payment-instructions`
- Three subscription plans:
  - **Base Plan**: 6,000 TSh
  - **Pro Plan**: 20,000 TSh
  - **Premium Plan**: 35,000 TSh
- Supported payment methods:
  - M-Pesa
  - Tigo Pesa
  - Airtel Money
  - Halopesa
- Step-by-step payment instructions
- Copy-to-clipboard functionality for phone number and verification message
- Optional donation support

## Payment Process

### For Users:
1. **Choose a Plan** - Select Base, Pro, or Premium
2. **Send Payment** - Transfer money via mobile money to the provided number
3. **Send Verification Message** - Copy and send the verification message template:
   ```
   Hey there Demonax, I [YOUR NAME] using number [YOUR NUMBER] verify that I have paid for the [PLAN NAME].
   ```
4. **Wait for Confirmation** - Admin verifies and activates subscription within 24 hours

### For Admins:
1. Receive payment verification message
2. Verify payment in mobile money account
3. Use admin panel to activate subscription:
   ```
   POST /api/payment/:userId/subscription
   {
     "plan": "base" | "pro" | "premium",
     "duration": 30, // days
     "donationAmount": 5000 // optional, in TSh
   }
   ```

## Backend Implementation

### User Model Updates
Added subscription fields to `User.js`:
- `subscriptionPlan`: "none" | "base" | "pro" | "premium"
- `isPremium`: boolean
- `premiumTier`: "free" | "basic" | "pro" | "lifetime"
- `premiumStartDate`: Date
- `premiumEndDate`: Date
- `paymentStatus`: "active" | "expired" | "cancelled" | "pending" | "none"

### New API Endpoints

#### Get User's Subscription Status
```
GET /api/payment/my-status
Authorization: Bearer <token>
```

#### Activate Subscription (Admin Only)
```
POST /api/payment/:userId/subscription
Authorization: Bearer <admin-token>
Body: {
  "plan": "base" | "pro" | "premium",
  "duration": 30,
  "donationAmount": 5000 // optional
}
```

## Configuration

### Payment Phone Number
The payment number is configured as:
```javascript
const phoneNumber = "+255 748 656 698";
```

### Trial End Date
The trial end date is set to:
```javascript
const TRIAL_END_DATE = new Date("2025-11-28T23:59:59");
```

## Testing

### Before November 28, 2025:
- Monarcs see notification modal on first login
- Monarcs receive daily reminders
- Monarcs can access all features
- Payment instructions page is accessible

### After November 28, 2025:
- Monarcs without subscription see payment block screen
- Cannot access any features until subscription is active
- Payment instructions page remains accessible

### Testing Subscription Activation:
1. Create test user
2. Use admin panel or API to activate subscription
3. Verify user can access app after Nov 28

## Notification Schedule
- **First notification**: On first login after update
- **Daily reminders**: Every 12 hours until Nov 28
- **After Nov 28**: Permanent block screen until subscription

## Supporter Tiers (Based on Donations)
- **Bronze**: 6,000+ TSh
- **Silver**: 20,000+ TSh
- **Gold**: 50,000+ TSh
- **Platinum**: 100,000+ TSh

## Files Modified/Created

### Frontend:
- ✅ `frontend/src/components/PaymentNotificationModal.jsx` (new)
- ✅ `frontend/src/components/PaymentBlockScreen.jsx` (new)
- ✅ `frontend/src/pages/PaymentInstructionsPage.jsx` (new)
- ✅ `frontend/src/App.jsx` (modified)
- ✅ `frontend/src/index.css` (modified - added animation)

### Backend:
- ✅ `backend/src/models/User.js` (modified - added subscriptionPlan field)
- ✅ `backend/src/controllers/payment.controller.js` (modified - added activateSubscription)
- ✅ `backend/src/routes/payment.route.js` (modified - added subscription route)
- ✅ `frontend/src/pages/admin/components/modals/PaymentManagementModal.jsx` (modified - replaced premium with subscription management)

## Admin Dashboard Changes

The admin payment dashboard has been updated:
- **Removed**: "Set Premium" functionality
- **Added**: "Activate Subscription" with Base/Pro/Premium plans
- **Added**: Optional donation field when activating subscription
- **Updated**: All references from "Premium" to "Subscription"
- **Updated**: User terminology to "Monarc"

## Next Steps

1. ✅ **Payment Phone Number** - Set to +255 748 656 698
2. ✅ **Trial End Date** - Set to November 28, 2025
3. ✅ **App Branding** - Updated to Demonax with Monarc users
4. **Test Notification System** - Verify notifications appear correctly
5. **Test Payment Flow** - Complete end-to-end payment process
6. **Admin Training** - Train admins on subscription activation process
7. **Monitor Expiration** - Set up automated checks for expired subscriptions

## Support

For payment issues, users should contact support through the payment phone number provided in the instructions page.
