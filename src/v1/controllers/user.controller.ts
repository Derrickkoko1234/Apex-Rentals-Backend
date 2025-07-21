import { Response } from "express";
import { ExtendedRequest } from "../middlewares/token";
import { hashPassword, comparePassword } from "../utils/password";
import { User } from "../models/user.model";
import { isValidObjectId } from "mongoose";
import { RoleEnum } from "../enums/role.enum";

export async function getProfile(req: ExtendedRequest, res: Response) {
  try {
    let user = req.user;
    // check if user is undefined
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
        data: null,
      });
    }

    return res.status(200).json({
      status: true,
      message: "Profile retrieved successfully",
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

export async function updateProfile(req: ExtendedRequest, res: Response) {
  try {
    let user = req.user;
    // check if user is undefined
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
        data: null,
      });
    } else {
      // remove some fields from req.body if they exist
      delete req.body.isAdmin;
      delete req.body.isVerified;

      if (req.body.password) {
        // hash password
        req.body.password = await hashPassword(req.body.password);
      }

      // if email is passed, check if it already exists except this user
      if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne(
          { email: req.body.email, _id: { $ne: user._id } },
          { _id: 0, __v: 0 }
        ).exec();
        if (emailExists) {
          return res.status(409).json({
            status: false,
            message: "Email already exists",
            data: null,
          });
        }
      }

      // get user and update
      const updatedUser = await User.findByIdAndUpdate(user._id, req.body, {
        new: true,
      }).exec();

      if (!updatedUser) {
        return res.status(404).json({
          status: false,
          message: "User not found",
          data: null,
        });
      }

      return res.status(200).json({
        status: true,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

export async function changePassword(req: ExtendedRequest, res: Response) {
  try {
    let user = req.user;
    // check if user is undefined
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
        data: null,
      });
    } else {
      // check if old password is correct
      const oldPassword = req.body.oldPassword as string;
      const userWithPassword = await User.findById(user._id).select('+password');
      
      if (!oldPassword || !userWithPassword || !(await comparePassword(oldPassword, userWithPassword.password))) {
        return res.status(400).json({
          status: false,
          message: "Old password is incorrect",
          data: null,
        });
      } else {
        // hash new password
        const hashedPassword = await hashPassword(req.body.newPassword);
        const updatedUser = await User.findByIdAndUpdate(
          user._id,
          {
            password: hashedPassword,
          },
          {
            new: true,
          }
        ).exec();

        if (!updatedUser) {
          return res.status(404).json({
            status: false,
            message: "User not found",
            data: null,
          });
        }

        return res.status(200).json({
          status: true,
          message: "Password changed successfully",
          data: updatedUser,
        });
      }
    }
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

// ADMIN ENDPOINTS

// Get all users with pagination and filtering
export async function getAllUsers(req: ExtendedRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;
    const isVerified = req.query.isVerified as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    if (role && Object.values(RoleEnum).includes(role as RoleEnum)) {
      query.role = role;
    }
    
    if (isVerified !== undefined) {
      query.isVerified = isVerified === 'true';
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments(query);

    return res.status(200).json({
      status: true,
      message: "Users retrieved successfully",
      data: {
        data: users,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        total: totalUsers,
      }
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

// Get user by ID
export async function getUserById(req: ExtendedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid user ID",
        data: null,
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
        data: null,
      });
    }

    return res.status(200).json({
      status: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

// Update user by ID
export async function updateUserById(req: ExtendedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid user ID",
        data: null,
      });
    }

    // Don't allow updating sensitive fields
    delete req.body.password;
    delete req.body._id;
    delete req.body.__v;

    // If email is being updated, check if it already exists
    if (req.body.email) {
      const emailExists = await User.findOne({
        email: req.body.email,
        _id: { $ne: id }
      });

      if (emailExists) {
        return res.status(409).json({
          status: false,
          message: "Email already exists",
          data: null,
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({
        status: false,
        message: "User not found",
        data: null,
      });
    }

    return res.status(200).json({
      status: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

// Delete user by ID (soft delete)
export async function deleteUserById(req: ExtendedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid user ID",
        data: null,
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
        data: null,
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user?._id.toString()) {
      return res.status(400).json({
        status: false,
        message: "You cannot delete your own account",
        data: null,
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      status: true,
      message: "User deleted successfully",
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

// Verify/Unverify user
export async function toggleUserVerification(req: ExtendedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid user ID",
        data: null,
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
        data: null,
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isVerified: !user.isVerified },
      { new: true }
    );

    return res.status(200).json({
      status: true,
      message: `User ${updatedUser?.isVerified ? 'verified' : 'unverified'} successfully`,
      data: updatedUser,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

// Get user statistics
export async function getUserStats(req: ExtendedRequest, res: Response) {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = await User.countDocuments({ isVerified: false });
    const adminUsers = await User.countDocuments({ role: RoleEnum.ADMIN });
    const landlordUsers = await User.countDocuments({ role: RoleEnum.LANDLORD });
    const regularUsers = await User.countDocuments({ role: RoleEnum.USER });

    // Get users registered in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    return res.status(200).json({
      status: true,
      message: "User statistics retrieved successfully",
      data: {
        totalUsers,
        verifiedUsers,
        unverifiedUsers,
        adminUsers,
        landlordUsers,
        regularUsers,
        recentUsers,
        verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(2) : 0
      }
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

