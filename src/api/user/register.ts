import { Response, Request } from "express";
import * as yup from "yup";
import { db } from "../../db/db";
import argon2 from "argon2";

export const registerScheme = yup.object({
    id: yup.string().required(),
    password: yup.string().required(),
    name: yup.string().required(),
    birth: yup.date().required(),
    phone: yup.string().required(),
    schoolgrade: yup.number().required(),
    schoolclass: yup.number().required(),
    schoolnumber: yup.number().required(),
    role: yup.string().oneOf(["master", "leader", "student"]),
    year: yup.number().required(),
    email: yup.string().required()
});

async function register(req: Request, res: Response) {
    try {
        const {
            id, 
            password,
            name,
            phone,
            birth,
            schoolgrade,
            schoolclass,
            schoolnumber,
            role,
            year,
            email
        } = registerScheme.validateSync(req.body);
        const search = await db("SELECT id FROM user WHERE id=?", [id]);
        const hashPassword = await argon2.hash(password);
        if (!search[0]) {
            const rows = await db(
                `INSERT INTO user (id, password, name, phone, birth, schoolgrade, schoolclass, schoolnumber, role, year, email) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                [
                    id,
                    hashPassword,
                    name,
                    phone,
                    birth,
                    schoolgrade,
                    schoolclass,
                    schoolnumber,
                    role,
                    year,
                    email
                ]
            );
            res.send({ success: true });
        } else {
            res.status(400).send({ success: false });
        }
    } catch (error) {
        res.status(500).send({ success: false });
    }
}

async function confirmDupName(req: Request, res: Response) {
    try {
        const search = await db("SELECT id FROM user WHERE id=?", [
            req.body.id,
        ]);
        if (!search[0]) {
            res.send({ success: false });
        } else {
            res.send({ success: true });
        }
    } catch (error) {
        res.status(500).send({ success: false });
    }
}

export { register, confirmDupName };

// const router = Router();
// router.post("/register", register);
// router.post("/confirm/name", confirmDupName);

// export default router;
