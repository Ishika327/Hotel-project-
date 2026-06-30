import { Router } from "express";
import { protect } from "../middleware/auth.js";
import {
  dailyRevenue,
  occupancyReport,
} from "../controllers/reportController.js";

const router = Router();

router.use(protect);
router.get("/daily-revenue", dailyRevenue);
router.get("/occupancy", occupancyReport);

export default router;
