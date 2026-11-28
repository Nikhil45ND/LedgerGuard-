
import express from "express";

import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
} from "../controllers/authController.js";

import {
  authenticate,
  authorizeTenantAdmin,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Public login.
router.post("/login", loginUser);

// Only tenant administrators can register members.
router.post(
  "/register",
  authenticate,
  authorizeTenantAdmin,
  registerUser
);

// Protected routes.
router.post("/logout", authenticate, logoutUser);
router.get("/me", authenticate, getCurrentUser);

export default router;
