import { Router } from "express";
import {
  register,
  login,
  resendOtp,
  verifyUser,
  uploadKyc,
  getKycStatus,
  requestPasswordReset,
  verifyPasswordResetCode,
  resetPassword
} from "../controllers/auth.controller";
import {
  verifyToken,
  verifyAdminToken,
  verifyPasswordToken,
  verifyTokenAndRole,
} from "../middlewares/token";
import { RoleEnum } from "../enums/role.enum";

const router = Router();

router.post("/register", register);
router.post("/resend-otp", resendOtp);
router.post("/verify", verifyUser);
router.post("/login", login);
router.post("/upload-kyc", verifyToken, uploadKyc);
router.get("/kyc-status", verifyToken, getKycStatus);

// Password reset routes
router.post("/request-password-reset", requestPasswordReset);
router.post("/verify-password-reset-code", verifyPasswordResetCode);
router.post("/reset-password", resetPassword);

export default router;
