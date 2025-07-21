/**
 * Chat System Integration Guide
 * 
 * This file shows how to integrate the chat system with your Express application
 * Add this to your main server file (src/index.ts)
 */

import { createServer } from 'http';
import express from 'express';
import { ChatSocketService } from '../services/chatSocket.service';

// Your existing Express app setup
const app = express();

// Create HTTP server (required for Socket.IO)
const httpServer = createServer(app);

// Initialize chat socket service
const chatSocketService = new ChatSocketService(httpServer);

// Your existing middleware and routes
// ... existing code ...

// Start server with both HTTP and WebSocket support
const PORT = process.env.PORT || 8000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready for chat connections`);
  console.log(`Online users: ${chatSocketService.getOnlineUsersCount()}`);
});

// Optional: Set up graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Process terminated');
  });
});

export { chatSocketService };
