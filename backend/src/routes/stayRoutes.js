import { Router } from "express";
import { body } from "express-validator";
import {
  createStay,
  checkoutStay,
  getActiveStayForCustomer,
  getStayById,
  getStays,
  updateStayPayment,
} from "../controllers/stayController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.use(protect);

router.get("/", getStays);
router.get("/active", getActiveStayForCustomer);
router.get("/:id", getStayById);
router.patch("/:id/payment", updateStayPayment);
router.post(
  "/",
  [
    body("customerId").notEmpty(),
    body("roomId").custom((value, { req }) => {
      if (value || req.body.roomNumber) return true;
      throw new Error("Room selection is required");
    }),
    body("checkInDate").custom((value, { req }) => {
      if (value || req.body.checkIn) return true;
      throw new Error("Check-in date is required");
    }),
    body("checkOutDate").custom((value, { req }) => {
      if (value || req.body.checkOut) return true;
      throw new Error("Check-out date is required");
    }),
    body("guests").optional().isInt({ min: 1 }),
  ],
  validate,
  createStay,
);
router.patch("/:id/checkout", checkoutStay);

export default router;
