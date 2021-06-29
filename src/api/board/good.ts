import { Router, Response, Request, NextFunction } from "express";
import tokens from "../common/token";
import { pool } from "../../db/db";
import { db } from "../../db/db";

async function goodBoard(req: Request, res: Response) {
    try {
        const user_id = req.body.data.id;
        const board_id = req.params.id;

        const rows: any = await pool.query(
            "SELECT good_id FROM BoardGood WHERE board_id=? and user_id=?",
            [board_id, user_id]
        );

        const check = JSON.parse(JSON.stringify(rows[0]));

        if (check[0]) {
            await pool.query("DELETE FROM boardgood WHERE good_id=?", [
                check[0].good_id,
            ]);
            res.json({
                success: true,
                stat: "DELETE",
            });
        } else {
            await pool.query(
                "INSERT INTO boardgood (user_id, board_id) VALUES (?, ?)",
                [user_id, board_id]
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

async function goodCount(req: Request, res: Response) {
    try {
        const boardId = req.params.id;
        const rows: any = await pool.query(
            "select count(board_id) as goodCount from boardgood where board_id=? group by board_id",
            [boardId]
        );

        const check = JSON.parse(JSON.stringify(rows[0]));
        var count = 0;

        if (check[0]) count = check[0].goodCount;

        res.json({
            success: true,
            goodCount: count,
        });
    } catch (error) {
        res.status(500).send({
            success: false,
        });
    }
}

export { goodBoard, goodCount };
// const router = Router();

// // 게시글 좋아요
// router.get("/good/:id", tokens.validTokenCheck, goodBoard);
// router.get("/goodcount/:id", goodCount);

// //댓글 좋아요
// router.get("/goodcount/:replyid", goodCount);
// router.get("/good/:replyid", tokens.validTokenCheck, goodReply);

// export default router;
