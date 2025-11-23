# Demonax Payment System - Deployment Checklist

## ✅ Pre-Deployment Verification

### Configuration Verified
- [x] Payment phone number: +255 748 656 698
- [x] Trial end date: November 28, 2025
- [x] App name: Demonax
- [x] User terminology: Monarc
- [x] Subscription plans: Base (6K), Pro (20K), Premium (35K) TSh
- [x] Payment methods: M-Pesa, Tigo Pesa, Airtel Money, Halopesa

### Code Changes Completed
- [x] Frontend notification modal
- [x] Frontend payment block screen
- [x] Frontend payment instructions page
- [x] Frontend App.jsx integration
- [x] Admin subscription management modal
- [x] Backend User model (subscriptionPlan field)
- [x] Backend payment controller (activateSubscription endpoint)
- [x] Backend payment routes
- [x] All files compile without errors

## 🧪 Testing Required

### User Experience Testing
- [ ] **First Login**: Verify notification modal appears
- [ ] **Notification Content**: Check correct date (Nov 28) and branding (Demonax/Monarc)
- [ ] **Daily Reminders**: Confirm notifications appear every 12 hours
- [ ] **Payment Instructions**: Navigate to /payment-instructions
- [ ] **Plan Selection**: Select each plan (Base/Pro/Premium)
- [ ] **Copy Functions**: Test copy-to-clipboard for phone number and message
- [ ] **Verification Message**: Verify template is correct

### Admin Testing
- [ ] **Login to Admin Panel**: Access admin dashboard
- [ ] **Open Payment Modal**: Click on a Monarc
- [ ] **Subscription UI**: Verify "Monarc Subscription Management" section
- [ ] **Plan Selection**: Test selecting Base/Pro/Premium plans
- [ ] **Duration Slider**: Test duration adjustment (1-365 days)
- [ ] **Donation Field**: Test optional donation input
- [ ] **Activate Subscription**: Click "Activate Subscription" button
- [ ] **API Response**: Verify subscription activates successfully
- [ ] **User Update**: Confirm Monarc status updates in UI
- [ ] **Extend Subscription**: Test extending existing subscription
- [ ] **Cancel Subscription**: Test cancellation workflow

### Backend API Testing
```bash
# Test subscription activation
POST /api/payments/:userId/subscription
{
  "plan": "base",
  "duration": 30,
  "donationAmount": 5000
}

# Test subscription status check
GET /api/payments/my-status
```

### Date-Based Testing
- [ ] **Before Nov 28**: Verify full app access with notifications
- [ ] **After Nov 28**: Change system date to test block screen
- [ ] **Block Screen**: Verify Monarcs without subscription are blocked
- [ ] **Payment Page Access**: Confirm payment instructions remain accessible

## 🚀 Deployment Steps

### 1. Backend Deployment
```bash
cd backend
npm install  # Ensure dependencies are up to date
npm run build  # If applicable
# Deploy to production server
```

### 2. Frontend Deployment
```bash
cd frontend
npm install  # Ensure dependencies are up to date
npm run build
# Deploy to production server
```

### 3. Database Migration
- [ ] Verify User model has `subscriptionPlan` field
- [ ] Run any necessary migrations
- [ ] Backup database before deployment

### 4. Environment Variables
- [ ] Verify all environment variables are set
- [ ] Check API endpoints are correct
- [ ] Confirm payment webhook URLs (if applicable)

## 📋 Post-Deployment Verification

### Immediate Checks (Within 1 hour)
- [ ] Test user login and notification appearance
- [ ] Verify payment instructions page loads
- [ ] Test admin subscription activation
- [ ] Check error logs for any issues
- [ ] Verify API endpoints respond correctly

### Daily Monitoring (Until Nov 28)
- [ ] Monitor notification delivery
- [ ] Check for user complaints or issues
- [ ] Verify admin can activate subscriptions
- [ ] Monitor payment verification messages
- [ ] Track subscription activations

### Nov 28 Monitoring
- [ ] Verify block screen activates at midnight
- [ ] Monitor user reactions and support requests
- [ ] Ensure payment flow works smoothly
- [ ] Track subscription conversions
- [ ] Be ready for high support volume

## 👥 Team Preparation

### Admin Training
- [ ] Train admins on new subscription workflow
- [ ] Provide admin guide document
- [ ] Test admin access to payment modal
- [ ] Practice subscription activation process
- [ ] Review donation handling procedures

### Support Team Preparation
- [ ] Prepare FAQ for Monarcs
- [ ] Create support scripts for common issues
- [ ] Set up payment verification process
- [ ] Establish response time targets
- [ ] Monitor payment phone number (+255 748 656 698)

### Communication Plan
- [ ] Announce payment system to Monarcs
- [ ] Send email/notification about trial ending
- [ ] Provide clear payment instructions
- [ ] Highlight subscription benefits
- [ ] Offer early bird incentives (optional)

## 🔧 Troubleshooting Guide

### Common Issues

**Issue**: Notification not appearing
- Check localStorage keys: `payment_notification_seen`, `last_payment_notification`
- Verify trial end date in code
- Check browser console for errors

**Issue**: Block screen not activating after Nov 28
- Verify system date/time
- Check subscription status in database
- Confirm `hasActiveSubscription` logic in App.jsx

**Issue**: Admin can't activate subscription
- Check admin authentication
- Verify API endpoint is accessible
- Check network requests in browser dev tools
- Verify user ID is correct

**Issue**: Payment verification message incorrect
- Review template in PaymentInstructionsPage.jsx
- Ensure plan name is correctly inserted
- Check copy-to-clipboard functionality

## 📊 Success Metrics

### Track These KPIs
- [ ] Notification view rate
- [ ] Payment instructions page visits
- [ ] Subscription conversion rate
- [ ] Average time to subscribe
- [ ] Support ticket volume
- [ ] Payment verification time
- [ ] Monarc retention rate

### Target Goals
- Notification view rate: >90%
- Conversion rate: >30%
- Payment verification time: <24 hours
- Support response time: <2 hours

## 🆘 Emergency Contacts

### Technical Issues
- Backend Developer: [Contact]
- Frontend Developer: [Contact]
- Database Admin: [Contact]

### Business Issues
- Product Manager: [Contact]
- Customer Support Lead: [Contact]
- Finance/Payment Verification: [Contact]

## 📝 Rollback Plan

If critical issues arise:

1. **Immediate Actions**:
   - Extend trial date by 7 days
   - Disable block screen temporarily
   - Communicate with Monarcs

2. **Code Rollback**:
   ```bash
   git revert [commit-hash]
   # Redeploy previous version
   ```

3. **Database Rollback**:
   - Restore from backup if needed
   - Reset subscription statuses

4. **Communication**:
   - Notify all Monarcs of extension
   - Apologize for inconvenience
   - Provide updated timeline

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Verified By**: _____________
**Status**: ⏳ Pending / ✅ Complete / ❌ Issues Found

## Notes
_Add any deployment notes, issues encountered, or special considerations here_
