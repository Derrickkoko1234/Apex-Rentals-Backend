import { Router } from "express";
import { getLandlordDashboard } from "../../controllers/landlord/dashboard.controller";
import { verifyToken } from "../../middlewares/token";

const router = Router();

// Landlord dashboard route
router.get("/stats", verifyToken, getLandlordDashboard);

export default router;
