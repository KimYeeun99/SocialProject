import { Router, Response, Request, NextFunction } from "express";
import moment from "moment";
import { pool } from "../../db/db";
import {logger} from "../../log/logger";

function formatDate(date) {
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
}

async function scrapBoard(req: Request, res: Response) {
    try {
        const boardId = req.params.id;
        const userId = req.body.data.id;

        const rows: any = await pool.query(
            "SELECT scrap_id FROM scrap WHERE board_id=? AND user_id=?",
            [boardId, userId]
        );

        const check = JSON.parse(JSON.stringify(rows[0]));

        if (check[0]) {
            await pool.query("DELETE FROM scrap WHERE scrap_id=?", [
                check[0].scrap_id,
            ]);
            res.json({
                success: true,
                stat: "DELETE",
            });
        } else {
            await pool.query(
                "INSERT INTO scrap (board_id, user_id) VALUES (?, ?)",
                [boardId, userId]
            );
            res.json({
                success: true,
                stat: "INSERT",
            });
        }
    } catch (error) {
        logger.error(error);
        res.status(500).send({
            success: false,
        });
    }
}

async function readScrapBoard(req: Request, res: Response) {
    try {
        const userId = req.body.data.id;

        const rows = await pool.query(
            `select board.*, 
      (select count(board_id) from boardgood where board.board_id=boardgood.board_id) as goodCount, 
      (select count(board_id) from reply where board.board_id=reply.board_id) as replyCount, 
      (select count(board_id) from scrap where board.board_id=scrap.board_id) as scrapCount 
      from scrap inner join board on board.board_id=scrap.board_id where scrap.user_id=? order by regdate desc`,
            [userId]
        );

        const data = JSON.parse(JSON.stringify(rows[0]));
        const list = [];

        data.forEach((value) => {
            value.regdate = formatDate(value.regdate);
            list.push(value);
        });

        res.json({
            success: true,
            data: list,
        });
    } catch (error) {
        logger.error(error);
        res.status(500).send({
            success: false,
        });
    }
}

async function scrapCount(req: Request, res: Response) {
    try {
        const boardId = req.params.id;
        const rows: any = await pool.query(
            "select count(scrap_id) as scrapCount from scrap where board_id=?",
            [boardId]
        );

        const check = JSON.parse(JSON.stringify(rows[0]));

        var count = 0;

        if (check[0]) count = check[0].scrapCount;

        res.json({
            success: true,
            scrapCount: count,
        });
    } catch (error) {
        logger.error(error);
        res.status(500).send({
            success: false,
        });
    }
}
export { readScrapBoard, scrapBoard, scrapCount };
// const router = Router();

// // 게시글 스크랩
// router.get("/scrap", tokens.validTokenCheck, readScrapBoard);
// router.get("/scrap/:id", tokens.validTokenCheck, scrapBoard);
// router.get("/scrapcount/:id", scrapCount);

// export default router;
