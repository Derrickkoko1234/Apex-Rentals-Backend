import { Router } from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/user.controller";
import { verifyToken, verifyTokenAndAdmin } from "../middlewares/token";

const router = Router();

router.get("/get-profile", verifyToken, getProfile);
router.put("/update-profile", verifyToken, updateProfile);
router.put("/change-password", verifyToken, changePassword);
export default router;
