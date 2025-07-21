import { Schema, model, Types, Document, Model } from "mongoose";
import { BaseModel } from "../interfaces/general.interface";

export enum ConversationStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
  BLOCKED = "blocked",
}

export enum ConversationType {
  PROPERTY_INQUIRY = "property_inquiry",
  GENERAL = "general",
  SUPPORT = "support",
}

interface IConversation extends BaseModel {
  participants: Types.ObjectId[];
  property?: Types.ObjectId;
  title: string;
  type: ConversationType;
  status: ConversationStatus;
  lastMessage?: Types.ObjectId;
  lastMessageAt?: Date;
  unreadCount: Map<string, number>; // userId -> unreadCount
  isDeleted: boolean;
  deletedBy: Types.ObjectId[];
  metadata?: {
    propertyTitle?: string;
    propertyAddress?: string;
    inquiryType?: string;
  };
}

interface IConversationMethods {
  isParticipant(userId: Types.ObjectId): boolean;
  getOtherParticipant(userId: Types.ObjectId): Types.ObjectId | undefined;
}

interface ConversationModel
  extends Model<IConversation, {}, IConversationMethods> {
  findOrCreateConversation(
    participants: Types.ObjectId[],
    property?: Types.ObjectId,
    type?: ConversationType
  ): Promise<IConversationDocument>;
}

type IConversationDocument = Document<unknown, {}, IConversation> &
  IConversation &
  IConversationMethods;

const conversationSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    property: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: false,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(ConversationType),
      default: ConversationType.GENERAL,
    },
    status: {
      type: String,
      enum: Object.values(ConversationStatus),
      default: ConversationStatus.ACTIVE,
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    metadata: {
      propertyTitle: String,
      propertyAddress: String,
      inquiryType: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for performance
conversationSchema.index({ participants: 1, status: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ property: 1 });
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

// Compound index for user's conversations with pagination
conversationSchema.index({
  participants: 1,
  isDeleted: 1,
  lastMessageAt: -1,
});

// Method to check if user is participant
conversationSchema.methods.isParticipant = function (userId: Types.ObjectId) {
  return this.participants.some(
    (participant: Types.ObjectId) =>
      participant._id.toString() === userId.toString()
  );
};

// Method to get other participant
conversationSchema.methods.getOtherParticipant = function (
  userId: Types.ObjectId
) {
  return this.participants.find(
    (participant: Types.ObjectId) =>
      participant.toString() !== userId.toString()
  );
};

// Static method to find or create conversation
conversationSchema.statics.findOrCreateConversation = async function (
  participants: Types.ObjectId[],
  property?: Types.ObjectId,
  type: ConversationType = ConversationType.GENERAL
) {
  // Sort participants to ensure consistent conversation creation
  const sortedParticipants = participants.sort((a, b) =>
    a.toString().localeCompare(b.toString())
  );

  let query: any = {
    participants: {
      $all: sortedParticipants,
      $size: sortedParticipants.length,
    },
  };

  if (property) {
    query.property = property;
  }

  let conversation = await this.findOne(query)
    .populate("participants", "firstName lastName email avatar role")
    .populate("property", "title address photos")
    .populate("lastMessage");

  if (!conversation) {
    // Create new conversation
    const title = property ? "Property Inquiry" : "General Chat";
    conversation = await this.create({
      participants: sortedParticipants,
      property,
      title,
      type,
      unreadCount: new Map(),
    });

    // Populate the created conversation
    conversation = await this.findById(conversation._id)
      .populate("participants", "firstName lastName email avatar role")
      .populate("property", "title address photos")
      .populate("lastMessage");
  }

  return conversation;
};

const Conversation = model<IConversation, ConversationModel>(
  "Conversation",
  conversationSchema
);

export { IConversation, IConversationDocument, Conversation };
