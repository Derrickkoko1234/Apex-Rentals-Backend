import { Request, Response } from "express";
import { User } from "../../models/user.model";
import { Property } from "../../models/property.model";
import {
  Booking,
  BookingStatus,
  PaymentStatus,
} from "../../models/booking.model";
import { Payment } from "../../models/payment.model";
import { Review } from "../../models/review.model";
import { RoleEnum } from "../../enums/role.enum";

export async function getAdminDashboardStats(req: Request, res: Response) {
  try {
    // User stats
    const totalUsers = await User.countDocuments({});
    const totalAdmins = await User.countDocuments({ role: RoleEnum.ADMIN });
    const totalLandlords = await User.countDocuments({
      role: RoleEnum.LANDLORD,
    });

    // Property stats
    const totalProperties = await Property.countDocuments({});
    const approvedProperties = await Property.countDocuments({
      isApproved: true,
      isDeleted: false,
    });
    const pendingProperties = await Property.countDocuments({
      isApproved: false,
      isRejected: false,
      isDeleted: false,
    });
    const rejectedProperties = await Property.countDocuments({
      isRejected: true,
      isDeleted: false,
    });

    // Booking stats
    const totalBookings = await Booking.countDocuments({});
    const completedBookings = await Booking.countDocuments({
      bookingStatus: BookingStatus.COMPLETED,
    });
    const pendingBookings = await Booking.countDocuments({
      bookingStatus: BookingStatus.PENDING,
    });
    const cancelledBookings = await Booking.countDocuments({
      bookingStatus: BookingStatus.CANCELLED,
    });

    // Revenue
    const payments = await Payment.aggregate([
      { $match: { status: PaymentStatus.PAID } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = payments[0]?.total || 0;

    // Reviews
    const totalReviews = await Review.countDocuments({});

    // Recent activity
    const recentUsers = await User.find({}).sort({ createdAt: -1 }).limit(5);
    const recentProperties = await Property.find({})
      .sort({ createdAt: -1 })
      .limit(5);
    const recentBookings = await Booking.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user")
      .populate("property");

    return res.status(200).json({
      status: true,
      message: "Dashboard stats fetched successfully",
      data: {
        users: {
          total: totalUsers,
          admins: totalAdmins,
          landlords: totalLandlords,
          recent: recentUsers,
        },
        properties: {
          total: totalProperties,
          approved: approvedProperties,
          pending: pendingProperties,
          rejected: rejectedProperties,
          recent: recentProperties,
        },
        bookings: {
          total: totalBookings,
          completed: completedBookings,
          pending: pendingBookings,
          cancelled: cancelledBookings,
          recent: recentBookings,
        },
        revenue: totalRevenue,
        reviews: totalReviews,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, message: (err as Error).message, data: null });
  }
}
