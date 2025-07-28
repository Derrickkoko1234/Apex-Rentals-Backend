import { Request, Response } from "express";
import { Property } from "../../models/property.model";
import { Booking } from "../../models/booking.model";
import { Review } from "../../models/review.model";
import { Conversation } from "../../models/conversation.model";

// GET /v1/landlord/dashboard
export async function getLandlordDashboard(req: any, res: Response) {
  try {
    const landlordId = req.user?._id;
    if (!landlordId) {
      return res.status(401).json({ status: false, message: "Unauthorized" });
    }

    // 1. Active Properties
    const activeProperties = await Property.countDocuments({
      landlord: landlordId,
      isApproved: true,
      isDeleted: false,
    });

    // Get property IDs for this landlord
    const propertyIds = await Property.find({ landlord: landlordId, isDeleted: false }).distinct("_id");

    // 2. Total Bookings
    const totalBookings = await Booking.countDocuments({
      property: { $in: propertyIds }
    });

    // 3. Average Rating
    const ratings = await Review.aggregate([
      { $match: { property: { $in: propertyIds } } },
      { $group: { _id: null, avgRating: { $avg: "$rating" } } }
    ]);
    const averageRating = ratings.length > 0 ? Number(ratings[0].avgRating.toFixed(2)) : 0;

    // 4. Unread Messages (sum of unreadCount for landlord)
    const unreadConversations = await Conversation.find({
      participants: landlordId,
      isDeleted: false,
    });
    let unreadMessages = 0;
    unreadConversations.forEach(conv => {
      if (conv.unreadCount && typeof conv.unreadCount.get === "function") {
        unreadMessages += conv.unreadCount.get(landlordId.toString()) || 0;
      }
    });

    // 5. Recent Bookings (latest 5)
    const recentBookings = await Booking.find({
      property: { $in: propertyIds }
    })
      .populate({ path: "user" })
      .populate({ path: "property" })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return res.status(200).json({
      status: true,
      data: {
        activeProperties,
        totalBookings,
        averageRating,
        unreadMessages,
        recentBookings,
      },
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: (err as Error).message });
  }
}
