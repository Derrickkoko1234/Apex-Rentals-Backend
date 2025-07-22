# Apex-Rentals-Backend

## Property Reviews Feature

### Overview
Users can review properties they have previously booked (and completed the booking for). Each user can only review a property once per booking.

### Endpoints

#### 1. Create a Review
- **URL:** `POST /api/v1/properties/:id/reviews`
- **Auth:** Required (Bearer token)
- **Body:**
  ```json
  {
    "rating": 5, // integer 1-5
    "comment": "Great place!"
  }
  ```
- **Response:**
  - `201 Created` on success
  - `400` if missing/invalid fields or already reviewed
  - `403` if user has not completed a booking for this property

#### 2. Get Reviews for a Property
- **URL:** `GET /api/v1/properties/:id/reviews`
- **Auth:** Not required
- **Response:**
  ```json
  {
    "status": true,
    "message": "Reviews fetched successfully",
    "data": {
      "data": [
        {
          "_id": "...",
          "property": "...",
          "user": { "_id": "...", "firstName": "...", "lastName": "...", "avatar": "..." },
          "booking": "...",
          "rating": 5,
          "comment": "Great place!",
          "createdAt": "..."
        }
      ],
      "currentPage": 1,
      "totalPages": 1,
      "total": 1
    }
  }
  ```

### Requirements
- Users can only review properties they have completed a booking for (status: `completed`).
- Only one review per booking per user is allowed.
- Reviews include a rating (1-5) and a comment.

### Example Usage
**Create Review:**
```http
POST /api/v1/properties/PROPERTY_ID/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 4,
  "comment": "Nice and clean!"
}
```

**Get Reviews:**
```http
GET /api/v1/properties/PROPERTY_ID/reviews
```

## Admin Dashboard Stats Endpoint

### Overview
This endpoint provides all the necessary statistics for the admin dashboard home page.

### Endpoint
- **URL:** `GET /api/v1/admin/dashboard-stats`
- **Auth:** (Add your admin authentication as needed)

### Response Example
```json
{
  "status": true,
  "message": "Dashboard stats fetched successfully",
  "data": {
    "users": {
      "total": 100,
      "admins": 3,
      "landlords": 10,
      "recent": [
        { "_id": "...", "firstName": "...", "lastName": "...", "email": "...", "role": "admin", "createdAt": "..." }
      ]
    },
    "properties": {
      "total": 50,
      "approved": 40,
      "pending": 5,
      "rejected": 5,
      "recent": [
        { "_id": "...", "title": "...", "type": "...", "landlord": "...", "isApproved": true, "createdAt": "..." }
      ]
    },
    "bookings": {
      "total": 200,
      "completed": 150,
      "pending": 30,
      "cancelled": 20,
      "recent": [
        { "_id": "...", "user": { "_id": "...", "firstName": "...", "lastName": "..." }, "property": { "_id": "...", "title": "..." }, "bookingStatus": "completed", "createdAt": "..." }
      ]
    },
    "revenue": 123456.78,
    "reviews": 80
  }
}
```