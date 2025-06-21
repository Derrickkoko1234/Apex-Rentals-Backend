import { Router } from "express";
import {
  register,
  login,
  resendOtp,
  verifyUser,
} from "../controllers/auth.controller";
import {
  verifyToken,
  verifyAdminToken,
  verifyPasswordToken,
} from "../middlewares/token";

const router = Router();

router.post("/register", register);
router.post("/resend-otp", resendOtp);
router.post("/verify", verifyUser);
router.post("/login", login);

export default router;
