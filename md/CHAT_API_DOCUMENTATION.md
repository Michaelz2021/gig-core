# Chat API Documentation

Created: 2025-11-29

## Overview

This document describes the chat-related APIs for the gig-core server. The chat functionality supports both REST API and WebSocket.

**Base URL:** `/api/v1/messages`  
**WebSocket Namespace:** `/chat`  
**Authentication:** All APIs require JWT Bearer token.

---

## 1. REST API

### 1.1 Message Management

#### 1.1.1 Get Message List
```http
GET /api/v1/messages
Authorization: Bearer {token}
```

**Query Parameters:**
- `otherUserId` (optional): Filter messages with a specific user

**Response Example:**
```json
{
  "messages": [
    {
      "id": "message-id",
      "senderId": "user-id",
      "receiverId": "other-user-id",
      "content": "Hello!",
      "timestamp": "2025-11-29T10:00:00Z",
      "isRead": false
    }
  ]
}
```

---

#### 1.1.2 Send Message (Legacy)
```http
POST /api/v1/messages
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "receiverId": "user-id",
  "content": "Hello!",
  "bookingId": "booking-id"
}
```

**Response Example:**
```json
{
  "id": "message-id",
  "senderId": "your-id",
  "receiverId": "user-id",
  "content": "Hello!",
  "timestamp": "2025-11-29T10:00:00Z"
}
```

---

#### 1.1.3 Mark Message as Read
```http
PATCH /api/v1/messages/{messageId}/read
Authorization: Bearer {token}
```

**Response Example:**
```json
{
  "success": true,
  "messageId": "message-id"
}
```

---

### 1.2 Chat Room Management

#### 1.2.1 Get Chat Room List
```http
GET /api/v1/messages/chat-rooms
Authorization: Bearer {token}
```

**Response Example:**
```json
{
  "rooms": [
    {
      "id": "room-id",
      "user1Id": "user-id-1",
      "user2Id": "user-id-2",
      "bookingId": "booking-id",
      "auctionId": "auction-id",
      "createdAt": "2025-11-29T10:00:00Z",
      "updatedAt": "2025-11-29T10:00:00Z"
    }
  ]
}
```

---

#### 1.2.2 Get Chat Room Details
```http
GET /api/v1/messages/chat-rooms/{roomId}
Authorization: Bearer {token}
```

**Response Example:**
```json
{
  "id": "room-id",
  "user1Id": "user-id-1",
  "user2Id": "user-id-2",
  "bookingId": "booking-id",
  "auctionId": "auction-id",
  "createdAt": "2025-11-29T10:00:00Z",
  "updatedAt": "2025-11-29T10:00:00Z"
}
```

---

#### 1.2.3 Create or Get Chat Room
```http
POST /api/v1/messages/chat-rooms
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "otherUserId": "user-id",
  "bookingId": "booking-id",
  "auctionId": "auction-id"
}
```

**Response Example:**
```json
{
  "id": "room-id",
  "user1Id": "your-id",
  "user2Id": "user-id",
  "bookingId": "booking-id",
  "createdAt": "2025-11-29T10:00:00Z"
}
```

**Note:** If a chat room already exists, it returns the existing room. Otherwise, it creates a new one.

---

### 1.3 Chat Management (API Spec Compatible)

#### 1.3.1 Get Chat List
```http
GET /api/v1/messages/chats
Authorization: Bearer {token}
```

**Response Example:**
```json
{
  "chats": [
    {
      "chatId": "room-id",
      "participantId": "other-user-id",
      "participantName": "John Doe",
      "participantImage": "https://example.com/image.jpg",
      "lastMessage": "Hello!",
      "lastMessageTime": "2025-11-29T10:00:00Z",
      "unreadCount": 2,
      "isOnline": false,
      "transactionId": "booking-id"
    }
  ]
}
```

---

#### 1.3.2 Get Chat Messages
```http
GET /api/v1/messages/chats/{chatId}/messages
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50): Number of messages per page

**Response Example:**
```json
{
  "messages": [
    {
      "messageId": "message-id",
      "roomId": "room-id",
      "senderId": "user-id",
      "content": "Hello!",
      "messageType": "TEXT",
      "attachmentUrl": null,
      "isRead": false,
      "timestamp": "2025-11-29T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100
  }
}
```

---

#### 1.3.3 Send Chat Message
```http
POST /api/v1/messages/chats/{chatId}/messages
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Hello!",
  "type": "TEXT",
  "attachmentUrl": "https://example.com/file.jpg"
}
```

**Message Types:**
- `TEXT`: Text message
- `IMAGE`: Image attachment (attachmentUrl required)
- `FILE`: File attachment (attachmentUrl required)

**Note:** If `attachmentUrl` is provided, the type is automatically determined:
- Image extensions (jpg, jpeg, png, gif, webp) → `IMAGE`
- Others → `FILE`

**Response Example:**
```json
{
  "messageId": "message-id",
  "roomId": "room-id",
  "senderId": "your-id",
  "content": "Hello!",
  "messageType": "TEXT",
  "attachmentUrl": null,
  "timestamp": "2025-11-29T10:00:00Z"
}
```

---

## 2. WebSocket API

### 2.1 Connection

**Namespace:** `/chat`

**Connection Method:**
```javascript
import { io } from 'socket.io-client';

const socket = io('http://your-server/chat', {
  auth: {
    token: 'your-jwt-token'
  },
  // or
  extraHeaders: {
    Authorization: 'Bearer your-jwt-token'
  }
});
```

**Automatic Processing on Connection:**
- JWT token verification
- User online status update
- Automatic offline message delivery
- `user:online` event broadcast

---

### 2.2 Client → Server Events

#### 2.2.1 Send Message
```javascript
socket.emit('message:send', {
  roomId: 'room-id',
  content: 'Hello!',
  messageType: 'TEXT',
  attachmentUrl: 'https://example.com/file.jpg'
});
```

**Response:**
```json
{
  "success": true,
  "messageId": "message-id",
  "timestamp": "2025-11-29T10:00:00Z"
}
```

---

#### 2.2.2 Mark Message as Read
```javascript
socket.emit('message:read', {
  messageId: 'message-id'
});
```

**Response:**
```json
{
  "success": true
}
```

---

#### 2.2.3 Start Typing
```javascript
socket.emit('typing:start', {
  roomId: 'room-id'
});
```

---

#### 2.2.4 Stop Typing
```javascript
socket.emit('typing:stop', {
  roomId: 'room-id'
});
```

---

#### 2.2.5 Join Chat Room
```javascript
socket.emit('room:join', {
  roomId: 'room-id'
});
```

**Response:**
```json
{
  "success": true,
  "roomId": "room-id"
}
```

---

#### 2.2.6 Leave Chat Room
```javascript
socket.emit('room:leave', {
  roomId: 'room-id'
});
```

**Response:**
```json
{
  "success": true
}
```

---

### 2.3 Server → Client Events

#### 2.3.1 Receive New Message
```javascript
socket.on('message:new', (data) => {
  console.log('New message:', data);
});
```

**Data Structure:**
```json
{
  "messageId": "message-id",
  "roomId": "room-id",
  "senderId": "user-id",
  "content": "Hello!",
  "messageType": "TEXT",
  "attachmentUrl": null,
  "timestamp": "2025-11-29T10:00:00Z"
}
```

---

#### 2.3.2 Receive Offline Messages
```javascript
socket.on('messages:offline', (messages) => {
  console.log('Offline messages:', messages);
});
```

**Data Structure:**
```json
[
  {
    "messageId": "message-id",
    "roomId": "room-id",
    "senderId": "user-id",
    "content": "Hello!",
    "messageType": "TEXT",
    "attachmentUrl": null,
    "timestamp": "2025-11-29T10:00:00Z"
  }
]
```

---

#### 2.3.3 Typing Start Notification
```javascript
socket.on('typing:start', (data) => {
  console.log('User is typing:', data);
});
```

**Data Structure:**
```json
{
  "roomId": "room-id",
  "userId": "user-id"
}
```

---

#### 2.3.4 Typing Stop Notification
```javascript
socket.on('typing:stop', (data) => {
  console.log('User stopped typing:', data);
});
```

**Data Structure:**
```json
{
  "roomId": "room-id",
  "userId": "user-id"
}
```

---

#### 2.3.5 User Online Notification
```javascript
socket.on('user:online', (data) => {
  console.log('User is online:', data);
});
```

**Data Structure:**
```json
{
  "userId": "user-id"
}
```

---

#### 2.3.6 User Offline Notification
```javascript
socket.on('user:offline', (data) => {
  console.log('User is offline:', data);
});
```

**Data Structure:**
```json
{
  "userId": "user-id"
}
```

---

## 3. API Summary

### REST API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/messages` | Get message list |
| POST | `/api/v1/messages` | Send message (legacy) |
| PATCH | `/api/v1/messages/{id}/read` | Mark message as read |
| GET | `/api/v1/messages/chat-rooms` | Get chat room list |
| GET | `/api/v1/messages/chat-rooms/{id}` | Get chat room details |
| POST | `/api/v1/messages/chat-rooms` | Create or get chat room |
| GET | `/api/v1/messages/chats` | Get chat list |
| GET | `/api/v1/messages/chats/{chatId}/messages` | Get chat messages |
| POST | `/api/v1/messages/chats/{chatId}/messages` | Send chat message |

### WebSocket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `message:send` | Client → Server | Send message |
| `message:read` | Client → Server | Mark message as read |
| `typing:start` | Client → Server | Start typing |
| `typing:stop` | Client → Server | Stop typing |
| `room:join` | Client → Server | Join chat room |
| `room:leave` | Client → Server | Leave chat room |
| `message:new` | Server → Client | Receive new message |
| `messages:offline` | Server → Client | Receive offline messages |
| `typing:start` | Server → Client | Opponent starts typing |
| `typing:stop` | Server → Client | Opponent stops typing |
| `user:online` | Server → Client | User online notification |
| `user:offline` | Server → Client | User offline notification |

---

## 4. Related Files

- **Controller:** `/var/www/gig-core/src/modules/messages/messages.controller.ts`
- **Gateway:** `/var/www/gig-core/src/modules/messages/gateways/chat.gateway.ts`
- **Service:** `/var/www/gig-core/src/modules/messages/messages.service.ts`

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-29
