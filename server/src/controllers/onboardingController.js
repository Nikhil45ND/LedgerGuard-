
import { onboardOrganization } from "../services/onboardingService.js";

export const registerOrganization = async (req, res, next) => {
  try {
    const {
      organizationName,
      adminName,
      email,
      password,
    } = req.body;

    const result = await onboardOrganization({
      organizationName,
      adminName,
      email,
      password,
    });

    return res.status(201).json({
      success: true,
      message: "Organization and first administrator created successfully",
      data: result,
    });
  } catch (error) {
    // Handle MongoDB duplicate-key errors.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Organization or administrator already exists",
      });
    }

    next(error);
  }
};
