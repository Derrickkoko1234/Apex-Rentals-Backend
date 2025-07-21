import { Response } from "express";
import { ExtendedRequest } from "../middlewares/token";
import { Property } from "../models/property.model";
import {
  PropertyTypes,
  PropertySubTypes,
  Utilities,
  Category,
} from "../enums/propertyTypes.enum";
import { WishlistItem } from "../models/wishlist.model";
import { Review } from "../models/review.model";
import { Booking } from "../models/booking.model";

export async function getPropertyEnums(req: ExtendedRequest, res: Response) {
  try {
    const enums = {
      propertyTypes: Object.values(PropertyTypes),
      propertySubTypes: PropertySubTypes,
      utilities: Object.values(Utilities),
      categories: Object.values(Category),
    };

    return res.status(200).json({
      status: true,
      message: "Enums fetched successfully",
      data: enums,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

export async function myProperties(req: ExtendedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access",
        data: null,
      });
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const query = { landlord: user._id, isDeleted: false };

    const properties = await Property.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalProperties = await Property.countDocuments(query);
    const totalPages = Math.ceil(totalProperties / limit);

    return res.status(200).json({
      status: true,
      message: "My properties fetched successfully",
      data: {
        data: properties,
        currentPage: page,
        totalPages,
        total: totalProperties,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

export async function getProperties(req: ExtendedRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const minRent = req.query.minRent as string;
    const maxRent = req.query.maxRent as string;
    const bedrooms = parseInt(req.query.bedrooms as string);
    const bathrooms = parseInt(req.query.bathrooms as string);
    const utilities = req.query.utilities as string;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) || "desc";
    const type = req.query.type as string;
    const subType = req.query.subType as string;
    const categories = req.query.categories as string;
    const minYearBuilt = parseInt(req.query.minYearBuilt as string);
    const maxYearBuilt = parseInt(req.query.maxYearBuilt as string);
    const parking = req.query.parking as string;
    const furnished = req.query.furnished as string;
    const shortTermRental = req.query.shortTermRental as string;
    const leaseTerms = req.query.leaseTerms as string;
    const petFriendly = req.query.petFriendly as string;

    const skip = (page - 1) * limit;
    const query: any = { isApproved: true, isDeleted: false };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (minRent || maxRent) {
      query.rent = {};
      if (minRent) query.rent.$gte = parseFloat(minRent);
      if (maxRent) query.rent.$lte = parseFloat(maxRent);
    }
    if (bedrooms && !isNaN(bedrooms)) query.bedrooms = bedrooms;
    if (bathrooms && !isNaN(bathrooms)) query.bathrooms = bathrooms;

    if (utilities) {
      const utilitiesArray = utilities.split(",").map((u) => u.trim());
      query.utilities = { $in: utilitiesArray };
    }
    if (type) query.type = type;
    if (subType) {
      const subTypeArray = subType.split(",").map((s) => s.trim());
      query.subType = { $in: subTypeArray };
    }
    if (categories) {
      const categoriesArray = categories.split(",").map((c) => c.trim());
      query.categories = { $in: categoriesArray };
    }
    if (minYearBuilt || maxYearBuilt) {
      query.yearBuilt = {};
      if (minYearBuilt) query.yearBuilt.$gte = minYearBuilt;
      if (maxYearBuilt) query.yearBuilt.$lte = maxYearBuilt;
    }
    if (parking) query.parking = parking === "true";
    if (furnished) query.furnished = furnished === "true";
    if (shortTermRental) query.shortTermRental = shortTermRental === "true";
    if (leaseTerms) query.leaseTerms = leaseTerms;
    if (petFriendly) query.petFriendly = petFriendly === "true";

    const sort: any = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [properties, totalCount] = await Promise.all([
      Property.find(query).sort(sort).skip(skip).limit(limit).exec(),
      Property.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(200).json({
      status: true,
      message: "Properties fetched successfully",
      data: {
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? page + 1 : null,
          prevPage: hasPrevPage ? page - 1 : null,
        },
        filters: {
          search,
          minRent,
          maxRent,
          bedrooms,
          bathrooms,
          utilities,
          sortBy,
          sortOrder,
          type,
          subType,
          categories,
          minYearBuilt,
          maxYearBuilt,
          parking,
          furnished,
          shortTermRental,
          leaseTerms,
          petFriendly,
        },
        data: properties,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

export async function getProperty(req: ExtendedRequest, res: Response) {
  try {
    const propertyId = req.params.id;
    if (!propertyId) {
      return res.status(400).json({
        status: false,
        message: "Property ID is required",
        data: null,
      });
    }

    const property = await Property.findOne({
      _id: propertyId,
    }).populate("landlord");

    if (!property) {
      return res.status(404).json({
        status: false,
        message: "Property not found",
        data: null,
      });
    }

    return res.status(200).json({
      status: true,
      message: "Property fetched successfully",
      data: property,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

export async function addToWishlist(req: ExtendedRequest, res: Response) {
  try {
    const userId = req.user?._id;
    const propertyId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access",
        data: null,
      });
    }

    if (!propertyId) {
      return res.status(400).json({
        status: false,
        message: "Property ID is required",
        data: null,
      });
    }

    // Check if the property already exists in the wishlist
    const existingItem = await WishlistItem.findOne({
      user: userId,
      property: propertyId,
    })
      .populate("property")
      .populate("user");

    if (existingItem) {
      return res.status(400).json({
        status: false,
        message: "Property already in wishlist",
        data: null,
      });
    }

    // Create new wishlist item
    const newWishlistItem = new WishlistItem({
      user: userId,
      property: propertyId,
    });

    const savedItem = await newWishlistItem.save();

    return res.status(201).json({
      status: true,
      message: "Property added to wishlist successfully",
      data: savedItem,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

export async function getUserWishlistItems(
  req: ExtendedRequest,
  res: Response
) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access",
        data: null,
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const wishlistItems = await WishlistItem.find({ user: userId })
      .populate({
        path: "property",
        match: { isDeleted: false },
      })
      .populate("user")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out items where the property was deleted
    const validWishlistItems = wishlistItems.filter(
      (item) => item.property !== null
    );

    const totalWishlistItems = await WishlistItem.countDocuments({
      user: userId,
      property: { $exists: true, $ne: null },
    });

    const totalPages = Math.ceil(totalWishlistItems / limit);

    return res.status(200).json({
      status: true,
      message: "Wishlist items fetched successfully",
      data: {
        currentPage: page,
        totalPages,
        total: totalWishlistItems,
        data: validWishlistItems,
        items: validWishlistItems,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

export async function removeFromWishlist(req: ExtendedRequest, res: Response) {
  try {
    const userId = req.user?._id;
    const propertyId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized access",
        data: null,
      });
    }

    if (!propertyId) {
      return res.status(400).json({
        status: false,
        message: "Property ID is required",
        data: null,
      });
    }

    // Find and delete the wishlist item
    const deletedItem = await WishlistItem.findOneAndDelete({
      user: userId,
      property: propertyId,
    });

    if (!deletedItem) {
      return res.status(404).json({
        status: false,
        message: "Wishlist item not found",
        data: null,
      });
    }

    return res.status(200).json({
      status: true,
      message: "Property removed from wishlist successfully",
      data: null,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

export async function createProperty(req: ExtendedRequest, res: Response) {
  try {
    const {
      title,
      type,
      subType,
      address,
      latitude,
      longitude,
      utilities,
      categories,
      yearBuilt,
      parking,
      furnished,
      shortTermRental,
      leaseTerms,
      petFriendly,
      bedrooms,
      bathrooms,
      rent,
      unitSize,
      photos,
      description,
      leadContact,
    } = req.body;

    const landlord = req.user?._id;
    if (!landlord) {
      return res
        .status(401)
        .json({ status: false, message: "Unauthorized", data: null });
    }

    // Validate type
    if (!Object.values(PropertyTypes).includes(type)) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid property type", data: null });
    }

    // Create new property document
    const newProperty = new Property({
      landlord,
      title,
      type,
      subType,
      address,
      latitude,
      longitude,
      utilities,
      categories,
      yearBuilt,
      parking,
      furnished,
      shortTermRental,
      leaseTerms,
      petFriendly,
      bedrooms,
      bathrooms,
      rent,
      unitSize,
      photos,
      description,
      leadContact,
    });

    // Save property to database
    const savedProperty = await newProperty.save();

    return res.status(201).json({
      status: true,
      message: "Property created successfully",
      data: savedProperty,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

export async function approveProperty(req: ExtendedRequest, res: Response) {
  try {
    const propertyId = req.params.id;
    if (!propertyId) {
      return res.status(400).json({
        status: false,
        message: "Property ID is required",
        data: null,
      });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        status: false,
        message: "Property not found",
        data: null,
      });
    }

    property.isApproved = true;
    const updatedProperty = await property.save();

    return res.status(200).json({
      status: true,
      message: "Property approved successfully",
      data: updatedProperty,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

export async function rejectProperty(req: ExtendedRequest, res: Response) {
  try {
    const propertyId = req.params.id;
    if (!propertyId) {
      return res.status(400).json({
        status: false,
        message: "Property ID is required",
        data: null,
      });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        status: false,
        message: "Property not found",
        data: null,
      });
    }

    property.isApproved = false;
    property.isRejected = true; // Mark as rejected
    const updatedProperty = await property.save();

    return res.status(200).json({
      status: true,
      message: "Property rejected successfully",
      data: updatedProperty,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

export async function getAllProperties(req: ExtendedRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const properties = await Property.find({ isDeleted: false })
      .populate("landlord")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalProperties = await Property.countDocuments({ isDeleted: false });
    const totalPages = Math.ceil(totalProperties / limit);

    return res.status(200).json({
      status: true,
      message: "All properties fetched successfully",
      data: {
        data: properties,
        currentPage: page,
        totalPages,
        total: totalProperties,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

export async function createReview(req: ExtendedRequest, res: Response) {
  try {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ status: false, message: "Unauthorized", data: null });
    }
    const userId = user._id;
    const { propertyId, bookingId, rating, comment } = req.body;
    if (!userId || !propertyId || !bookingId || !rating || !comment) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields",
        data: null,
      });
    }
    // Check if booking exists, belongs to user, is for the property, and is completed
    const booking = await Booking.findOne({
      _id: bookingId,
      user: userId,
      property: propertyId,
      status: "completed",
    });
    if (!booking) {
      return res.status(403).json({
        status: false,
        message:
          "You can only review properties you have completed a booking for.",
        data: null,
      });
    }
    // Check if review already exists for this booking
    const existing = await Review.findOne({
      property: propertyId,
      user: userId,
      booking: bookingId,
    });
    if (existing) {
      return res.status(400).json({
        status: false,
        message: "You have already reviewed this booking.",
        data: null,
      });
    }
    const review = new Review({
      property: propertyId,
      user: userId,
      booking: bookingId,
      rating,
      comment,
    });
    await review.save();
    return res.status(201).json({
      status: true,
      message: "Review submitted successfully",
      data: review,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, message: (err as Error).message, data: null });
  }
}

export async function getPropertyReviews(req: ExtendedRequest, res: Response) {
  try {
    const propertyId = req.params.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!propertyId) {
      return res.status(400).json({
        status: false,
        message: "Property ID is required",
        data: null,
      });
    }
    const reviews = await Review.find({ property: propertyId })
      .populate("user", "firstName lastName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const totalReviews = await Review.countDocuments({ property: propertyId });
    const totalPages = Math.ceil(totalReviews / limit);

    return res.status(200).json({
      status: true,
      message: "Reviews fetched successfully",
      data: {
        data: reviews,
        currentPage: page,
        totalPages,
        total: totalReviews,
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, message: (err as Error).message, data: null });
  }
}
