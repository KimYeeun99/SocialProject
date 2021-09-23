import { Router } from "express";
import tokens from "../common/token";
import { getCafeteria, getMonthCafeteria } from "./mealInfo";
import { getSchedule } from "./schedule";
import { insertTimeTable, getTimeTable, deleteTimeTable } from "./timetable";

import {
    insertTodoList,
    getTodoList,
    delTodoList,
    updateTodoList,
    checkTodoList,
} from "./todo";

const router = Router();

router.get("/cafeteria", getCafeteria);
router.get("/cafeteria/month", getMonthCafeteria);
router.get("/schedule", getSchedule);

router.post("/timetable", tokens.loginCheck, insertTimeTable);
router.get("/timetable", tokens.loginCheck, getTimeTable);
router.delete("/timetable", tokens.loginCheck, deleteTimeTable);

router.post("/todo", tokens.loginCheck, insertTodoList);
router.get("/todo", tokens.loginCheck, getTodoList);
router.put("/todo/:list_id", tokens.loginCheck, updateTodoList);
router.delete("/todo/:list_id", tokens.loginCheck, delTodoList);

router.get("/todo/:list_id", tokens.loginCheck, checkTodoList);

export default router;
