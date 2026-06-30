import { Router } from "express";
import { body } from "express-validator";
import {
  createRoom,
  deleteRoom,
  getAvailableRooms,
  getRoomAvailability,
  getRoomById,
  getRooms,
  updateRoom,
} from "../controllers/roomController.js";
import { protect, authorizeRoles } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.use(protect);

router.get("/", getRooms);
router.get("/available", getAvailableRooms);
router.get("/availability/summary", getRoomAvailability);
router.get("/:id", getRoomById);
router.post(
  "/",
  authorizeRoles("admin"),
  [
    body("roomNumber").notEmpty(),
    body("roomType").notEmpty(),
    body("pricePerNight").isNumeric(),
  ],
  validate,
  createRoom,
);
router.patch("/:id", authorizeRoles("admin", "receptionist"), updateRoom);
router.delete("/:id", authorizeRoles("admin"), deleteRoom);

export default router;
