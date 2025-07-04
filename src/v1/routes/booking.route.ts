import { Router } from "express";
import {
  createBooking,
  verifyBookingPayment,
  getUserBookings,
  getBookingDetails,
} from "../controllers/booking.controller";
import { verifyToken } from "../middlewares/token";

const router = Router();

// All booking routes are protected and require a valid token
router.use(verifyToken);

/**
 * @route POST /bookings/create
 * @description Create a new booking and initiate payment
 * @access Private
 */
router.post("/create", createBooking);

/**
 * @route GET /bookings/verify-payment
 * @description Verify a Paystack payment and confirm booking
 * @access Private
 */
router.get("/verify-payment", verifyBookingPayment);

/**
 * @route GET /bookings
 * @description Get all bookings for the authenticated user
 * @access Private
 */
router.get("/", getUserBookings);

/**
 * @route GET /bookings/:id
 * @description Get details for a specific booking
 * @access Private
 */
router.get("/:id", getBookingDetails);

export default router;
