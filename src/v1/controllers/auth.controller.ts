import { Request, Response } from "express";
import NodeCache from "node-cache";
import axios from "axios";
import { ExtendedRequest, signToken } from "../middlewares/token";
import { comparePassword, hashPassword } from "../utils/password";
import { createOtp } from "../utils/code";
import { sendMail } from "../utils/mail";
import { registerValidator } from "../validators/auth/auth.validator";
import { User } from "../models/user.model";
import { RoleEnum } from "../enums/role.enum";

// create a new cache
const cache = new NodeCache();

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { error } = registerValidator.validate(req.body);
    if (error) {
      res.status(400).json({
        status: false,
        message: error.details[0].message,
        data: null,
      });
      return;
    }
    const { firstName, lastName, email, phone, password, role } = req.body;
    // check if email exists
    let user = await User.findOne(
      { $or: [{ email }] },
      { _id: 0, __v: 0 }
    ).exec();
    if (user) {
      res.status(409).json({
        status: false,
        message: "Email already exists!",
        data: null,
      });
    } else {
      user = new User({
        firstName,
        lastName,
        email,
        phone,
        password: await hashPassword(password),
        role,
      });
      await user.save();
      // send otp to email
      const code = createOtp();
      // cache code for 10 mins
      cache.set(email, code.toString(), 600);
      sendMail(email, {
        subject: "Welcome to our platform",
        message: `Your OTP is ${code}`,
      });
      res.status(201).json({
        status: true,
        message:
          "User registered successfully! An OTP has been sent to your email.",
        data: user,
      });
    }
  } catch (err) {
    res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

export async function resendOtp(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        status: false,
        message: "User not found!",
        data: null,
      });
    }
    const code = createOtp();
    // cache code for 10 mins
    cache.set(email, code.toString(), 600);
    sendMail(email, {
      subject: "Welcome to our platform",
      message: `Your OTP is ${code}`,
    });
    res.status(200).json({
      status: true,
      message: "OTP has been resent to your email!",
      data: null,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

export async function verifyUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({
      email,
    });
    if (!user) {
      res.status(404).json({
        status: false,
        message: "User not found!",
        data: null,
      });
    }
    const code = cache.get(email);
    // console.log(code);
    // console.log(otp);
    if (typeof code === "string" && code === otp) {
      // update user and create token
      const user = await User.findOne({ email }).exec();
      if (!user) {
        res.status(404).json({
          status: false,
          message: "User not found!",
          data: null,
        });
      } else {
        user.isVerified = true;
        await user.save();
        const token = signToken(user, { for_password: false });
        res.status(200).json({
          status: true,
          message: "User verified successfully!",
          data: { token, user },
        });
      }
    } else {
      res.status(403).json({
        status: false,
        message: "Invalid OTP!",
        data: null,
      });
    }
  } catch (err) {
    res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({
      email,
    });
    if (!user) {
      res.status(404).json({
        status: false,
        message: "User not found!",
        data: null,
      });
    } else {
      const isPasswordValid = user.password
        ? await comparePassword(password, user.password)
        : false;
      if (!isPasswordValid) {
        res.status(403).json({
          status: false,
          message: "Invalid password!",
          data: null,
        });
      } else {
        const token = signToken(user, { for_password: false });

        res.status(200).json({
          status: true,
          message: "Login successful!",
          data: { token, user },
        });
      }
    }
  } catch (err) {
    res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

export async function uploadKyc(
  req: ExtendedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        status: false,
        message: "Unauthorized",
        data: null,
      });
      return;
    }

    // Only landlords can upload KYC
    if (user.role !== RoleEnum.LANDLORD) {
      res.status(403).json({
        status: false,
        message: "Only landlords can upload KYC documents",
        data: null,
      });
      return;
    }

    const { documentType, documentNumber, documentUrl } = req.body;

    // Validate required fields
    if (!documentType || !documentNumber || !documentUrl) {
      res.status(400).json({
        status: false,
        message:
          "All KYC fields are required: documentType, documentNumber, documentUrl",
        data: null,
      });
      return;
    }

    // Find and update user's KYC information
    const updatedUser = await User.findById(user._id);
    if (!updatedUser) {
      res.status(404).json({
        status: false,
        message: "User not found",
        data: null,
      });
      return;
    }

    updatedUser.kyc = {
      documentType,
      documentNumber,
      documentUrl,
      status: "pending",
    };
    updatedUser.isKycCompleted = true;

    await updatedUser.save();

    const token = signToken(updatedUser, { for_password: false });

    res.status(200).json({
      status: true,
      message: "KYC documents uploaded successfully and are pending approval",
      data: updatedUser,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}

export async function getKycStatus(
  req: ExtendedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        status: false,
        message: "Unauthorized",
        data: null,
      });
      return;
    }

    // Only landlords can check KYC status
    if (user.role !== RoleEnum.LANDLORD) {
      res.status(403).json({
        status: false,
        message: "Only landlords can check KYC status",
        data: null,
      });
      return;
    }

    res.status(200).json({
      status: true,
      message: "KYC status retrieved successfully",
      data: {
        kyc: user.kyc || null,
        isKycCompleted: user.isKycCompleted || false,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: (err as Error).message,
      data: null,
    });
  }
}
