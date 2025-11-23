# Payment API Routes

## Base URL
All routes are prefixed with `/api/payments`

## Authentication
- **User routes**: Require `protectRoute` middleware (JWT token)
- **Admin routes**: Require `protectRoute` + `adminRoute` middleware

---

## User Routes

### Get My Premium/Subscription Status
```
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
  "supporterTier": "gold",
  "totalDonated": 50000,
  "paymentStatus": "active",
  "daysRemaining": 30
}
```

---

## Admin Routes

### Get All Payments
```
GET /api/payments/all?filter=<filter>
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `filter`: `all` | `premium` | `supporters` | `expired`

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
    "supporterTier": "gold",
    "totalDonated": 50000,
    "paymentStatus": "active"
  }
]
```

---

### Get Payment Statistics
```
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
```
POST /api/payments/:userId/subscription
Authorization: Bearer <admin-token>

Body:
{
  "plan": "base" | "pro" | "premium",
  "duration": 30,
  "donationAmount": 5000  // optional
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
    "subscriptionPlan": "pro",
    "premiumTier": "pro",
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
```
POST /api/payments/:userId/premium
Authorization: Bearer <admin-token>

Body:
{
  "tier": "basic" | "pro" | "lifetime",
  "duration": 30  // null for lifetime
}
```

**Response:**
```json
{
  "message": "Premium status updated successfully",
  "user": {
    "_id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "isPremium": true,
    "premiumTier": "pro",
    "premiumStartDate": "2025-11-23T00:00:00.000Z",
    "premiumEndDate": "2025-12-23T00:00:00.000Z"
  }
}
```

---

### Extend Premium/Subscription
```
PUT /api/payments/:userId/premium/extend
Authorization: Bearer <admin-token>

Body:
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
```
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
```
POST /api/payments/:userId/donation
Authorization: Bearer <admin-token>

Body:
{
  "amount": 10000,
  "note": "Payment for Pro plan"
}
```

**Response:**
```json
{
  "message": "Donation added successfully",
  "user": {
    "_id": "user_id",
    "fullName": "John Doe",
    "totalDonated": 10000,
    "supporterTier": "bronze",
    "donationHistory": [
      {
        "amount": 10000,
        "note": "Payment for Pro plan",
        "date": "2025-11-23T00:00:00.000Z",
        "addedBy": "admin_id"
      }
    ]
  }
}
```

---

### Update Donation
```
PUT /api/payments/:userId/donation/:donationIndex
Authorization: Bearer <admin-token>

Body:
{
  "amount": 15000,
  "note": "Updated payment amount"
}
```

**Response:**
```json
{
  "message": "Donation updated successfully",
  "user": {
    "_id": "user_id",
    "fullName": "John Doe",
    "totalDonated": 15000,
    "supporterTier": "bronze",
    "donationHistory": [...]
  }
}
```

---

### Remove Donation
```
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
    "totalDonated": 0,
    "supporterTier": null,
    "isSupporter": false,
    "donationHistory": []
  }
}
```

---

### Update Supporter Status
```
PUT /api/payments/:userId/supporter-status
Authorization: Bearer <admin-token>

Body:
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
```
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
```
PUT /api/payments/:userId/notes
Authorization: Bearer <admin-token>

Body:
{
  "notes": "User paid via M-Pesa on 2025-11-23"
}
```

**Response:**
```json
{
  "message": "Payment notes updated successfully",
  "paymentNotes": "User paid via M-Pesa on 2025-11-23"
}
```

---

## Supporter Tiers (Based on Total Donated)
- **Bronze**: 6,000+ TSh
- **Silver**: 20,000+ TSh
- **Gold**: 50,000+ TSh
- **Platinum**: 100,000+ TSh

## Subscription Plans
- **Base**: 6,000 TSh/month
- **Pro**: 20,000 TSh/month
- **Premium**: 35,000 TSh/month

## Error Responses
All endpoints return standard error responses:

```json
{
  "message": "Error description"
}
```

**Common Status Codes:**
- `200`: Success
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (not admin)
- `404`: Not Found (user not found)
- `500`: Internal Server Error
