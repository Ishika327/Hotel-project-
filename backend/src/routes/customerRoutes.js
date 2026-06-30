import { Router } from "express";
import { body } from "express-validator";
import {
  createOrUpdateCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomerByPhone,
  searchCustomers,
  updateCustomerIdProof,
  updateCustomer,
} from "../controllers/customerController.js";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { normalizePhone } from "../utils/normalizePhone.js";

const router = Router();

const isValidPhoneDigits = (value) => {
  const digits = normalizePhone(value);
  if (!/^9\d{9}$/.test(digits)) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  return true;
};

router.use(protect);

router.get("/search", searchCustomers);
router.get("/phone/:phoneNumber", getCustomerByPhone);
router.get("/:id", getCustomerById);
router.post(
  "/",
  [
    body("fullName").notEmpty(),
    body("phoneNumber")
      .notEmpty()
      .withMessage("Phone number is required")
      .custom((value) => {
        if (!isValidPhoneDigits(value)) {
          throw new Error("Phone number must be 10 digits starting with 9");
        }
        return true;
      }),
  ],
  validate,
  createOrUpdateCustomer,
);
router.patch("/:id", updateCustomer);
router.patch("/:id/id-proof", upload.single("idProof"), updateCustomerIdProof);
router.delete("/:id", deleteCustomer);

export default router;
