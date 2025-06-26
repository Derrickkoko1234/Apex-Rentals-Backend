import { Router } from "express";
import {
  getPropertyEnums,
  myProperties,
  getProperties,
  createProperty,
} from "../controllers/property.controller";
import {
  verifyToken,
  verifyTokenOptional,
  verifyTokenAndRole,
  createUserRateLimit,
} from "../middlewares/token";
import { RoleEnum } from "../enums/role.enum";

const router = Router();

// Endpoint to get property-related enums (e.g., types, subtypes, utilities, categories)
router.get("/enums", getPropertyEnums);

// Endpoint to get properties for the authenticated user (landlord)
router.get("/my-properties", verifyToken, myProperties);

// Public endpoint with optional user context (for personalized results)
router.get(
  "/",
  // createUserRateLimit(1000, 3600000),
  getProperties
);

// Example of rate-limited endpoint for authenticated users
router.get(
  "/search",
  createUserRateLimit(1000, 3600000), // 100 requests per hour per user
  verifyToken,
  getProperties
);

// Admin and Landlord can create properties
router.post(
  "/create",
  verifyTokenAndRole(RoleEnum.ADMIN, RoleEnum.LANDLORD),
  createProperty
);

// Only property owner or admin can update
router.put(
  "/:id",
  verifyTokenAndRole(RoleEnum.ADMIN, RoleEnum.LANDLORD)
  // updateProperty controller would go here
);

// Only admin can delete properties
router.delete(
  "/:id",
  verifyTokenAndRole(RoleEnum.ADMIN)
  // deleteProperty controller would go here
);

export default router;
