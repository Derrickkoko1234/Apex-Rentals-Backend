import { Router } from "express";
import {
  getPropertyEnums,
  myProperties,
  getProperties,
  getProperty,
  addToWishlist,
  getUserWishlistItems,
  removeFromWishlist,
  createProperty,
  approveProperty,
  rejectProperty,getAllProperties, createReview, getPropertyReviews
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

// Endpoint to get a specific property by ID
router.get("/get-property/:id", getProperty);

// Endpoint to add a property to the user's wishlist
router.post("/wishlist/:id", verifyToken, addToWishlist);

// Endpoint to get the user's wishlist items
router.get("/wishlist", verifyToken, getUserWishlistItems);

// Endpoint to remove a property from the user's wishlist
router.delete("/wishlist/:id", verifyToken, removeFromWishlist);

router.post("/create", verifyTokenAndRole(RoleEnum.LANDLORD), createProperty);

// Endpoint to approve a property (admin only)
router.post(
  "/approve/:id",
  verifyTokenAndRole(RoleEnum.ADMIN),
  approveProperty
);

// Endpoint to reject a property (admin only)
router.post("/reject/:id", verifyTokenAndRole(RoleEnum.ADMIN), rejectProperty);

// Endpoint to get all properties (admin only)
router.get(
  "/all-properties",
  verifyTokenAndRole(RoleEnum.ADMIN),
  getAllProperties
);

// Fetch reviews for a property
router.get("/:id/reviews", getPropertyReviews);
// Create a review for a property (user must be authenticated)
router.post("/:id/reviews", verifyToken, createReview);

// // Example of rate-limited endpoint for authenticated users
// router.get(
//   "/search",
//   createUserRateLimit(1000, 3600000), // 100 requests per hour per user
//   verifyToken,
//   getProperties
// );

// // Admin and Landlord can create properties
// router.post(
//   "/create",
//   verifyTokenAndRole(RoleEnum.ADMIN, RoleEnum.LANDLORD),
//   createProperty
// );

// // Only property owner or admin can update
// router.put(
//   "/:id",
//   verifyTokenAndRole(RoleEnum.ADMIN, RoleEnum.LANDLORD)
//   // updateProperty controller would go here
// );

// // Only admin can delete properties
// router.delete(
//   "/:id",
//   verifyTokenAndRole(RoleEnum.ADMIN)
//   // deleteProperty controller would go here
// );

export default router;
