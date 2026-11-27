
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import Tenant from "../models/Tenant.js";

// Generate JWT access token
const generateAccessToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      userId: user._id.toString(),
      tenantId: user.tenantId.toString(),
    },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "1d",
    }
  );
};

// Remove sensitive fields from user response
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  tenantId: user.tenantId,
  role: user.role,
});

// REGISTER USER
// This endpoint must be protected by authenticate middleware.
// A user can only create another user inside their own tenant.
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: "Tenant context is required",
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tenant identifier",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
      tenantId,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists in this tenant",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      tenantId,
      role: "member",
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: formatUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    next(error);
  }
};

// LOGIN USER

export const loginUser = async (req, res, next) => {
  try {
    const { email, password, tenantId } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof tenantId !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email, password and tenantId are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tenant identifier",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify tenant exists and is active.
    const tenant = await Tenant.findOne({
      _id: tenantId,
      status: "active",
    });

    if (!tenant) {
      return res.status(403).json({
        success: false,
        message: "Tenant is inactive, suspended or unavailable",
      });
    }

    // Find user within the requested tenant.
    const user = await User.findOne({
      email: normalizedEmail,
      tenantId: tenant._id,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const accessToken = generateAccessToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};


// LOGOUT USER
// With stateless Bearer JWTs, the client must discard its token.
// Server-side token revocation would require a token blacklist or similar mechanism.
export const logoutUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logout successful. Please discard your access token.",
  });
};

// GET CURRENT LOGGED-IN USER
export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await User.findOne({
      _id: userId,
      tenantId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
};
