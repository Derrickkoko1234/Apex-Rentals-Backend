import { Router } from "express";
import dashboardRoutes from "./dashboard.route";

const router = Router();

// Admin routes
router.use("/dashboard", dashboardRoutes);

export default router;
