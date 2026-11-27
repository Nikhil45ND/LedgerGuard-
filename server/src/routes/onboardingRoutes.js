
import express from "express";
import { registerOrganization } from "../controllers/onboardingController.js";
import { registrationRateLimiter } from "../middleware/registrationRateLimiter.js";

const router = express.Router();

// Public endpoint: create an organization and its first admin.
// Redis-backed protection: maximum 5 attempts per IP per 15 minutes.
router.post(
  "/register",
  registrationRateLimiter,
  registerOrganization
);

export default router;
