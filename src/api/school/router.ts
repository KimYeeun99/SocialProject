import { Router } from "express";
import tokens from "../common/token";
import { getCafeteria } from "./mealInfo";
import { getSchedule } from "./schedule";
import {
    insertTimeTable,
    getTimeTable, 
    updateTimeTable, 
    deleteTimeTable
} from "./timetable";

import {
    insertTodoList,
    getTodoList,
    delTodoList,
    updateTodoList,
    checkTodoList,
} from "./todo";

const router = Router();

router.get("/cafeteria", getCafeteria);
router.get("/schedule", getSchedule);

router.post("/timetable", tokens.loginCheck, insertTimeTable);
router.get("/timetable", tokens.loginCheck, getTimeTable);
router.put("/timetable", tokens.loginCheck, updateTimeTable);
router.delete("/timetable", tokens.loginCheck, deleteTimeTable);

router.post("/todo", tokens.loginCheck, insertTodoList);
router.get("/todo", tokens.loginCheck, getTodoList);
router.put("/todo/:list_id", tokens.loginCheck, updateTodoList);
router.delete("/todo/:list_id", tokens.loginCheck, delTodoList);

router.get("/todo/:list_id", tokens.loginCheck, checkTodoList);

export default router;
