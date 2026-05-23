// middleware/roleMiddleware.js

/* ==================================
   ALLOW SPECIFIC ROLES ONLY
   Example:
   authorize("admin")
   authorize("admin", "collector")
================================== */

const authorize =
  (...roles) =>
  (req, res, next) => {
    try {
      // User must exist from authMiddleware
      if (!req.user) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Unauthorized access"
          });
      }

      const userRole =
        req.user.role;

      // Role missing in DB
      if (!userRole) {
        return res
          .status(403)
          .json({
            success: false,
            message:
              "User role not assigned"
          });
      }

      // Role allowed?
      if (
        !roles.includes(
          userRole
        )
      ) {
        return res
          .status(403)
          .json({
            success: false,
            message: `Access denied for role: ${userRole}`
          });
      }

      next();
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message:
            "Role authorization failed",
          error:
            error.message
        });
    }
  };

module.exports = {
  authorize
};