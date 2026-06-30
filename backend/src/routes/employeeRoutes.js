import { Router } from "express";
import { body } from "express-validator";
import {
  createEmployee,
  listEmployees,
  updateEmployee,
} from "../controllers/employeeController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.use(protect);

router.get("/", authorizeRoles("admin"), listEmployees);
router.post(
  "/",
  authorizeRoles("admin"),
  [
    body("fullName").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 8 }),
  ],
  validate,
  createEmployee,
);
router.patch("/:id", authorizeRoles("admin"), updateEmployee);

export default router;
