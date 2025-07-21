import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { Conversation, IConversationDocument } from "../models/conversation.model";
import { Message, IMessageDocument } from "../models/message.model";
import { Types } from "mongoose";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

class ChatSocketService {
  private io: Server;
  private connectedUsers: Map<string, string[]> = new Map(); // userId -> [socketIds]
  private userRooms: Map<string, Set<string>> = new Map(); // socketId -> Set<conversationIds>

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error("Authentication token required"));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as any;
        
        // Get user from database
        const user = await User.findById(decoded.id);
        if (!user) {
          return next(new Error("User not found"));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        
        next();
      } catch (error) {
        next(new Error("Invalid authentication token"));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected with socket ${socket.id}`);
      
      this.handleUserConnection(socket);
      this.handleJoinConversation(socket);
      this.handleLeaveConversation(socket);
      this.handleSendMessage(socket);
      this.handleTyping(socket);
      this.handleMarkAsRead(socket);
      this.handleDisconnection(socket);
    });
  }

  private handleUserConnection(socket: AuthenticatedSocket) {
    const userId = socket.userId!;
    
    // Add socket to user's connections
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, []);
    }
    this.connectedUsers.get(userId)!.push(socket.id);
    this.userRooms.set(socket.id, new Set());

    // Join user to their personal room for notifications
    socket.join(`user:${userId}`);

    // Emit user online status to their contacts
    this.emitUserOnlineStatus(userId, true);

    // Send user their unread conversations count
    this.sendUnreadConversationsCount(socket);
  }

  private handleJoinConversation(socket: AuthenticatedSocket) {
    socket.on("join_conversation", async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;
        const userId = socket.userId!;

        // Validate conversation and user participation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.isParticipant(new Types.ObjectId(userId))) {
          socket.emit("error", { message: "Invalid conversation or access denied" });
          return;
        }

        // Join the conversation room
        socket.join(`conversation:${conversationId}`);
        this.userRooms.get(socket.id)?.add(conversationId);

        // Mark all messages in conversation as read
        await Message.markAllAsRead(
          new Types.ObjectId(conversationId),
          new Types.ObjectId(userId)
        );

        // Notify other participants that user is active in conversation
        socket.to(`conversation:${conversationId}`).emit("user_joined_conversation", {
          userId,
          conversationId,
          user: {
            _id: socket.user._id,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
            avatar: socket.user.avatar,
          },
        });

        socket.emit("joined_conversation", { conversationId });
      } catch (error) {
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });
  }

  private handleLeaveConversation(socket: AuthenticatedSocket) {
    socket.on("leave_conversation", (data: { conversationId: string }) => {
      const { conversationId } = data;
      
      socket.leave(`conversation:${conversationId}`);
      this.userRooms.get(socket.id)?.delete(conversationId);

      // Notify other participants
      socket.to(`conversation:${conversationId}`).emit("user_left_conversation", {
        userId: socket.userId,
        conversationId,
      });

      socket.emit("left_conversation", { conversationId });
    });
  }

  private handleSendMessage(socket: AuthenticatedSocket) {
    socket.on("send_message", async (data: {
      conversationId: string;
      content: string;
      type?: string;
      replyTo?: string;
    }) => {
      try {
        const { conversationId, content, type = "text", replyTo } = data;
        const userId = socket.userId!;

        // Validate conversation and user participation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.isParticipant(new Types.ObjectId(userId))) {
          socket.emit("error", { message: "Invalid conversation or access denied" });
          return;
        }

        // Create message
        const message = new Message({
          conversation: conversationId,
          sender: userId,
          recipient: conversation.getOtherParticipant(new Types.ObjectId(userId)),
          content: content.trim(),
          type,
          replyTo: replyTo ? new Types.ObjectId(replyTo) : undefined,
        });

        await message.save();
        await message.populate("sender", "firstName lastName avatar");
        if (replyTo) {
          await message.populate("replyTo");
        }

        // Emit message to all participants in the conversation
        this.io.to(`conversation:${conversationId}`).emit("new_message", {
          message,
          conversationId,
        });

        // Send push notification to offline users
        const otherParticipant = conversation.getOtherParticipant(new Types.ObjectId(userId));
        if (otherParticipant && !this.isUserOnline(otherParticipant.toString())) {
          // TODO: Send push notification
          this.sendPushNotification(otherParticipant.toString(), {
            title: `${socket.user.firstName} ${socket.user.lastName}`,
            body: content,
            data: { conversationId, messageId: message._id },
          });
        }

        // Update conversation's unread count for other participants
        await this.updateUnreadCount(conversationId, userId);

      } catch (error) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });
  }

  private handleTyping(socket: AuthenticatedSocket) {
    socket.on("typing_start", (data: { conversationId: string }) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit("user_typing_start", {
        userId: socket.userId,
        conversationId,
        user: {
          firstName: socket.user.firstName,
          lastName: socket.user.lastName,
        },
      });
    });

    socket.on("typing_stop", (data: { conversationId: string }) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit("user_typing_stop", {
        userId: socket.userId,
        conversationId,
      });
    });
  }

  private handleMarkAsRead(socket: AuthenticatedSocket) {
    socket.on("mark_as_read", async (data: { conversationId: string, messageId?: string }) => {
      try {
        const { conversationId, messageId } = data;
        const userId = socket.userId!;

        if (messageId) {
          // Mark specific message as read
          const message = await Message.findById(messageId);
          if (message && message.conversation.toString() === conversationId) {
            await message.markAsRead(userId);
          }
        } else {
          // Mark all messages in conversation as read
          await Message.markAllAsRead(
            new Types.ObjectId(conversationId),
            new Types.ObjectId(userId)
          );
        }

        // Notify other participants
        socket.to(`conversation:${conversationId}`).emit("messages_read", {
          userId,
          conversationId,
          messageId,
        });

      } catch (error) {
        socket.emit("error", { message: "Failed to mark as read" });
      }
    });
  }

  private handleDisconnection(socket: AuthenticatedSocket) {
    socket.on("disconnect", () => {
      const userId = socket.userId!;
      console.log(`User ${userId} disconnected from socket ${socket.id}`);

      // Remove socket from user's connections
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        const index = userSockets.indexOf(socket.id);
        if (index > -1) {
          userSockets.splice(index, 1);
        }

        // If no more sockets for this user, mark as offline
        if (userSockets.length === 0) {
          this.connectedUsers.delete(userId);
          this.emitUserOnlineStatus(userId, false);
        }
      }

      // Clean up user rooms
      this.userRooms.delete(socket.id);
    });
  }

  private isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  private emitUserOnlineStatus(userId: string, isOnline: boolean) {
    // Emit to user's contacts that they are online/offline
    // This would require getting user's contacts/recent conversations
    this.io.emit("user_status_change", {
      userId,
      isOnline,
      lastSeen: isOnline ? null : new Date(),
    });
  }

  private async sendUnreadConversationsCount(socket: AuthenticatedSocket) {
    try {
      const userId = socket.userId!;
      const unreadCount = await Message.aggregate([
        {
          $match: {
            "readBy.user": { $ne: new Types.ObjectId(userId) },
            sender: { $ne: new Types.ObjectId(userId) },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: "$conversation",
            count: { $sum: 1 },
          },
        },
      ]);

      socket.emit("unread_conversations_count", {
        totalUnreadConversations: unreadCount.length,
        unreadCounts: unreadCount,
      });
    } catch (error) {
      console.error("Error sending unread count:", error);
    }
  }

  private async updateUnreadCount(conversationId: string, senderId: string) {
    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      // Update unread count for other participants
      for (const participantId of conversation.participants) {
        if (participantId.toString() !== senderId) {
          const unreadCount = await Message.getUnreadCount(
            new Types.ObjectId(conversationId),
            participantId
          );

          // Emit to user if they're online
          if (this.isUserOnline(participantId.toString())) {
            this.io.to(`user:${participantId}`).emit("unread_count_updated", {
              conversationId,
              unreadCount,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error updating unread count:", error);
    }
  }

  private async sendPushNotification(userId: string, notification: {
    title: string;
    body: string;
    data: any;
  }) {
    // TODO: Implement push notification service
    // This would integrate with FCM, APNS, or another push service
    console.log(`Push notification for user ${userId}:`, notification);
  }

  // Public method to emit to specific user
  public emitToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  // Public method to emit to conversation
  public emitToConversation(conversationId: string, event: string, data: any) {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }

  // Get online users count
  public getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get user's socket count
  public getUserSocketCount(userId: string): number {
    return this.connectedUsers.get(userId)?.length || 0;
  }
}

export { ChatSocketService };
