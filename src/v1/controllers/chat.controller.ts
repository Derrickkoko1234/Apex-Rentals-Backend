import { Response } from "express";
import { ExtendedRequest } from "../middlewares/token";
import {
  Conversation,
  ConversationType,
  ConversationStatus,
} from "../models/conversation.model";
import { Message, MessageType, MessageStatus } from "../models/message.model";
import { Property } from "../models/property.model";
import { User } from "../models/user.model";
import { isValidObjectId, Types } from "mongoose";
import { RoleEnum } from "../enums/role.enum";

// Get all conversations for a user
export async function getUserConversations(
  req: ExtendedRequest,
  res: Response
) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as ConversationStatus;
    const type = req.query.type as ConversationType;

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {
      participants: user._id,
      deletedBy: { $ne: user._id },
      isDeleted: false,
    };

    if (status && Object.values(ConversationStatus).includes(status)) {
      query.status = status;
    }

    if (type && Object.values(ConversationType).includes(type)) {
      query.type = type;
    }

    const conversations = await Conversation.find(query)
      .populate("participants", "firstName lastName email avatar role")
      .populate("property", "title address photos rent")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "firstName lastName avatar",
        },
      })
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate unread counts and format response
    const formattedConversations = await Promise.all(
      conversations.map(async (conversation: any) => {
        const unreadCount = await Message.getUnreadCount(
          conversation._id,
          user._id as Types.ObjectId
        );

        // Get other participant
        const otherParticipant = conversation.participants.find(
          (participant: any) =>
            participant._id.toString() !== user._id?.toString()
        );

        return {
          ...conversation.toObject(),
          unreadCount,
          otherParticipant,
        };
      })
    );

    const totalConversations = await Conversation.countDocuments(query);

    return res.status(200).json({
      status: true,
      message: "Conversations retrieved successfully",
      data: {
        conversations: formattedConversations,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalConversations / limit),
          totalConversations,
          hasNext: page < Math.ceil(totalConversations / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
    });
  }
}

// Create or get conversation
export async function createOrGetConversation(
  req: ExtendedRequest,
  res: Response
) {
  try {
    const {
      participantId,
      propertyId,
      type = ConversationType.GENERAL,
    } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    if (!isValidObjectId(participantId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid participant ID",
      });
    }

    if (participantId === user._id?.toString()) {
      return res.status(400).json({
        status: false,
        message: "Cannot create conversation with yourself",
      });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        status: false,
        message: "Participant not found",
      });
    }

    // Validate property if provided
    let property = null;
    if (propertyId) {
      if (!isValidObjectId(propertyId)) {
        return res.status(400).json({
          status: false,
          message: "Invalid property ID",
        });
      }

      property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({
          status: false,
          message: "Property not found",
        });
      }
    }

    const participants = [
      user._id as Types.ObjectId,
      new Types.ObjectId(participantId),
    ];

    const conversation = await Conversation.findOrCreateConversation(
      participants,
      propertyId ? new Types.ObjectId(propertyId) : undefined,
      type
    );

    // If property conversation, update metadata
    if (property && conversation.property) {
      conversation.metadata = {
        propertyTitle: property.title,
        propertyAddress: property.address,
        inquiryType: type,
      };
      await conversation.save();
    }

    return res.status(200).json({
      status: true,
      message: "Conversation retrieved successfully",
      data: conversation,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
    });
  }
}

// Send message
export async function sendMessage(req: ExtendedRequest, res: Response) {
  try {
    const { conversationId } = req.params;
    const { content, type = MessageType.TEXT, replyTo } = req.body;
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid conversation ID",
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        status: false,
        message: "Message content is required",
      });
    }

    // Check if conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId).populate(
      "participants",
      "firstName lastName avatar"
    );

    if (!conversation) {
      return res.status(404).json({
        status: false,
        message: "Conversation not found",
      });
    }

    console.log(`User ID: ${user._id}, Conversation Participants: ${conversation.participants.map(p => p._id)}`);

    if (!conversation.isParticipant(user._id)) {
      return res.status(403).json({
        status: false,
        message: "You are not a participant in this conversation",
      });
    }

    // Validate reply message if provided
    if (replyTo && !isValidObjectId(replyTo)) {
      return res.status(400).json({
        status: false,
        message: "Invalid reply message ID",
      });
    }

    // Get recipient (other participant)
    const recipient = conversation.getOtherParticipant(user._id);

    // Create message
    const message = new Message({
      conversation: conversationId,
      sender: user._id,
      recipient,
      content: content.trim(),
      type,
      replyTo: replyTo ? new Types.ObjectId(replyTo) : undefined,
    });

    await message.save();

    // Populate message with sender info
    await message.populate("sender", "firstName lastName avatar");
    if (replyTo) {
      await message.populate("replyTo");
    }

    // Update conversation status to active if it was archived
    if (conversation.status === ConversationStatus.ARCHIVED) {
      conversation.status = ConversationStatus.ACTIVE;
      await conversation.save();
    }

    // TODO: Emit real-time event to other participants
    // emitToConversation(conversationId, 'newMessage', message);

    return res.status(201).json({
      status: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
    });
  }
}

// Get messages in a conversation
export async function getConversationMessages(
  req: ExtendedRequest,
  res: Response
) {
  try {
    const { conversationId } = req.params;
    const user = req.user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid conversation ID",
      });
    }

    const skip = (page - 1) * limit;

    // Check if user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        status: false,
        message: "Conversation not found",
      });
    }

    if (!conversation.isParticipant(user._id)) {
      return res.status(403).json({
        status: false,
        message: "You are not a participant in this conversation",
      });
    }

    // Get messages
    const messages = await Message.find({
      conversation: conversationId,
      isDeleted: false,
    })
      .populate("sender", "firstName lastName avatar")
      .populate("replyTo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Mark messages as read
    await Message.markAllAsRead(new Types.ObjectId(conversationId), user._id);

    const totalMessages = await Message.countDocuments({
      conversation: conversationId,
      isDeleted: false,
    });

    return res.status(200).json({
      status: true,
      message: "Messages retrieved successfully",
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalMessages / limit),
          totalMessages,
          hasNext: page < Math.ceil(totalMessages / limit),
          hasPrev: page > 1,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
    });
  }
}

// Mark conversation as read
export async function markConversationAsRead(
  req: ExtendedRequest,
  res: Response
) {
  try {
    const { conversationId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid conversation ID",
      });
    }

    // Check if user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        status: false,
        message: "Conversation not found",
      });
    }

    if (!conversation.isParticipant(user._id)) {
      return res.status(403).json({
        status: false,
        message: "You are not a participant in this conversation",
      });
    }

    // Mark all unread messages as read
    const markedCount = await Message.markAllAsRead(
      new Types.ObjectId(conversationId),
      user._id
    );

    return res.status(200).json({
      status: true,
      message: "Conversation marked as read",
      data: {
        markedMessagesCount: markedCount,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
    });
  }
}

// Archive conversation
export async function archiveConversation(req: ExtendedRequest, res: Response) {
  try {
    const { conversationId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        status: false,
        message: "Conversation not found",
      });
    }

    if (!conversation.isParticipant(user._id)) {
      return res.status(403).json({
        status: false,
        message: "You are not a participant in this conversation",
      });
    }

    conversation.status = ConversationStatus.ARCHIVED;
    await conversation.save();

    return res.status(200).json({
      status: true,
      message: "Conversation archived successfully",
      data: conversation,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
    });
  }
}

// Delete conversation
export async function deleteConversation(req: ExtendedRequest, res: Response) {
  try {
    const { conversationId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        status: false,
        message: "Conversation not found",
      });
    }

    if (!conversation.isParticipant(user._id)) {
      return res.status(403).json({
        status: false,
        message: "You are not a participant in this conversation",
      });
    }

    // Add user to deletedBy array
    if (!conversation.deletedBy.includes(user._id as Types.ObjectId)) {
      conversation.deletedBy.push(user._id as Types.ObjectId);
    }

    // If all participants have deleted, mark as deleted
    if (conversation.deletedBy.length >= conversation.participants.length) {
      conversation.isDeleted = true;
    }

    await conversation.save();

    return res.status(200).json({
      status: true,
      message: "Conversation deleted successfully",
      data: null,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
    });
  }
}

// Delete message
export async function deleteMessage(req: ExtendedRequest, res: Response) {
  try {
    const { messageId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    if (!isValidObjectId(messageId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid message ID",
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        status: false,
        message: "Message not found",
      });
    }

    // Only sender can delete their message
    if (message.sender.toString() !== user._id?.toString()) {
      return res.status(403).json({
        status: false,
        message: "You can only delete your own messages",
      });
    }

    // Check if message is older than 24 hours
    const messageAge = Date.now() - message.createdAt.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (messageAge > twentyFourHours) {
      return res.status(400).json({
        status: false,
        message: "Cannot delete messages older than 24 hours",
      });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = user._id as Types.ObjectId;
    message.content = "This message was deleted";

    await message.save();

    return res.status(200).json({
      status: true,
      message: "Message deleted successfully",
      data: null,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
    });
  }
}

// Edit message
export async function editMessage(req: ExtendedRequest, res: Response) {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    if (!isValidObjectId(messageId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid message ID",
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        status: false,
        message: "Message content is required",
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        status: false,
        message: "Message not found",
      });
    }

    // Only sender can edit their message
    if (message.sender.toString() !== user._id?.toString()) {
      return res.status(403).json({
        status: false,
        message: "You can only edit your own messages",
      });
    }

    // Check if message is older than 24 hours
    const messageAge = Date.now() - message.createdAt.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (messageAge > twentyFourHours) {
      return res.status(400).json({
        status: false,
        message: "Cannot edit messages older than 24 hours",
      });
    }

    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();
    await message.populate("sender", "firstName lastName avatar");

    return res.status(200).json({
      status: true,
      message: "Message edited successfully",
      data: message,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
    });
  }
}

// Search conversations
export async function searchConversations(req: ExtendedRequest, res: Response) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }
    const { query, type } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({
        status: false,
        message: "Search query is required",
      });
    }

    const skip = (page - 1) * limit;

    // Build search query
    const searchQuery: any = {
      participants: user._id,
      deletedBy: { $ne: user._id },
      isDeleted: false,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { "metadata.propertyTitle": { $regex: query, $options: "i" } },
        { "metadata.propertyAddress": { $regex: query, $options: "i" } },
      ],
    };

    if (
      type &&
      Object.values(ConversationType).includes(type as ConversationType)
    ) {
      searchQuery.type = type;
    }

    const conversations = await Conversation.find(searchQuery)
      .populate("participants", "firstName lastName email avatar role")
      .populate("property", "title address photos")
      .populate("lastMessage")
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalResults = await Conversation.countDocuments(searchQuery);

    return res.status(200).json({
      status: true,
      message: "Search results retrieved successfully",
      data: {
        conversations,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalResults / limit),
          totalResults,
          query: query.toString(),
        },
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
    });
  }
}

// Get chat statistics (for admin or user dashboard)
export async function getChatStats(req: ExtendedRequest, res: Response) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized",
      });
    }

    const totalConversations = await Conversation.countDocuments({
      participants: user._id,
      isDeleted: false,
    });

    const unreadConversations = await Conversation.countDocuments({
      participants: user._id,
      isDeleted: false,
      [`unreadCount.${user._id}`]: { $gt: 0 },
    });

    const totalMessages = await Message.countDocuments({
      sender: user._id,
      isDeleted: false,
    });

    const propertyInquiries = await Conversation.countDocuments({
      participants: user._id,
      type: ConversationType.PROPERTY_INQUIRY,
      isDeleted: false,
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMessages = await Message.countDocuments({
      sender: user._id,
      createdAt: { $gte: sevenDaysAgo },
      isDeleted: false,
    });

    return res.status(200).json({
      status: true,
      message: "Chat statistics retrieved successfully",
      data: {
        totalConversations,
        unreadConversations,
        totalMessages,
        propertyInquiries,
        recentMessages,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
    });
  }
}
