import { Router } from "express";
import tokens from "../common/token";
import { getCafeteria } from "./mealInfo";
import { getSchedule } from "./schedule";
import {
    insertTodoList,
    getTodoList,
    delTodoList,
    updateTodoList,
} from "./todo";

const router = Router();

router.get("/cafeteria", getCafeteria);
router.get("/schedule", getSchedule);

router.post("/todo", tokens.loginCheck, insertTodoList);
router.get("/todo", tokens.loginCheck, getTodoList);
router.put("/todo/:list_id", tokens.loginCheck, updateTodoList);
router.delete("/todo/:list_id", tokens.loginCheck, delTodoList);

export default router;
