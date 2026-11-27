
import mongoose from "mongoose";

export function extractTenantContext(req, res, next) {
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(403).json({
      success: false,
      message: "Authenticated tenant context required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(tenantId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid tenant identifier",
    });
  }

  req.tenantId = new mongoose.Types.ObjectId(tenantId);

  next();
}
