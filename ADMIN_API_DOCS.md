# Admin API Documentation

## User Management Endpoints

### 1. Get All Users
**Endpoint:** `GET /api/v1/users/admin/all`
**Access:** Admin only
**Description:** Retrieve all users with pagination and filtering options

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `role` (optional): Filter by role (user, landlord, admin)
- `isVerified` (optional): Filter by verification status (true/false)
- `search` (optional): Search in firstName, lastName, email, phone

**Sample Request:**
```bash
GET /api/v1/users/admin/all?page=1&limit=10&role=user&isVerified=true&search=john
Authorization: Bearer <admin_token>
```

**Sample Response:**
```json
{
  "status": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "_id": "60d5ecb54f13a54b5c8e8a1a",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "role": "user",
        "isVerified": true,
        "avatar": "https://example.com/avatar.jpg",
        "address": "123 Main St",
        "gender": "Male",
        "createdAt": "2021-06-25T10:30:00.000Z",
        "updatedAt": "2021-06-25T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 2. Get User by ID
**Endpoint:** `GET /api/v1/users/admin/:id`
**Access:** Admin only
**Description:** Get detailed information about a specific user

**Sample Request:**
```bash
GET /api/v1/users/admin/60d5ecb54f13a54b5c8e8a1a
Authorization: Bearer <admin_token>
```

**Sample Response:**
```json
{
  "status": true,
  "message": "User retrieved successfully",
  "data": {
    "_id": "60d5ecb54f13a54b5c8e8a1a",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "role": "user",
    "isVerified": true,
    "avatar": "https://example.com/avatar.jpg",
    "address": "123 Main St",
    "gender": "Male",
    "createdAt": "2021-06-25T10:30:00.000Z",
    "updatedAt": "2021-06-25T10:30:00.000Z"
  }
}
```

### 3. Update User by ID
**Endpoint:** `PUT /api/v1/users/admin/:id`
**Access:** Admin only
**Description:** Update user information

**Sample Request:**
```bash
PUT /api/v1/users/admin/60d5ecb54f13a54b5c8e8a1a
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "role": "landlord",
  "isVerified": true,
  "address": "456 New Street"
}
```

**Sample Response:**
```json
{
  "status": true,
  "message": "User updated successfully",
  "data": {
    "_id": "60d5ecb54f13a54b5c8e8a1a",
    "firstName": "John Updated",
    "lastName": "Doe Updated",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "role": "landlord",
    "isVerified": true,
    "address": "456 New Street",
    "updatedAt": "2021-06-25T11:30:00.000Z"
  }
}
```

### 4. Delete User by ID
**Endpoint:** `DELETE /api/v1/users/admin/:id`
**Access:** Admin only
**Description:** Delete a user account (permanent deletion)

**Sample Request:**
```bash
DELETE /api/v1/users/admin/60d5ecb54f13a54b5c8e8a1a
Authorization: Bearer <admin_token>
```

**Sample Response:**
```json
{
  "status": true,
  "message": "User deleted successfully",
  "data": null
}
```

### 5. Toggle User Verification
**Endpoint:** `PATCH /api/v1/users/admin/:id/toggle-verification`
**Access:** Admin only
**Description:** Toggle user verification status

**Sample Request:**
```bash
PATCH /api/v1/users/admin/60d5ecb54f13a54b5c8e8a1a/toggle-verification
Authorization: Bearer <admin_token>
```

**Sample Response:**
```json
{
  "status": true,
  "message": "User verified successfully",
  "data": {
    "_id": "60d5ecb54f13a54b5c8e8a1a",
    "firstName": "John",
    "lastName": "Doe",
    "isVerified": true,
    "updatedAt": "2021-06-25T11:30:00.000Z"
  }
}
```

### 6. Get User Statistics
**Endpoint:** `GET /api/v1/users/admin/stats`
**Access:** Admin only
**Description:** Get comprehensive user statistics

**Sample Request:**
```bash
GET /api/v1/users/admin/stats
Authorization: Bearer <admin_token>
```

**Sample Response:**
```json
{
  "status": true,
  "message": "User statistics retrieved successfully",
  "data": {
    "totalUsers": 1250,
    "verifiedUsers": 1100,
    "unverifiedUsers": 150,
    "adminUsers": 5,
    "landlordUsers": 200,
    "regularUsers": 1045,
    "recentUsers": 45,
    "verificationRate": "88.00"
  }
}
```

## Booking Management Endpoints

### 1. Get All Bookings
**Endpoint:** `GET /api/v1/bookings/admin/all`
**Access:** Admin only
**Description:** Retrieve all bookings with pagination and filtering

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `bookingStatus` (optional): Filter by booking status (pending, confirmed, cancelled, completed)
- `paymentStatus` (optional): Filter by payment status (pending, paid, failed)
- `userId` (optional): Filter by user ID
- `propertyId` (optional): Filter by property ID

**Sample Request:**
```bash
GET /api/v1/bookings/admin/all?page=1&limit=10&bookingStatus=confirmed&paymentStatus=paid
Authorization: Bearer <admin_token>
```

**Sample Response:**
```json
{
  "status": true,
  "message": "Bookings retrieved successfully",
  "data": {
    "bookings": [
      {
        "_id": "60d5ecb54f13a54b5c8e8a1b",
        "user": {
          "_id": "60d5ecb54f13a54b5c8e8a1a",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com",
          "phone": "+1234567890"
        },
        "property": {
          "_id": "60d5ecb54f13a54b5c8e8a1c",
          "title": "Luxury Apartment",
          "address": "123 Luxury St",
          "rent": 1500
        },
        "checkInDate": "2024-07-15T00:00:00.000Z",
        "checkOutDate": "2024-07-20T00:00:00.000Z",
        "numberOfGuests": 2,
        "totalAmount": 7500,
        "bookingStatus": "confirmed",
        "paymentStatus": "paid",
        "paymentId": {
          "_id": "60d5ecb54f13a54b5c8e8a1d",
          "amount": 7500,
          "reference": "rnl832u7g5",
          "status": "paid",
          "gateway": "paystack"
        },
        "paymentReference": "rnl832u7g5",
        "createdAt": "2024-07-01T10:30:00.000Z",
        "updatedAt": "2024-07-01T10:35:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalBookings": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 2. Get Booking by ID (Admin)
**Endpoint:** `GET /api/v1/bookings/admin/:id`
**Access:** Admin only
**Description:** Get detailed information about a specific booking

**Sample Request:**
```bash
GET /api/v1/bookings/admin/60d5ecb54f13a54b5c8e8a1b
Authorization: Bearer <admin_token>
```

**Sample Response:**
```json
{
  "status": true,
  "message": "Booking details retrieved",
  "data": {
    "_id": "60d5ecb54f13a54b5c8e8a1b",
    "user": {
      "_id": "60d5ecb54f13a54b5c8e8a1a",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "address": "123 Main St"
    },
    "property": {
      "_id": "60d5ecb54f13a54b5c8e8a1c",
      "title": "Luxury Apartment",
      "description": "Beautiful luxury apartment...",
      "address": "123 Luxury St",
      "rent": 1500,
      "bedrooms": 2,
      "bathrooms": 2,
      "landlord": "60d5ecb54f13a54b5c8e8a1e"
    },
    "checkInDate": "2024-07-15T00:00:00.000Z",
    "checkOutDate": "2024-07-20T00:00:00.000Z",
    "numberOfGuests": 2,
    "totalAmount": 7500,
    "bookingStatus": "confirmed",
    "paymentStatus": "paid",
    "paymentId": {
      "_id": "60d5ecb54f13a54b5c8e8a1d",
      "amount": 7500,
      "reference": "rnl832u7g5",
      "status": "paid",
      "gateway": "paystack",
      "channel": "card",
      "paidAt": "2024-07-01T10:35:00.000Z"
    },
    "paymentReference": "rnl832u7g5",
    "createdAt": "2024-07-01T10:30:00.000Z",
    "updatedAt": "2024-07-01T10:35:00.000Z"
  }
}
```

### 3. Update Booking Status
**Endpoint:** `PUT /api/v1/bookings/admin/:id/status`
**Access:** Admin only
**Description:** Update booking or payment status

**Sample Request:**
```bash
PUT /api/v1/bookings/admin/60d5ecb54f13a54b5c8e8a1b/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "bookingStatus": "completed",
  "paymentStatus": "paid"
}
```

**Sample Response:**
```json
{
  "status": true,
  "message": "Booking status updated successfully",
  "data": {
    "_id": "60d5ecb54f13a54b5c8e8a1b",
    "bookingStatus": "completed",
    "paymentStatus": "paid",
    "user": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "property": {
      "title": "Luxury Apartment",
      "address": "123 Luxury St"
    },
    "updatedAt": "2024-07-01T12:00:00.000Z"
  }
}
```

### 4. Cancel Booking (Admin)
**Endpoint:** `PUT /api/v1/bookings/admin/:id/cancel`
**Access:** Admin only
**Description:** Cancel a booking with optional reason

**Sample Request:**
```bash
PUT /api/v1/bookings/admin/60d5ecb54f13a54b5c8e8a1b/cancel
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Property maintenance required"
}
```

**Sample Response:**
```json
{
  "status": true,
  "message": "Booking cancelled successfully",
  "data": {
    "_id": "60d5ecb54f13a54b5c8e8a1b",
    "bookingStatus": "cancelled",
    "user": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    },
    "property": {
      "title": "Luxury Apartment",
      "address": "123 Luxury St"
    },
    "updatedAt": "2024-07-01T12:00:00.000Z"
  }
}
```

### 5. Get Booking Statistics
**Endpoint:** `GET /api/v1/bookings/admin/stats`
**Access:** Admin only
**Description:** Get comprehensive booking statistics

**Sample Request:**
```bash
GET /api/v1/bookings/admin/stats
Authorization: Bearer <admin_token>
```

**Sample Response:**
```json
{
  "status": true,
  "message": "Booking statistics retrieved successfully",
  "data": {
    "totalBookings": 1500,
    "pendingBookings": 45,
    "confirmedBookings": 1200,
    "cancelledBookings": 180,
    "completedBookings": 75,
    "paidBookings": 1275,
    "pendingPayments": 45,
    "failedPayments": 180,
    "recentBookings": 120,
    "totalRevenue": 1875000,
    "conversionRate": "80.00",
    "paymentSuccessRate": "85.00"
  }
}
```

## Authentication

All admin endpoints require:
1. Valid JWT token in Authorization header: `Bearer <token>`
2. User must have `admin` role
3. Token must not be expired

## Error Responses

### 400 Bad Request
```json
{
  "status": false,
  "message": "Invalid user ID"
}
```

### 401 Unauthorized
```json
{
  "status": false,
  "message": "Access token is required"
}
```

### 403 Forbidden
```json
{
  "status": false,
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "status": false,
  "message": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "status": false,
  "message": "Internal server error message"
}
```

## Rate Limiting

Admin endpoints may be subject to rate limiting. Typical limits:
- 100 requests per hour for data retrieval endpoints
- 50 requests per hour for modification endpoints

## Data Validation

- All IDs must be valid MongoDB ObjectIds
- Email addresses must be valid format
- Phone numbers should follow international format
- Enum values must match defined constants
- Pagination limits are capped at 100 items per page

## Best Practices

1. Always validate user input
2. Use pagination for large datasets
3. Include search and filtering for better UX
4. Log all admin actions for audit trail
5. Send notifications for critical actions (cancellations, deletions)
6. Implement proper error handling and logging
