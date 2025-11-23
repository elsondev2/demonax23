# Admin Guide: Monarc Subscription Management

## Overview
This guide explains how to manage Monarc subscriptions in the Demonax admin panel.

## Accessing Payment Management

1. Log in to the admin panel at `/admin/login`
2. Navigate to the Users section
3. Click on any Monarc to open their profile
4. The Payment Management Modal will appear

## Understanding the Payment Modal

### Header Section
Shows Monarc information:
- Profile picture and online status
- Full name and email
- Current subscription status badges
- Premium/Supporter tier indicators
- Days remaining until expiration

### Quick Stats
Three cards showing:
1. **Premium Status**: Current subscription plan
2. **Supporter Tier**: Donation tier level
3. **Account Value**: Total contributions in TSh

## Activating a Subscription

### Step-by-Step Process

1. **Receive Payment Verification**
   - Monarc sends money via mobile money to +255 748 656 698
   - Monarc sends verification message:
     ```
     Hey there Demonax, I [NAME] using number [NUMBER] verify that I have paid for the [PLAN].
     ```

2. **Verify Payment**
   - Check mobile money account for payment
   - Confirm amount matches selected plan:
     - Base: 6,000 TSh
     - Pro: 20,000 TSh
     - Premium: 35,000 TSh

3. **Open Payment Modal**
   - Find Monarc in user list
   - Click on their name/profile
   - Payment Management Modal opens

4. **Select Subscription Plan**
   - Click on one of three plan cards:
     - **Base Plan** (6,000 TSh)
       - Unlimited messaging
       - Group chats
       - Voice calls
       - Standard support
     
     - **Pro Plan** (20,000 TSh)
       - Everything in Base
       - Video calls
       - Priority support
       - Advanced features
       - No ads
     
     - **Premium Plan** (35,000 TSh)
       - Everything in Pro
       - Unlimited storage
       - Premium support
       - Early access
       - Custom themes

5. **Set Duration**
   - Use slider to adjust duration (1-365 days)
   - Quick buttons available:
     - 30d (1 month)
     - 90d (3 months)
     - 180d (6 months)
     - 365d (1 year)
   - Default: 30 days

6. **Add Optional Donation** (if applicable)
   - If Monarc included donation in payment
   - Enter donation amount in TSh
   - This will be added to their supporter status

7. **Activate Subscription**
   - Click "Activate Subscription" button
   - Wait for confirmation
   - Success message will appear
   - Monarc status updates immediately

## Managing Existing Subscriptions

### Extending a Subscription

1. Open Monarc's payment modal
2. Adjust duration slider to desired extension period
3. Click "Extend [X]d" button
4. Subscription end date extends from current expiration

**Example**: 
- Current expiration: Dec 28, 2025
- Extend by: 30 days
- New expiration: Jan 27, 2026

### Cancelling a Subscription

1. Open Monarc's payment modal
2. Click "Cancel" button (red, outline style)
3. Confirm cancellation in popup
4. Subscription immediately cancelled
5. Monarc loses access at next login

**Warning**: This action cannot be undone. Monarc will need to pay again to reactivate.

## Donation Management

### Adding a Donation

1. Scroll to "Supporter & Donations" section
2. Enter amount in TSh
3. Use quick amount buttons for common values:
   - Basic: 6K
   - Pro: 20K
   - Premium: 35K
   - Custom: 50K
4. Add optional note
5. Click "Add Donation"

### Supporter Tiers (Automatic)
Based on total donated:
- 🥉 **Bronze**: 6,000+ TSh
- 🥈 **Silver**: 20,000+ TSh
- 🥇 **Gold**: 50,000+ TSh
- 💎 **Platinum**: 100,000+ TSh

### Editing Donation History

1. Hover over donation entry
2. Click edit icon (pencil)
3. Modify amount or note
4. Click "Save"
5. Total donated recalculates automatically

### Removing a Donation

1. Hover over donation entry
2. Click delete icon (trash)
3. Confirm deletion
4. Total donated updates
5. Supporter tier may change

### Editing Supporter Status

1. Click "Edit" button in supporter status alert
2. Choose mode:
   - **Templates**: Pre-configured tier amounts
   - **Custom**: Manual tier and amount selection

3. **Template Mode**:
   - Click on tier card (Bronze/Silver/Gold/Platinum)
   - Amount auto-fills to tier minimum
   - Click "Update Supporter Status"

4. **Custom Mode**:
   - Select tier manually
   - Enter custom total donated amount
   - Use quick amount buttons if needed
   - Click "Update Supporter Status"

### Removing Supporter Status

1. Click "Remove" button in supporter status alert
2. Confirm removal
3. **Warning**: This clears ALL donation history
4. Total donated resets to 0
5. Supporter tier removed

## Admin Notes

### Adding Notes

1. Scroll to "Admin Notes" section
2. Enter internal notes about:
   - Payment history
   - Special considerations
   - Communication with Monarc
   - Issues or concerns
3. Click "Save Notes"

**Best Practices**:
- Note payment verification details
- Record any special arrangements
- Document communication history
- Flag any suspicious activity

## Common Scenarios

### Scenario 1: New Subscription
```
Monarc: John Doe
Payment: 20,000 TSh (Pro Plan)
Duration: 30 days
Donation: None

Steps:
1. Verify 20,000 TSh received
2. Open John's payment modal
3. Select "Pro Plan" card
4. Keep duration at 30 days
5. Click "Activate Subscription"
6. Confirm success message
```

### Scenario 2: Subscription + Donation
```
Monarc: Jane Smith
Payment: 35,000 TSh (Premium) + 15,000 TSh (Donation)
Total: 50,000 TSh
Duration: 90 days

Steps:
1. Verify 50,000 TSh received
2. Open Jane's payment modal
3. Select "Premium Plan" card
4. Set duration to 90 days
5. Enter 15,000 in donation field
6. Click "Activate Subscription"
7. Verify supporter tier updated to Silver
```

### Scenario 3: Extending Subscription
```
Monarc: Mike Johnson
Current: Pro Plan, expires in 5 days
Request: Extend by 30 days
Payment: 20,000 TSh

Steps:
1. Verify 20,000 TSh received
2. Open Mike's payment modal
3. Set duration slider to 30 days
4. Click "Extend 30d" button
5. New expiration: 35 days from now
```

### Scenario 4: Cancellation Request
```
Monarc: Sarah Lee
Request: Cancel subscription, wants refund
Current: Premium Plan, 20 days remaining

Steps:
1. Verify refund policy
2. Process refund if applicable
3. Open Sarah's payment modal
4. Click "Cancel" button
5. Confirm cancellation
6. Add note about refund in Admin Notes
```

## Troubleshooting

### Issue: Can't find Monarc
- Use search function in user list
- Search by name, email, or username
- Check if Monarc account exists

### Issue: Subscription not activating
- Check admin authentication
- Verify internet connection
- Check browser console for errors
- Try refreshing page and retry

### Issue: Wrong plan activated
- Cancel subscription immediately
- Activate correct plan
- Add note explaining correction

### Issue: Donation not calculating correctly
- Check donation history
- Verify amounts are correct
- Edit individual donations if needed
- Recalculate manually if necessary

## Best Practices

### Payment Verification
✅ **DO**:
- Verify payment before activating
- Check amount matches plan
- Confirm sender name matches Monarc
- Document verification in notes

❌ **DON'T**:
- Activate without payment confirmation
- Accept partial payments
- Skip verification steps

### Communication
✅ **DO**:
- Respond to verification messages promptly
- Confirm activation to Monarc
- Provide receipt/confirmation
- Be professional and courteous

❌ **DON'T**:
- Leave Monarcs waiting
- Ignore verification messages
- Provide vague responses

### Record Keeping
✅ **DO**:
- Add notes for every transaction
- Document special cases
- Keep payment records
- Track donation history

❌ **DON'T**:
- Skip documentation
- Forget to save notes
- Delete important records

## Quick Reference

### Subscription Plans
| Plan | Price | Duration | Features |
|------|-------|----------|----------|
| Base | 6,000 TSh | 30 days | Basic features |
| Pro | 20,000 TSh | 30 days | Advanced features |
| Premium | 35,000 TSh | 30 days | All features |

### Supporter Tiers
| Tier | Minimum | Icon |
|------|---------|------|
| Bronze | 6,000 TSh | 🥉 |
| Silver | 20,000 TSh | 🥈 |
| Gold | 50,000 TSh | 🥇 |
| Platinum | 100,000 TSh | 💎 |

### Payment Number
**+255 748 656 698**

### Trial End Date
**November 28, 2025**

---

**Questions?** Contact technical support or refer to the full documentation in `PAYMENT_SYSTEM_GUIDE.md`
