import { Schema, model, Types, Document, Model } from "mongoose";
import { BaseModel } from "../interfaces/general.interface";

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  FILE = "file",
  SYSTEM = "system",
  PROPERTY_SHARE = "property_share",
}

export enum MessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  FAILED = "failed",
}

interface IMessage extends BaseModel {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  recipient?: Types.ObjectId;
  content: string;
  type: MessageType;
  status: MessageStatus;
  readBy: Array<{
    user: Types.ObjectId;
    readAt: Date;
  }>;
  editedAt?: Date;
  isEdited: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  replyTo?: Types.ObjectId;
  attachments?: Array<{
    type: string;
    url: string;
    filename: string;
    size: number;
  }>;
  metadata?: {
    propertyId?: Types.ObjectId;
    location?: {
      latitude: number;
      longitude: number;
      address: string;
    };
  };
}

interface IMessageMethods {
  markAsRead(userId: string | Types.ObjectId): Promise<void>;
  isReadBy(userId: string | Types.ObjectId): boolean;
}

interface MessageModel extends Model<IMessage, {}, IMessageMethods> {
  getUnreadCount(conversationId: Types.ObjectId, userId: Types.ObjectId): Promise<number>;
  markAllAsRead(conversationId: Types.ObjectId, userId: Types.ObjectId): Promise<number>;
}

type IMessageDocument = Document<unknown, {}, IMessage> & IMessage & IMessageMethods;

const messageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    type: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
    },
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.SENT,
    },
    readBy: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    editedAt: {
      type: Date,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    attachments: [
      {
        type: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
      },
    ],
    metadata: {
      propertyId: {
        type: Schema.Types.ObjectId,
        ref: "Property",
      },
      location: {
        latitude: Number,
        longitude: Number,
        address: String,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for performance and scalability
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, status: 1 });
messageSchema.index({ conversation: 1, isDeleted: 1, createdAt: -1 });

// Compound index for pagination within conversations
messageSchema.index({
  conversation: 1,
  isDeleted: 1,
  createdAt: -1,
});

// Index for unread messages
messageSchema.index({
  conversation: 1,
  "readBy.user": 1,
  status: 1,
});

// Method to mark message as read by user
messageSchema.methods.markAsRead = async function (userId: string | Types.ObjectId) {
  const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
  
  // Check if user has already read this message
  const hasRead = this.readBy.some(
    (readInfo: any) => readInfo.user.toString() === userObjectId.toString()
  );

  if (!hasRead) {
    this.readBy.push({
      user: userObjectId,
      readAt: new Date(),
    });
    this.status = MessageStatus.READ;
    await this.save();
  }
};

// Method to check if message is read by user
messageSchema.methods.isReadBy = function (userId: string | Types.ObjectId) {
  const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
  return this.readBy.some(
    (readInfo: any) => readInfo.user.toString() === userObjectId.toString()
  );
};

// Static method to get unread count for user in conversation
messageSchema.statics.getUnreadCount = async function (
  conversationId: Types.ObjectId,
  userId: Types.ObjectId
) {
  return this.countDocuments({
    conversation: conversationId,
    sender: { $ne: userId },
    "readBy.user": { $ne: userId },
    isDeleted: false,
  });
};

// Static method to mark all messages as read in a conversation
messageSchema.statics.markAllAsRead = async function (
  conversationId: Types.ObjectId,
  userId: Types.ObjectId
) {
  const messages = await this.find({
    conversation: conversationId,
    sender: { $ne: userId },
    "readBy.user": { $ne: userId },
    isDeleted: false,
  });

  const updatePromises = messages.map(async (message: any) => {
    message.readBy.push({
      user: userId,
      readAt: new Date(),
    });
    message.status = MessageStatus.READ;
    return message.save();
  });

  await Promise.all(updatePromises);
  return messages.length;
};

// Pre-save middleware to update conversation's lastMessage
messageSchema.post("save", async function () {
  if (!this.isDeleted) {
    const Conversation = model("Conversation");
    await Conversation.findByIdAndUpdate(this.conversation, {
      lastMessage: this._id,
      lastMessageAt: this.createdAt,
    });
  }
});

const Message = model<IMessage, MessageModel>("Message", messageSchema);

export { IMessage, IMessageDocument, Message };
