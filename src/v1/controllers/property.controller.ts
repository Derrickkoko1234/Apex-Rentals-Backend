import { Response } from "express";
import { ExtendedRequest } from "../middlewares/token";
import { Property } from "../models/property.model";
import {
  PropertyTypes,
  PropertySubTypes,
  Utilities,
  Category,
} from "../enums/propertyTypes.enum";

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
    // Extract query parameters with defaults
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const location = req.query.location as string;
    const minPrice = req.query.minPrice as string;
    const maxPrice = req.query.maxPrice as string;
    const beds = parseInt(req.query.beds as string);
    const bathrooms = parseInt(req.query.bathrooms as string);
    const minRating = parseFloat(req.query.minRating as string);
    const maxRating = parseFloat(req.query.maxRating as string);
    const amenities = req.query.amenities as string;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) || "desc";
    const type = req.query.type as string;
    const subType = req.query.subType as string;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Build query object
    const query: any = {};

    // Search functionality (search in title, location, description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) {
        // Extract numeric value from price string (assuming format like "$100/night")
        query.price.$gte = minPrice;
      }
      if (maxPrice) {
        query.price.$lte = maxPrice;
      }
    }

    // Beds filter
    if (beds && !isNaN(beds)) {
      query.beds = beds;
    }

    // Bathrooms filter
    if (bathrooms && !isNaN(bathrooms)) {
      query.bathrooms = bathrooms;
    }

    // Rating filter
    if (minRating || maxRating) {
      query.rating = {};
      if (minRating) {
        query.rating.$gte = minRating;
      }
      if (maxRating) {
        query.rating.$lte = maxRating;
      }
    }

    // Amenities filter
    if (amenities) {
      const amenitiesArray = amenities.split(",").map((a) => a.trim());
      query.amenities = { $in: amenitiesArray };
    }

    if (type) {
      query.type = type;
    }

    if (subType) {
      const subTypeArray = subType.split(",").map((a) => a.trim());
      query.subType = { $in: subTypeArray };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination
    const [properties, totalCount] = await Promise.all([
      Property.find(query).sort(sort).skip(skip).limit(limit).exec(),
      Property.countDocuments(query),
    ]);

    // Calculate pagination metadata
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
          location,
          minPrice,
          maxPrice,
          beds,
          bathrooms,
          minRating,
          maxRating,
          amenities,
          sortBy,
          sortOrder,
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

    return res
      .status(201)
      .json({
        status: true,
        message: "Property created successfully",
        data: savedProperty,
      });
  } catch (err) {
    return res
      .status(500)
      .json({
        status: false,
        message: (err as Error).message,
        data: null,
      });
  }
}
