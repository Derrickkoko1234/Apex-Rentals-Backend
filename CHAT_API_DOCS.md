# Chat System API Documentation

## Overview
The chat system enables real-time messaging between users and landlords for property inquiries and general communication. It includes REST APIs for chat management and WebSocket for real-time features.

## Authentication
All chat endpoints require authentication via JWT token:
```
Authorization: Bearer <token>
```

## REST API Endpoints

### 1. Get User Conversations
**Endpoint:** `GET /api/v1/chat/conversations`
**Description:** Retrieve all conversations for the authenticated user with pagination and filtering

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (active, archived, blocked)
- `type` (optional): Filter by type (property_inquiry, general, support)

**Sample Request:**
```bash
GET /api/v1/chat/conversations?page=1&limit=10&status=active&type=property_inquiry
Authorization: Bearer <token>
```

**Sample Response:**
```json
{
  "status": true,
  "message": "Conversations retrieved successfully",
  "data": {
    "conversations": [
      {
        "_id": "60d5ecb54f13a54b5c8e8a1a",
        "participants": [
          {
            "_id": "60d5ecb54f13a54b5c8e8a1b",
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@example.com",
            "avatar": "https://example.com/avatar.jpg",
            "role": "user"
          },
          {
            "_id": "60d5ecb54f13a54b5c8e8a1c",
            "firstName": "Jane",
            "lastName": "Smith",
            "email": "jane@example.com",
            "avatar": "https://example.com/avatar2.jpg",
            "role": "landlord"
          }
        ],
        "property": {
          "_id": "60d5ecb54f13a54b5c8e8a1d",
          "title": "Luxury Apartment",
          "address": "123 Main St",
          "photos": ["https://example.com/photo1.jpg"],
          "rent": 1500
        },
        "title": "Property Inquiry",
        "type": "property_inquiry",
        "status": "active",
        "lastMessage": {
          "_id": "60d5ecb54f13a54b5c8e8a1e",
          "content": "Is this property still available?",
          "createdAt": "2024-07-14T10:30:00.000Z",
          "sender": {
            "firstName": "John",
            "lastName": "Doe",
            "avatar": "https://example.com/avatar.jpg"
          }
        },
        "lastMessageAt": "2024-07-14T10:30:00.000Z",
        "unreadCount": 2,
        "otherParticipant": {
          "_id": "60d5ecb54f13a54b5c8e8a1c",
          "firstName": "Jane",
          "lastName": "Smith",
          "avatar": "https://example.com/avatar2.jpg",
          "role": "landlord"
        },
        "metadata": {
          "propertyTitle": "Luxury Apartment",
          "propertyAddress": "123 Main St",
          "inquiryType": "property_inquiry"
        },
        "createdAt": "2024-07-14T09:00:00.000Z",
        "updatedAt": "2024-07-14T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalConversations": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 2. Create or Get Conversation
**Endpoint:** `POST /api/v1/chat/conversations`
**Description:** Create a new conversation or get existing one between users

**Request Body:**
```json
{
  "participantId": "60d5ecb54f13a54b5c8e8a1c",
  "propertyId": "60d5ecb54f13a54b5c8e8a1d",
  "type": "property_inquiry"
}
```

**Sample Response:**
```json
{
  "status": true,
  "message": "Conversation retrieved successfully",
  "data": {
    "_id": "60d5ecb54f13a54b5c8e8a1a",
    "participants": [...],
    "property": {...},
    "title": "Property Inquiry",
    "type": "property_inquiry",
    "status": "active",
    "createdAt": "2024-07-14T09:00:00.000Z"
  }
}
```

### 3. Get Conversation Messages
**Endpoint:** `GET /api/v1/chat/conversations/:conversationId/messages`
**Description:** Get messages in a specific conversation with pagination

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Sample Request:**
```bash
GET /api/v1/chat/conversations/60d5ecb54f13a54b5c8e8a1a/messages?page=1&limit=20
Authorization: Bearer <token>
```

**Sample Response:**
```json
{
  "status": true,
  "message": "Messages retrieved successfully",
  "data": {
    "messages": [
      {
        "_id": "60d5ecb54f13a54b5c8e8a1e",
        "conversation": "60d5ecb54f13a54b5c8e8a1a",
        "sender": {
          "_id": "60d5ecb54f13a54b5c8e8a1b",
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "https://example.com/avatar.jpg"
        },
        "content": "Is this property still available?",
        "type": "text",
        "status": "read",
        "readBy": [
          {
            "user": "60d5ecb54f13a54b5c8e8a1c",
            "readAt": "2024-07-14T10:35:00.000Z"
          }
        ],
        "isEdited": false,
        "isDeleted": false,
        "createdAt": "2024-07-14T10:30:00.000Z",
        "updatedAt": "2024-07-14T10:35:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalMessages": 35,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 4. Send Message
**Endpoint:** `POST /api/v1/chat/conversations/:conversationId/messages`
**Description:** Send a message in a conversation

**Request Body:**
```json
{
  "content": "Yes, it's still available. Would you like to schedule a viewing?",
  "type": "text",
  "replyTo": "60d5ecb54f13a54b5c8e8a1e"
}
```

**Sample Response:**
```json
{
  "status": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "60d5ecb54f13a54b5c8e8a1f",
    "conversation": "60d5ecb54f13a54b5c8e8a1a",
    "sender": {
      "_id": "60d5ecb54f13a54b5c8e8a1c",
      "firstName": "Jane",
      "lastName": "Smith",
      "avatar": "https://example.com/avatar2.jpg"
    },
    "content": "Yes, it's still available. Would you like to schedule a viewing?",
    "type": "text",
    "status": "sent",
    "replyTo": {
      "_id": "60d5ecb54f13a54b5c8e8a1e",
      "content": "Is this property still available?",
      "sender": "60d5ecb54f13a54b5c8e8a1b"
    },
    "readBy": [],
    "isEdited": false,
    "isDeleted": false,
    "createdAt": "2024-07-14T10:45:00.000Z",
    "updatedAt": "2024-07-14T10:45:00.000Z"
  }
}
```

### 5. Mark Conversation as Read
**Endpoint:** `PUT /api/v1/chat/conversations/:conversationId/read`
**Description:** Mark all messages in a conversation as read

**Sample Response:**
```json
{
  "status": true,
  "message": "Conversation marked as read",
  "data": {
    "markedMessagesCount": 5
  }
}
```

### 6. Archive Conversation
**Endpoint:** `PUT /api/v1/chat/conversations/:conversationId/archive`
**Description:** Archive a conversation

**Sample Response:**
```json
{
  "status": true,
  "message": "Conversation archived successfully",
  "data": {
    "_id": "60d5ecb54f13a54b5c8e8a1a",
    "status": "archived",
    "updatedAt": "2024-07-14T11:00:00.000Z"
  }
}
```

### 7. Delete Conversation
**Endpoint:** `DELETE /api/v1/chat/conversations/:conversationId`
**Description:** Soft delete a conversation for the current user

**Sample Response:**
```json
{
  "status": true,
  "message": "Conversation deleted successfully",
  "data": null
}
```

### 8. Edit Message
**Endpoint:** `PUT /api/v1/chat/messages/:messageId`
**Description:** Edit a message (within 24 hours)

**Request Body:**
```json
{
  "content": "Yes, it's still available. Would you like to schedule a viewing this week?"
}
```

**Sample Response:**
```json
{
  "status": true,
  "message": "Message edited successfully",
  "data": {
    "_id": "60d5ecb54f13a54b5c8e8a1f",
    "content": "Yes, it's still available. Would you like to schedule a viewing this week?",
    "isEdited": true,
    "editedAt": "2024-07-14T11:15:00.000Z",
    "sender": {
      "firstName": "Jane",
      "lastName": "Smith",
      "avatar": "https://example.com/avatar2.jpg"
    }
  }
}
```

### 9. Delete Message
**Endpoint:** `DELETE /api/v1/chat/messages/:messageId`
**Description:** Delete a message (within 24 hours, only sender can delete)

**Sample Response:**
```json
{
  "status": true,
  "message": "Message deleted successfully",
  "data": null
}
```

### 10. Search Conversations
**Endpoint:** `GET /api/v1/chat/conversations/search`
**Description:** Search conversations by content or metadata

**Query Parameters:**
- `query` (required): Search query string
- `type` (optional): Filter by conversation type
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Sample Request:**
```bash
GET /api/v1/chat/conversations/search?query=luxury&type=property_inquiry&page=1&limit=10
Authorization: Bearer <token>
```

**Sample Response:**
```json
{
  "status": true,
  "message": "Search results retrieved successfully",
  "data": {
    "conversations": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalResults": 15,
      "query": "luxury"
    }
  }
}
```

### 11. Get Chat Statistics
**Endpoint:** `GET /api/v1/chat/stats`
**Description:** Get chat statistics for the authenticated user

**Sample Response:**
```json
{
  "status": true,
  "message": "Chat statistics retrieved successfully",
  "data": {
    "totalConversations": 25,
    "unreadConversations": 3,
    "totalMessages": 150,
    "propertyInquiries": 12,
    "recentMessages": 8
  }
}
```

## WebSocket Events

### Connection
Connect to WebSocket server with authentication:
```javascript
const socket = io('ws://localhost:8000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events to Emit

#### 1. Join Conversation
```javascript
socket.emit('join_conversation', {
  conversationId: '60d5ecb54f13a54b5c8e8a1a'
});
```

#### 2. Leave Conversation
```javascript
socket.emit('leave_conversation', {
  conversationId: '60d5ecb54f13a54b5c8e8a1a'
});
```

#### 3. Send Message
```javascript
socket.emit('send_message', {
  conversationId: '60d5ecb54f13a54b5c8e8a1a',
  content: 'Hello, is this property still available?',
  type: 'text',
  replyTo: '60d5ecb54f13a54b5c8e8a1e' // optional
});
```

#### 4. Typing Indicators
```javascript
// Start typing
socket.emit('typing_start', {
  conversationId: '60d5ecb54f13a54b5c8e8a1a'
});

// Stop typing
socket.emit('typing_stop', {
  conversationId: '60d5ecb54f13a54b5c8e8a1a'
});
```

#### 5. Mark as Read
```javascript
socket.emit('mark_as_read', {
  conversationId: '60d5ecb54f13a54b5c8e8a1a',
  messageId: '60d5ecb54f13a54b5c8e8a1f' // optional, for specific message
});
```

### Events to Listen

#### 1. New Message
```javascript
socket.on('new_message', (data) => {
  console.log('New message:', data.message);
  console.log('Conversation:', data.conversationId);
});
```

#### 2. User Joined/Left Conversation
```javascript
socket.on('user_joined_conversation', (data) => {
  console.log('User joined:', data.user);
});

socket.on('user_left_conversation', (data) => {
  console.log('User left:', data.userId);
});
```

#### 3. Typing Indicators
```javascript
socket.on('user_typing_start', (data) => {
  console.log(`${data.user.firstName} is typing...`);
});

socket.on('user_typing_stop', (data) => {
  console.log(`${data.userId} stopped typing`);
});
```

#### 4. Messages Read
```javascript
socket.on('messages_read', (data) => {
  console.log('Messages read by:', data.userId);
});
```

#### 5. User Status Changes
```javascript
socket.on('user_status_change', (data) => {
  console.log(`User ${data.userId} is ${data.isOnline ? 'online' : 'offline'}`);
});
```

#### 6. Unread Count Updates
```javascript
socket.on('unread_count_updated', (data) => {
  console.log(`Unread count for conversation ${data.conversationId}: ${data.unreadCount}`);
});

socket.on('unread_conversations_count', (data) => {
  console.log(`Total unread conversations: ${data.totalUnreadConversations}`);
});
```

#### 7. Connection Status
```javascript
socket.on('joined_conversation', (data) => {
  console.log('Successfully joined conversation:', data.conversationId);
});

socket.on('left_conversation', (data) => {
  console.log('Successfully left conversation:', data.conversationId);
});
```

#### 8. Errors
```javascript
socket.on('error', (data) => {
  console.error('Socket error:', data.message);
});
```

## Message Types
- `text`: Regular text message
- `image`: Image attachment
- `file`: File attachment
- `system`: System-generated message
- `property_share`: Shared property information

## Conversation Types
- `property_inquiry`: Property-related conversations
- `general`: General conversations between users
- `support`: Support conversations

## Conversation Status
- `active`: Active conversation
- `archived`: Archived conversation (hidden from main list)
- `blocked`: Blocked conversation

## Rate Limiting
- REST API: 100 requests per minute per user
- WebSocket: 50 messages per minute per user
- File uploads: 10MB per file, 5 files per minute

## Error Handling
All endpoints return consistent error format:
```json
{
  "status": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (no permission)
- `404`: Not Found (resource doesn't exist)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## Real-time Features
- **Instant Messaging**: Messages appear immediately for all participants
- **Typing Indicators**: See when other users are typing
- **Read Receipts**: Know when messages are read
- **Online Status**: See who's currently online
- **Push Notifications**: Get notified when offline
- **Message Editing**: Edit messages within 24 hours
- **Message Deletion**: Delete messages within 24 hours

## Security Features
- **JWT Authentication**: Secure token-based authentication
- **User Validation**: Verify user permissions for each conversation
- **Rate Limiting**: Prevent spam and abuse
- **Content Validation**: Sanitize and validate message content
- **Soft Deletion**: Messages/conversations are soft deleted for audit trail

## Performance Optimizations
- **Database Indexing**: Optimized queries with proper indexes
- **Pagination**: Efficient loading of large conversation lists
- **Connection Pooling**: Optimized database connections
- **Message Caching**: Cache frequently accessed conversations
- **Background Processing**: Handle notifications asynchronously
