import { Router } from "express";
import {
  createBooking,
  verifyBookingPayment,
  getUserBookings,getLandlordBookings,
  getBookingDetails,
  getAllBookings,
  getBookingByIdAdmin,
  updateBookingStatus,
  cancelBookingAdmin,
  getBookingStats,
} from "../controllers/booking.controller";
import { verifyToken, verifyTokenAndAdmin } from "../middlewares/token";

const router = Router();

// User booking routes (protected)
router.post("/create", verifyToken, createBooking);
router.get("/verify-payment", verifyToken, verifyBookingPayment);
router.get("/user/bookings", verifyToken, getUserBookings);
router.get("/landlord/bookings", verifyToken, getLandlordBookings);
router.get("/user/:id", verifyToken, getBookingDetails);

// Admin booking routes (admin only)
router.get("/admin/all", verifyTokenAndAdmin, getAllBookings);
router.get("/admin/stats", verifyTokenAndAdmin, getBookingStats);
router.get("/admin/:id", verifyTokenAndAdmin, getBookingByIdAdmin);
router.put("/admin/:id/status", verifyTokenAndAdmin, updateBookingStatus);
router.put("/admin/:id/cancel", verifyTokenAndAdmin, cancelBookingAdmin);

export default router;
