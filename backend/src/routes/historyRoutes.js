import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { searchHistory } from "../controllers/historyController.js";

const router = Router();

router.use(protect);
router.get("/search", searchHistory);

export default router;
