import { Router } from "express";
import {
  register,
  login,
  resendOtp,
  verifyUser,
  uploadKyc,
  getKycStatus,
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
router.post("/upload-kyc", verifyTokenAndRole(RoleEnum.LANDLORD), uploadKyc);
router.get("/kyc-status", verifyTokenAndRole(RoleEnum.LANDLORD), getKycStatus);

export default router;
