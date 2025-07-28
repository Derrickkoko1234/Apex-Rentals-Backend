import { Router } from "express";
import dashboardRoutes from "./dashboard.route";

const router = Router();

// Landlord routes
router.use("/dashboard", dashboardRoutes);

export default router;
