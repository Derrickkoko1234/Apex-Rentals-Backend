import { Response } from "express";
import { ExtendedRequest } from "../middlewares/token";
import { Property } from "../models/property.model";

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
    const amenities = req.query.amenities as string;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) || "desc";

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
    if (minRating && !isNaN(minRating)) {
      query.rating = { $gte: minRating };
    }

    // Amenities filter
    if (amenities) {
      const amenitiesArray = amenities.split(",").map((a) => a.trim());
      query.amenities = { $in: amenitiesArray };
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
