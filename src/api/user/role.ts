import { Response, Request } from "express";
import * as yup from "yup";
import { db } from "../../db/db";

const roleSchema = yup.object({
    user_id: yup.string().required(),
    role: yup.string().oneOf(["master", "leader", "student"]),
});

async function controleRole(req: Request, res: Response) {
    try {
        if (req.body.data.role != "master") {
            return res.status(403).send({ success: false });
        }
        const { user_id, role } = roleSchema.validateSync(req.body);
        const row = await db("UPDATE user SET role=? WHERE id=?", [
            role,
            user_id,
        ]);
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ success: false });
    }
}

export { controleRole };
