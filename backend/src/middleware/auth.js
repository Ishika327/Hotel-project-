import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import Employee from "../models/Employee.js";

export const protect = async (req, _res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, "Not authorized. Token missing."));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employee = await Employee.findById(decoded.employeeId).select(
      "-password",
    );

    if (!employee || !employee.isActive) {
      return next(
        new ApiError(401, "Employee account is inactive or not found."),
      );
    }

    req.user = employee;
    next();
  } catch (error) {
    next(new ApiError(401, "Not authorized. Token invalid or expired."));
  }
};

export const authorizeRoles =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          "You do not have permission to access this resource.",
        ),
      );
    }

    next();
  };
