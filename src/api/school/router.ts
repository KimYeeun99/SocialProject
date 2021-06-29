import { Router } from "express";
import { getCafeteria } from "./mealInfo";
import { getSchedule } from "./schedule";

const router = Router();

router.get("/cafeteria", getCafeteria);
router.get("/schedule", getSchedule);

export default router;
