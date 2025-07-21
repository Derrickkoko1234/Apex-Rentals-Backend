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
    "bookingId": "<booking_id>",
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
    "data": [
      {
        "_id": "...",
        "property": "...",
        "user": { "_id": "...", "name": "..." },
        "booking": "...",
        "rating": 5,
        "comment": "Great place!",
        "createdAt": "..."
      }
    ]
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
  "bookingId": "BOOKING_ID",
  "rating": 4,
  "comment": "Nice and clean!"
}
```

**Get Reviews:**
```http
GET /api/v1/properties/PROPERTY_ID/reviews
```