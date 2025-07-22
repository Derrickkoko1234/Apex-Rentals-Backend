import { Router } from "express";
import {
  getUserConversations,
  createOrGetConversation,
  sendMessage,
  getConversationMessages,
  markConversationAsRead,
  archiveConversation,
  deleteConversation,
  deleteMessage,
  editMessage,
  searchConversations,
  getChatStats,
} from "../controllers/chat.controller";
import { verifyToken } from "../middlewares/token";

const router = Router();

// All chat routes require authentication
router.use(verifyToken);

/**
 * @route GET /api/v1/chat/conversations
 * @description Get all conversations for the authenticated user
 * @access Private
 * @query page - Page number (optional, default: 1)
 * @query limit - Items per page (optional, default: 20)
 * @query status - Filter by conversation status (optional)
 * @query type - Filter by conversation type (optional)
 */
router.get("/conversations", getUserConversations);

/**
 * @route POST /api/v1/chat/conversations
 * @description Create or get existing conversation
 * @access Private
 * @body participantId - ID of the other user
 * @body propertyId - ID of the property (optional, for property inquiries)
 * @body type - Type of conversation (optional, default: general)
 */
router.post("/conversations", createOrGetConversation);

/**
 * @route GET /api/v1/chat/conversations/search
 * @description Search conversations
 * @access Private
 * @query query - Search query string
 * @query type - Filter by conversation type (optional)
 * @query page - Page number (optional, default: 1)
 * @query limit - Items per page (optional, default: 20)
 */
router.get("/conversations/search", searchConversations);

/**
 * @route GET /api/v1/chat/stats
 * @description Get chat statistics for the user
 * @access Private
 */
router.get("/stats", getChatStats);

/**
 * @route GET /api/v1/chat/conversations/:conversationId/messages
 * @description Get messages in a conversation
 * @access Private
 * @param conversationId - ID of the conversation
 * @query page - Page number (optional, default: 1)
 * @query limit - Items per page (optional, default: 50)
 */
router.get("/conversations/:conversationId/messages", getConversationMessages);

/**
 * @route POST /api/v1/chat/conversations/:conversationId/messages
 * @description Send a message in a conversation
 * @access Private
 * @param conversationId - ID of the conversation
 * @body content - Message content
 * @body type - Message type (optional, default: text)
 * @body replyTo - ID of message being replied to (optional)
 */
router.post("/conversations/:conversationId/messages", sendMessage);

/**
 * @route PUT /api/v1/chat/conversations/:conversationId/read
 * @description Mark conversation as read
 * @access Private
 * @param conversationId - ID of the conversation
 */
router.put("/conversations/:conversationId/read", markConversationAsRead);

/**
 * @route PUT /api/v1/chat/conversations/:conversationId/archive
 * @description Archive a conversation
 * @access Private
 * @param conversationId - ID of the conversation
 */
router.put("/conversations/:conversationId/archive", archiveConversation);

/**
 * @route DELETE /api/v1/chat/conversations/:conversationId
 * @description Delete a conversation (soft delete)
 * @access Private
 * @param conversationId - ID of the conversation
 */
router.delete("/conversations/:conversationId", deleteConversation);

/**
 * @route PUT /api/v1/chat/messages/:messageId
 * @description Edit a message
 * @access Private
 * @param messageId - ID of the message
 * @body content - New message content
 */
router.put("/messages/:messageId", editMessage);

/**
 * @route DELETE /api/v1/chat/messages/:messageId
 * @description Delete a message
 * @access Private
 * @param messageId - ID of the message
 */
router.delete("/messages/:messageId", deleteMessage);

export default router;
