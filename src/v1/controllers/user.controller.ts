import { Response } from "express";
import { ExtendedRequest } from "../middlewares/token";
import { hashPassword, comparePassword } from "../utils/password";
import { User } from "../models/user.model";

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
      if (!oldPassword || !(await comparePassword(oldPassword, oldPassword))) {
        return res.status(400).json({
          status: false,
          message: "Old password is incorrect",
          data: null,
        });
      } else {
        // hash new password
        user.password = await hashPassword(req.body.newPassword);
        const updatedUser = await User.findByIdAndUpdate(
          user._id,
          {
            password: user.password,
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
