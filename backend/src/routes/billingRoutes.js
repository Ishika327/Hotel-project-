import { Router } from "express";
import { body } from "express-validator";
import {
  generateInvoice,
  getInvoiceById,
  listInvoices,
  markInvoicePaid,
  sendInvoiceByEmail,
} from "../controllers/billingController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.use(protect);

router.get("/", listInvoices);
router.get("/:id", getInvoiceById);
router.post(
  "/generate",
  [body("stayId").notEmpty()],
  validate,
  generateInvoice,
);
router.patch("/:id/pay", markInvoicePaid);
router.post("/:id/email", sendInvoiceByEmail);

export default router;
