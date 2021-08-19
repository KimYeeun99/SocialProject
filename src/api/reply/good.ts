import { Response, Request } from "express";
import { db } from "../../db/db";

async function goodCount(req: Request, res: Response) {
    try {
        const replyId = req.params.replyid;
        const rows = await db(
            "select count(reply_id) as count from replygood where reply_id=? group by reply_id",
            [replyId]
        );

        var count = 0;

        if (rows[0]) count = rows[0].count;

        res.json({
            success: true,
            goodcount: count,
        });
    } catch (error) {
        res.status(400).send({
            success: false,
        });
    }
}

async function goodReply(req: Request, res: Response) {
    try {
        const user_id = req.body.data.id;
        const reply_id = req.params.replyid;

        const check = await db(
            "SELECT good_id FROM replygood WHERE reply_id=? and user_id=?",
            [reply_id, user_id]
        );

        if (check[0]) {
            await db("DELETE FROM replygood WHERE good_id=?", [
                check[0].good_id,
            ]);
            res.json({
                success: true,
                stat: "DELETE",
            });
        } else {
            await db(
                "INSERT INTO replygood (user_id, reply_id) VALUES (?, ?)",
                [user_id, reply_id]
            );
            res.json({
                success: true,
                stat: "INSERT",
            });
        }
    } catch (error) {
        res.status(500).send({
            success: false,
        });
    }
}

export { goodReply, goodCount };
