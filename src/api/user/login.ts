import { Response, Request } from "express";
import * as yup from "yup";
import { db } from "../../db/db";
import tokens from "../common/token";
import argon2 from "argon2";

export const loginScheme = yup.object({
    id: yup.string().required(),
    password: yup.string().required(),
});

async function login(req: Request, res: Response) {
    try {
        const { id, password } = loginScheme.validateSync(req.body);
        const rows = await db("SELECT * FROM user WHERE id=?", [id]);
        if (!rows[0]) res.status(400).send({ success: false });
        else if (await argon2.verify(rows[0].password, password)) {
            const data = {
                id: rows[0].id,
                schoolgrade: rows[0].schoolgrade,
                schoolclass: rows[0].schoolclass,
                schoolnumber: rows[0].schoolnumber,
                role: rows[0].role,
                year: rows[0].year,
                name: rows[0].name,
            };

            const token = await tokens.createTokens(data);

            res.send({
                success: true,
                token: token,
                role: data.role,
            });
        } else {
            res.send({ success: false });
        }
    } catch (error) {
        res.status(500).send({ success: false });
    }
}

async function logout(req: Request, res: Response) {
    try {
        await tokens.deleteTokens(req, res);
        res.send({ success: true });
    } catch (error) {
        res.status(500).send({ success: false });
    }
}

async function userOut(req: Request, res: Response) {
    try {
        const rows = await db("DELETE FROM user WHERE id=?", [
            req.body.data.id,
        ]);
        res.send({ success: true });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false });
    }
}

export { login, logout, userOut };

// const router = Router();

// router.post("/login", login);
// router.post("/logout", tokens.validTokenCheck, logout);
// router.delete("/quit", tokens.validTokenCheck, userOut);

// export default router;
