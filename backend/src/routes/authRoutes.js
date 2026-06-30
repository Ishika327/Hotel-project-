import { Router } from "express";
import { body } from "express-validator";
import {
  login,
  logout,
  me,
  seedAdmin,
  updateCredentials,
  updateProfile,
} from "../controllers/authController.js";
import ApiError from "../utils/ApiError.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();
const profileUpdateWindowMs = 15 * 60 * 1000;
const profileUpdateLimit = 10;
const profileUpdateBuckets = new Map();

const rateLimitUpdateProfile = (req, _res, next) => {
  const employeeId = req.user?._id?.toString() || req.user?.id?.toString();
  if (!employeeId) {
    return next();
  }

  const now = Date.now();
  const bucket = profileUpdateBuckets.get(employeeId) || [];
  const recentAttempts = bucket.filter(
    (timestamp) => now - timestamp < profileUpdateWindowMs,
  );

  if (recentAttempts.length >= profileUpdateLimit) {
    return next(
      new ApiError(
        429,
        "Too many profile update attempts. Please try again later.",
      ),
    );
  }

  recentAttempts.push(now);
  profileUpdateBuckets.set(employeeId, recentAttempts);
  next();
};

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("A valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login,
);

router.post(
  "/seed-admin",
  [
    body("fullName").notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("A valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validate,
  seedAdmin,
);

router.get("/me", protect, me);
router.post("/logout", protect, logout);
router.put(
  "/update-profile",
  protect,
  rateLimitUpdateProfile,
  [
    body("email")
      .optional({ checkFalsy: true })
      .trim()
      .isEmail()
      .withMessage("A valid email is required"),
    body("newPassword")
      .optional({ checkFalsy: true })
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters"),
    body("confirmPassword").optional({ checkFalsy: true }).isString(),
    body("currentPassword").optional({ checkFalsy: true }).isString(),
  ],
  validate,
  updateProfile,
);
router.put(
  "/update-credentials",
  protect,
  rateLimitUpdateProfile,
  [
    body("newEmail")
      .optional({ checkFalsy: true })
      .trim()
      .isEmail()
      .withMessage("A valid email is required"),
    body("newPassword")
      .optional({ checkFalsy: true })
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters"),
    body("currentPassword").optional({ checkFalsy: true }).isString(),
  ],
  validate,
  updateCredentials,
);

export default router;
