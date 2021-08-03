import { Response, Request } from "express";
import { db } from "../../db/db";
import * as crypto from "crypto";
import * as nodemailer from "nodemailer";
import argon2 from "argon2";

async function forgotPassword(req: Request, res: Response) {}

//password 수정
async function setPassword(req: Request, res: Response) {
    try {
        const newPassword = req.body.password;
        const hashPassword = await argon2.hash(newPassword);

        const update = await db("UPDATE user SET password=? WHERE id=?", [
            hashPassword,
            req.body.data.id,
        ]);

        res.send({ success: true });
    } catch (error) {
        res.status(500).send({ success: false });
    }
}

//입력된 password가 Login된 password가 일치하는지 여부
async function checkPassword(req: Request, res: Response) {
    try {
        const password = req.body.password;
        const rows = await db("SELECT * FROM user WHERE id=?", [
            req.body.data.id,
        ]);
        if (await argon2.verify(rows[0].password, password)) {
            return res.send({ success: true });
        }
        return res.status(400).send({ success: false });
    } catch (error) {
        res.status(500).send({ success: false });
    }
}

export { setPassword, checkPassword };
