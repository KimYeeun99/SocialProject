import { Router } from "express";
import tokens from "../common/token";
import { getCafeteria } from "./mealInfo";
import { getSchedule } from "./schedule";
import {insertTimeTable, getTimeTable, updateTimeTable, deleteTimeTable} from "./timetable";

const router = Router();

router.get("/cafeteria", getCafeteria);
router.get("/schedule", getSchedule);

router.post("/timetable", tokens.loginCheck, insertTimeTable);
router.get("/timetable", tokens.loginCheck, getTimeTable);
router.put("/timetable", tokens.loginCheck, updateTimeTable);
router.delete("/timetable", tokens.loginCheck, deleteTimeTable);

export default router;
