import { Response } from "express";
import { ExtendedRequest } from "../middlewares/token";
import { Booking, BookingStatus, PaymentStatus } from "../models/booking.model";
import { Property } from "../models/property.model";
import { Payment } from "../models/payment.model";
import PaystackService from "../utils/paystack";
import { isValidObjectId } from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const paystack = new PaystackService(process.env.PAYSTACK_SECRET_KEY as string);

// Helper to calculate number of nights
const calculateNights = (checkIn: Date, checkOut: Date): number => {
  const diff = checkOut.getTime() - checkIn.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export async function createBooking(req: ExtendedRequest, res: Response) {
  const { propertyId, checkInDate, checkOutDate, numberOfGuests } = req.body;
  const user = req.user?._id;

  if (!isValidObjectId(propertyId)) {
    return res
      .status(400)
      .json({ status: false, message: "Invalid property ID" });
  }

  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      return res
        .status(404)
        .json({ status: false, message: "Property not found" });
    }

    // Check for booking conflicts
    const existingBooking = await Booking.findOne({
      property: propertyId,
      bookingStatus: BookingStatus.CONFIRMED,
      $or: [
        {
          checkInDate: { $lt: checkOutDate },
          checkOutDate: { $gt: checkInDate },
        },
      ],
    });

    if (existingBooking) {
      return res.status(409).json({
        status: false,
        message: "Property is not available for the selected dates",
      });
    }

    const nights = calculateNights(
      new Date(checkInDate),
      new Date(checkOutDate)
    );
    if (nights <= 0) {
      return res.status(400).json({
        status: false,
        message: "Check-out date must be after check-in date",
      });
    }
    const totalAmount = nights * property.rent;

    const newBooking = new Booking({
      user,
      property: propertyId,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      totalAmount,
    });

    const paymentInfo = await paystack.initializePayment(
      req.user?.email as string,
      totalAmount,
      `${process.env.CLIENT_URL}/payment/callback` // Your frontend callback URL
    );

    // Save reference to booking for verification
    newBooking.paymentReference = paymentInfo.reference;
    await newBooking.save();

    // populate user and property
    await newBooking.populate("user");
    await newBooking.populate("property");

    return res.status(201).json({
      status: true,
      message: "Booking initiated. Redirect to payment gateway.",
      data: {
        booking: newBooking,
        paymentUrl: paymentInfo.authorization_url,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, message: (err as Error).message });
  }
}

export async function verifyBookingPayment(
  req: ExtendedRequest,
  res: Response
) {
  const { reference } = req.query;

  if (!reference) {
    return res
      .status(400)
      .json({ status: false, message: "Payment reference is required" });
  }

  try {
    const paymentDetails = await paystack.verifyPayment(reference as string);

    const booking = await Booking.findOne({
      paymentReference: reference as string,
    });

    if (!booking) {
      return res.status(404).json({
        status: false,
        message: "Booking not found for this payment reference",
      });
    }

    if (paymentDetails.status !== "success") {
      booking.paymentStatus = PaymentStatus.FAILED;
      await booking.save();
      return res.status(400).json({
        status: false,
        message: "Payment failed",
        data: paymentDetails,
      });
    }

    // Create a new payment record
    const newPayment = new Payment({
      user: booking.user,
      booking: booking._id,
      amount: paymentDetails.amount / 100, // convert from kobo
      reference: paymentDetails.reference,
      status: PaymentStatus.PAID,
      gateway: "paystack",
      channel: paymentDetails.channel,
      paidAt: paymentDetails.paid_at,
    });

    await newPayment.save();

    // Update booking status
    booking.paymentStatus = PaymentStatus.PAID;
    booking.bookingStatus = BookingStatus.CONFIRMED;
    booking.paymentId = newPayment._id; // Update with actual payment ID
    await booking.save();

    // Populate booking with user and property details
    await booking.populate("user");
    await booking.populate("property");
    await booking.populate("paymentId");

    // TODO: Send confirmation email/notification to user and landlord

    return res.status(200).json({
      status: true,
      message: "Payment successful and booking confirmed",
      data: booking,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, message: (err as Error).message });
  }
}

export async function getUserBookings(req: ExtendedRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const bookings = await Booking.find({ user: req.user?._id })
      .populate("property")
      .populate("paymentId")
      .skip(skip)
      .limit(limit);
    return res.status(200).json({
      status: true,
      message: "Bookings retrieved successfully",
      data: {
        data: bookings,
        currentPage: page,
        totalPages: Math.ceil(
          (await Booking.countDocuments({ user: req.user?._id })) / limit
        ),
        total: await Booking.countDocuments({ user: req.user?._id }),
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, message: (err as Error).message });
  }
}

export async function getBookingDetails(req: ExtendedRequest, res: Response) {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res
      .status(400)
      .json({ status: false, message: "Invalid booking ID" });
  }

  try {
    const booking = await Booking.findOne({ _id: id, user: req.user?._id })
      .populate("property")
      .populate("paymentId");
    if (!booking) {
      return res
        .status(404)
        .json({ status: false, message: "Booking not found" });
    }
    return res.status(200).json({
      status: true,
      message: "Booking details retrieved",
      data: booking,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, message: (err as Error).message });
  }
}

// ADMIN ENDPOINTS

// Get all bookings with pagination and filtering
export async function getAllBookings(req: ExtendedRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const bookingStatus = req.query.bookingStatus as string;
    const paymentStatus = req.query.paymentStatus as string;
    const userId = req.query.userId as string;
    const propertyId = req.query.propertyId as string;

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    if (
      bookingStatus &&
      Object.values(BookingStatus).includes(bookingStatus as BookingStatus)
    ) {
      query.bookingStatus = bookingStatus;
    }

    if (
      paymentStatus &&
      Object.values(PaymentStatus).includes(paymentStatus as PaymentStatus)
    ) {
      query.paymentStatus = paymentStatus;
    }

    if (userId && isValidObjectId(userId)) {
      query.user = userId;
    }

    if (propertyId && isValidObjectId(propertyId)) {
      query.property = propertyId;
    }

    const bookings = await Booking.find(query)
      .populate("user", "firstName lastName email phone")
      .populate("property", "title address rent")
      .populate("paymentId")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalBookings = await Booking.countDocuments(query);

    return res.status(200).json({
      status: true,
      message: "Bookings retrieved successfully",
      data: {
        bookings,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalBookings / limit),
          totalBookings,
          hasNext: page < Math.ceil(totalBookings / limit),
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

// Get booking by ID
export async function getBookingByIdAdmin(req: ExtendedRequest, res: Response) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      status: false,
      message: "Invalid booking ID",
    });
  }

  try {
    const booking = await Booking.findById(id)
      .populate("user", "firstName lastName email phone address")
      .populate("property")
      .populate("paymentId");

    if (!booking) {
      return res.status(404).json({
        status: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Booking details retrieved",
      data: booking,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
    });
  }
}

// Update booking status
export async function updateBookingStatus(req: ExtendedRequest, res: Response) {
  const { id } = req.params;
  const { bookingStatus, paymentStatus } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      status: false,
      message: "Invalid booking ID",
    });
  }

  try {
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        status: false,
        message: "Booking not found",
      });
    }

    const updateData: any = {};

    if (bookingStatus && Object.values(BookingStatus).includes(bookingStatus)) {
      updateData.bookingStatus = bookingStatus;
    }

    if (paymentStatus && Object.values(PaymentStatus).includes(paymentStatus)) {
      updateData.paymentStatus = paymentStatus;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: false,
        message: "No valid fields to update",
      });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .populate("user", "firstName lastName email phone")
      .populate("property", "title address rent")
      .populate("paymentId");

    return res.status(200).json({
      status: true,
      message: "Booking status updated successfully",
      data: updatedBooking,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
    });
  }
}

// Cancel booking (admin)
export async function cancelBookingAdmin(req: ExtendedRequest, res: Response) {
  const { id } = req.params;
  const { reason } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      status: false,
      message: "Invalid booking ID",
    });
  }

  try {
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        status: false,
        message: "Booking not found",
      });
    }

    if (booking.bookingStatus === BookingStatus.CANCELLED) {
      return res.status(400).json({
        status: false,
        message: "Booking is already cancelled",
      });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      {
        bookingStatus: BookingStatus.CANCELLED,
        // You might want to add a cancellation reason field to your model
      },
      { new: true }
    )
      .populate("user", "firstName lastName email phone")
      .populate("property", "title address rent")
      .populate("paymentId");

    // TODO: Handle refund logic if payment was made
    // TODO: Send cancellation notification to user

    return res.status(200).json({
      status: true,
      message: "Booking cancelled successfully",
      data: updatedBooking,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
    });
  }
}

// Get booking statistics
export async function getBookingStats(req: ExtendedRequest, res: Response) {
  try {
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({
      bookingStatus: BookingStatus.PENDING,
    });
    const confirmedBookings = await Booking.countDocuments({
      bookingStatus: BookingStatus.CONFIRMED,
    });
    const cancelledBookings = await Booking.countDocuments({
      bookingStatus: BookingStatus.CANCELLED,
    });
    const completedBookings = await Booking.countDocuments({
      bookingStatus: BookingStatus.COMPLETED,
    });

    const paidBookings = await Booking.countDocuments({
      paymentStatus: PaymentStatus.PAID,
    });
    const pendingPayments = await Booking.countDocuments({
      paymentStatus: PaymentStatus.PENDING,
    });
    const failedPayments = await Booking.countDocuments({
      paymentStatus: PaymentStatus.FAILED,
    });

    // Get bookings from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentBookings = await Booking.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get total revenue from confirmed bookings
    const revenueData = await Booking.aggregate([
      { $match: { paymentStatus: PaymentStatus.PAID } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    return res.status(200).json({
      status: true,
      message: "Booking statistics retrieved successfully",
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
        completedBookings,
        paidBookings,
        pendingPayments,
        failedPayments,
        recentBookings,
        totalRevenue,
        conversionRate:
          totalBookings > 0
            ? ((confirmedBookings / totalBookings) * 100).toFixed(2)
            : 0,
        paymentSuccessRate:
          totalBookings > 0
            ? ((paidBookings / totalBookings) * 100).toFixed(2)
            : 0,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
    });
  }
}
