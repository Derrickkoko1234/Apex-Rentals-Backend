import { Router } from "express";
import { getProperties } from "../controllers/property.controller";
import { 
  verifyToken, 
  verifyTokenOptional, 
  verifyTokenAndRole,
  createUserRateLimit 
} from "../middlewares/token";
import { RoleEnum } from "../enums/role.enum";

const router = Router();

// Public endpoint with optional user context (for personalized results)
router.get("/", verifyTokenOptional, getProperties);

// Example of rate-limited endpoint for authenticated users
router.get("/search", 
  createUserRateLimit(1000, 3600000), // 100 requests per hour per user
  verifyToken, 
  getProperties
);

// Admin and Landlord can create properties
router.post("/create", 
  verifyTokenAndRole(RoleEnum.ADMIN, RoleEnum.LANDLORD),
  // createProperty controller would go here
);

// Only property owner or admin can update
router.put("/:id", 
  verifyTokenAndRole(RoleEnum.ADMIN, RoleEnum.LANDLORD),
  // updateProperty controller would go here
);

// Only admin can delete properties
router.delete("/:id", 
  verifyTokenAndRole(RoleEnum.ADMIN),
  // deleteProperty controller would go here
);

export default router;
