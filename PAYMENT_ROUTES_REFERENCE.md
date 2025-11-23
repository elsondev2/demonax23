# Payment API Routes Reference

## Base URL
```
/api/payments
```

## Authentication
All routes require authentication. Admin routes require admin role.

---

## User Routes

### Get My Subscription Status
Get the authenticated user's subscription and payment information.

```http
GET /api/payments/my-status
Authorization: Bearer <user-token>
```

**Response:**
```json
{
  "isPremium": true,
  "premiumTier": "pro",
  "subscriptionPlan": "pro",
  "premiumStartDate": "2025-11-23T00:00:00.000Z",
  "premiumEndDate": "2025-12-23T00:00:00.000Z",
  "isSupporter": true,
  "supporterTier": "silver",
  "totalDonated": 25000,
  "paymentStatus": "active",
  "daysRemaining": 30
}
```

---

## Admin Routes

### Get All Payments
Get list of all users with payment information.

```http
GET /api/payments/all?filter=<filter>
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `filter` (optional): `all`, `premium`, `supporters`, `expired`

**Response:**
```json
[
  {
    "_id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "profilePic": "url",
    "isPremium": true,
    "premiumTier": "pro",
    "premiumStartDate": "2025-11-23T00:00:00.000Z",
    "premiumEndDate": "2025-12-23T00:00:00.000Z",
    "isSupporter": true,
    "supporterTier": "silver",
    "totalDonated": 25000,
    "paymentStatus": "active"
  }
]
```

---

### Get Payment Statistics
Get overall payment statistics.

```http
GET /api/payments/stats
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "totalUsers": 1000,
  "premiumUsers": 250,
  "supporters": 150,
  "totalRevenue": 5000000,
  "expiringSoon": 25,
  "conversionRate": "25.00"
}
```

---

### Activate Subscription (NEW)
Activate a subscription for a user with optional donation.

```http
POST /api/payments/:userId/subscription
Authorization: Bearer <admin-token>
```

**Body:**
```json
{
  "plan": "base",           // "base" | "pro" | "premium"
  "duration": 30,           // days
  "donationAmount": 5000    // optional, in TSh
}
```

**Response:**
```json
{
  "message": "Subscription activated successfully",
  "user": {
    "_id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "isPremium": true,
    "subscriptionPlan": "base",
    "premiumTier": "basic",
    "premiumStartDate": "2025-11-23T00:00:00.000Z",
    "premiumEndDate": "2025-12-23T00:00:00.000Z",
    "isSupporter": true,
    "supporterTier": "bronze",
    "totalDonated": 5000
  }
}
```

---

### Set Premium (Legacy)
Set premium status for a user.

```http
POST /api/payments/:userId/premium
Authorization: Bearer <admin-token>
```

**Body:**
```json
{
  "tier": "basic",    // "basic" | "pro" | "lifetime"
  "duration": 30      // days (null for lifetime)
}
```

**Response:**
```json
{
  "message": "Premium basic set successfully!",
  "user": {
    "_id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "isPremium": true,
    "premiumTier": "basic",
    "premiumStartDate": "2025-11-23T00:00:00.000Z",
    "premiumEndDate": "2025-12-23T00:00:00.000Z"
  }
}
```

---

### Extend Premium/Subscription
Extend an existing premium subscription.

```http
PUT /api/payments/:userId/premium/extend
Authorization: Bearer <admin-token>
```

**Body:**
```json
{
  "additionalDays": 30
}
```

**Response:**
```json
{
  "message": "Premium extended by 30 days",
  "user": {
    "_id": "user_id",
    "fullName": "John Doe",
    "premiumEndDate": "2026-01-23T00:00:00.000Z"
  }
}
```

---

### Cancel Premium/Subscription
Cancel a user's premium subscription.

```http
DELETE /api/payments/:userId/premium
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "message": "Premium cancelled successfully",
  "user": {
    "_id": "user_id",
    "fullName": "John Doe",
    "isPremium": false
  }
}
```

---

### Add Donation
Add a donation to a user's account.

```http
POST /api/payments/:userId/donation
Authorization: Bearer <admin-token>
```

**Body:**
```json
{
  "amount": 10000,
  "note": "Monthly donation"
}
```

**Response:**
```json
{
  "message": "Donation added successfully",
  "user": {
    "_id": "user_id",
    "fullName": "John Doe",
    "totalDonated": 35000,
    "supporterTier": "silver",
    "donationHistory": [
      {
        "amount": 10000,
        "note": "Monthly donation",
        "date": "2025-11-23T00:00:00.000Z",
        "addedBy": "admin_id"
      }
    ]
  }
}
```

---

### Update Donation
Update an existing donation entry.

```http
PUT /api/payments/:userId/donation/:donationIndex
Authorization: Bearer <admin-token>
```

**Body:**
```json
{
  "amount": 15000,
  "note": "Updated donation amount"
}
```

**Response:**
```json
{
  "message": "Donation updated successfully",
  "user": {
    "_id": "user_id",
    "fullName": "John Doe",
    "totalDonated": 40000,
    "supporterTier": "silver",
    "donationHistory": [...]
  }
}
```

---

### Remove Donation
Remove a donation from history.

```http
DELETE /api/payments/:userId/donation/:donationIndex
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "message": "Donation removed successfully",
  "user": {
    "_id": "user_id",
    "fullName": "John Doe",
    "totalDonated": 25000,
    "supporterTier": "silver",
    "isSupporter": true,
    "donationHistory": [...]
  }
}
```

---

### Update Supporter Status
Manually update a user's supporter tier and total donated.

```http
PUT /api/payments/:userId/supporter-status
Authorization: Bearer <admin-token>
```

**Body:**
```json
{
  "supporterTier": "gold",
  "totalDonated": 50000,
  "isSupporter": true
}
```

**Response:**
```json
{
  "message": "Supporter status updated successfully",
  "user": {
    "_id": "user_id",
    "fullName": "John Doe",
    "supporterTier": "gold",
    "totalDonated": 50000,
    "isSupporter": true
  }
}
```

---

### Remove Supporter Status
Remove supporter status and clear donation history.

```http
DELETE /api/payments/:userId/supporter-status
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "message": "Supporter status removed successfully",
  "user": {
    "_id": "user_id",
    "fullName": "John Doe",
    "isSupporter": false,
    "supporterTier": null,
    "totalDonated": 0
  }
}
```

---

### Update Payment Notes
Add or update internal admin notes for a user.

```http
PUT /api/payments/:userId/notes
Authorization: Bearer <admin-token>
```

**Body:**
```json
{
  "notes": "Verified payment via M-Pesa on 2025-11-23. Transaction ID: ABC123."
}
```

**Response:**
```json
{
  "message": "Payment notes updated successfully",
  "paymentNotes": "Verified payment via M-Pesa on 2025-11-23. Transaction ID: ABC123."
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid subscription plan"
}
```

### 401 Unauthorized
```json
{
  "message": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "message": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## Subscription Plans

| Plan | Price (TSh) | Features |
|------|-------------|----------|
| Base | 6,000 | Unlimited messaging, Group chats, Voice calls, Standard support |
| Pro | 20,000 | Everything in Base + Video calls, Priority support, Advanced features, No ads |
| Premium | 35,000 | Everything in Pro + Unlimited storage, Premium support, Early access, Custom themes |

## Supporter Tiers

| Tier | Minimum (TSh) | Icon |
|------|---------------|------|
| Bronze | 6,000 | 🥉 |
| Silver | 20,000 | 🥈 |
| Gold | 50,000 | 🥇 |
| Platinum | 100,000 | 💎 |

---

## Usage Examples

### Example 1: Activate Base Subscription
```bash
curl -X POST https://api.demonax.com/api/payments/USER_ID/subscription \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "base",
    "duration": 30
  }'
```

### Example 2: Activate Pro Subscription with Donation
```bash
curl -X POST https://api.demonax.com/api/payments/USER_ID/subscription \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "pro",
    "duration": 90,
    "donationAmount": 10000
  }'
```

### Example 3: Check My Subscription Status
```bash
curl -X GET https://api.demonax.com/api/payments/my-status \
  -H "Authorization: Bearer USER_TOKEN"
```

### Example 4: Extend Subscription
```bash
curl -X PUT https://api.demonax.com/api/payments/USER_ID/premium/extend \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "additionalDays": 30
  }'
```

---

**Last Updated**: November 23, 2025
**API Version**: 1.0
