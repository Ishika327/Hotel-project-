import { Router } from "express";
import { body } from "express-validator";
import {
  addExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
} from "../controllers/expenseController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.use(protect);

router.get("/", listExpenses);
router.delete("/:id", deleteExpense);
router.patch("/:id", updateExpense);
router.post(
  "/",
  [
    body("stayId").notEmpty(),
    body("customerId").notEmpty(),
    body("roomId").notEmpty(),
    body("expenseType").notEmpty(),
    body("quantity").isInt({ min: 1 }),
    body("price").isNumeric(),
  ],
  validate,
  addExpense,
);

export default router;
