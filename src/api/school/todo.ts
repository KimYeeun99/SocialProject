import { Router, Response, Request } from "express";
import * as yup from "yup";
import { db } from "../../db/db";

export const todoSchema = yup.object({
    body: yup.string().required(),
    year: yup.number().required(),
    month: yup.number().required(),
    day: yup.number().required(),
});

async function insertTodoList(req: Request, res: Response) {
    try {
        const { body, year, month, day } = todoSchema.validateSync(req.body);
        const user_id = req.body.data.id;
        const rows = await db(
            "INSERT INTO todoList(user_id,body,year,month,day) VALUES(?,?,?,?,?)",
            [user_id, body, year, month, day]
        );

        res.send({ success: true });
    } catch (error) {
        res.status(500).send({ error: error.message, success: false });
    }
}

async function getTodoList(req: Request, res: Response) {
    try {
        const user_id = req.body.data.id;
        const year = req.query.year;
        const month = req.query.month;
        const day = req.query.day;

        const rows = await db(
            "SELECT * FROM todolist WHERE user_id=? AND year=? AND month=? AND day=?",
            [user_id, year, month, day]
        );

        res.send({ rows, success: true });
    } catch (error) {
        res.status(500).send({ error: error.message, success: false });
    }
}

export const todoUpdateSchema = yup.object({
    body: yup.string().required(),
});

async function updateTodoList(req: Request, res: Response) {
    try {
        const { body } = todoUpdateSchema.validateSync(req.body);
        const user_id = req.body.data.id;
        const list_id = req.params.list_id;
        const rows = await db(
            "UPDATE todolist SET body=? WHERE user_id=? AND list_id=?",
            [body, user_id, list_id]
        );

        res.send({ success: true });
    } catch (error) {
        res.status(500).send({ error: error.message, success: false });
    }
}

async function delTodoList(req: Request, res: Response) {
    try {
        const user_id = req.body.data.id;
        const list_id = req.params.list_id;
        const search = await db(
            "SELECT * FROM todolist WHERE user_id=? AND list_id=?",
            [user_id, list_id]
        );

        if (!search[0]) return res.status(401).send({ success: false });

        const rows = await db(
            "DELETE FROM todolist WHERE user_id=? AND list_id=?",
            [user_id, list_id]
        );

        res.send({ success: true });
    } catch (error) {
        res.status(500).send({ error: error.message, success: false });
    }
}

export { insertTodoList, getTodoList, updateTodoList, delTodoList };

//user_id, body, check, year, month, day
