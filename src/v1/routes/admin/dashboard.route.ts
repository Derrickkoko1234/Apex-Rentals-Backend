import { Router } from "express";
import { getAdminDashboardStats } from "../../controllers/admin/dashboard.controller";
import { verifyTokenAndAdmin } from "../../middlewares/token";

const router = Router();

// Admin dashboard stats route
router.get("/stats", verifyTokenAndAdmin, getAdminDashboardStats);

export default router;
