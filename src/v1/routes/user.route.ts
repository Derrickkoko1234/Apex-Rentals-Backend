import { Router } from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  toggleUserVerification,
  getUserStats,
} from "../controllers/user.controller";
import { verifyToken, verifyTokenAndAdmin } from "../middlewares/token";

const router = Router();

// User routes (protected)
router.get("/get-profile", verifyToken, getProfile);
router.put("/update-profile", verifyToken, updateProfile);
router.put("/change-password", verifyToken, changePassword);

// Admin routes (admin only)
router.get("/admin/all", verifyTokenAndAdmin, getAllUsers);
router.get("/admin/stats", verifyTokenAndAdmin, getUserStats);
router.get("/admin/:id", verifyTokenAndAdmin, getUserById);
router.put("/admin/:id", verifyTokenAndAdmin, updateUserById);
router.delete("/admin/:id", verifyTokenAndAdmin, deleteUserById);
router.put(
  "/admin/:id/toggle-verification",
  verifyTokenAndAdmin,
  toggleUserVerification
);

export default router;
