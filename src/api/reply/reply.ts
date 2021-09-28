import { Router, Response, Request, NextFunction } from "express";
import * as yup from "yup";
import { pool } from "../../db/db";
import moment from "moment";
import { sendMessage } from "../common/message";

export const replyScheme = yup.object({
    body: yup.string().required(),
});

function formatDate(date) {
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
}

async function insertReply(req: Request, res: Response) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { body } = replyScheme.validateSync(req.body);

        const board_id = req.params.boardid;
        const user_id = req.body.data.id;

        const rows = await conn.query(
            "INSERT INTO reply (body, user_id, board_id, parent_id, level) VALUES (?, ?, ?, ?, ?)",
            [body, user_id, board_id, 0, 0]
        );

        const check = JSON.parse(JSON.stringify(rows[0]));

        await conn.query("UPDATE reply SET parent_id=? WHERE reply_id=?", [
            check.insertId,
            check.insertId,
        ]);

        const rows2 = await conn.query(`SELECT reply.*, (select count(reply_id) from replygood WHERE replygood.reply_id=reply.reply_id) as goodCount,
        if((select count(reply_id) from replygood WHERE user_id=? AND replygood.reply_id=reply.reply_id) > 0 , 'Y', 'N') as goodCheck
         FROM reply where board_id=? and reply_id=?`, [user_id, board_id, check.insertId]);

        const data = JSON.parse(JSON.stringify(rows2[0]));
        
        data[0].regdate = formatDate(data[0].regdate);
        data[0]["userCheck"] = "Y";

        const rows3 = await conn.query("SELECT user_id FROM board WHERE board_id=?", [board_id]);

        const messageData = JSON.parse(JSON.stringify(rows3[0]));

        await sendMessage(messageData[0].user_id, {
            title: "게시글에 새로운 댓글이 달렸습니다.",
            body : body,
            board_id : board_id
        });

        await conn.commit();
        res.json({
            success: true,
            data: data[0],
        });

    } catch (error) {
        await conn.rollback();
        console.log(error);
        res.status(500).send({
            success: false,
        });
    } finally{
        conn.release();
    }
}

async function insertSubReply(req: Request, res: Response) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const parent_id = req.params.replyid;
        const board_id = req.params.boardid;
        const user_id = req.body.data.id;
        const { body } = replyScheme.validateSync(req.body);

        const row = await conn.query(`SELECT reply_id FROM reply WHERE reply_id=?`, [parent_id]);
        const valid = JSON.parse(JSON.stringify(row[0]));

        if(!valid[0]){
            conn.release();
            return res.status(400).send({success: false});
        }

        const rows = await conn.query(
            "INSERT INTO reply (body, user_id, board_id, parent_id, level) VALUES (?, ?, ?, ?, ?)",
            [body, user_id, board_id, parent_id, 1]
        );

        const check = JSON.parse(JSON.stringify(rows[0]));

        const rows2 = await conn.query(`SELECT reply.*, (select count(reply_id) from replygood WHERE replygood.reply_id=reply.reply_id) as goodCount,
        if((select count(reply_id) from replygood WHERE user_id=? AND replygood.reply_id=reply.reply_id) > 0 , 'Y', 'N') as goodCheck
         FROM reply where board_id=? and reply_id=?`, [user_id, board_id, check.insertId]);

        const data = JSON.parse(JSON.stringify(rows2[0]));
        
        data[0].regdate = formatDate(data[0].regdate);
        data[0]["userCheck"] = "Y";

        const rows3 = await conn.query("SELECT user_id FROM reply WHERE reply_id=?", [parent_id]);
        const messageData = JSON.parse(JSON.stringify(rows3[0]));
        await sendMessage(messageData[0].user_id, {
            title : "댓글에 새로운 댓글이 달렸습니다.",
            body : body,
            board_id : board_id
        });

        await conn.commit();
        res.json({
            success: true,
            data: data[0]
        });
    } catch (error) {
        await conn.rollback();
        res.status(500).send({
            success: false,
        });
    } finally{
        conn.release();
    }
}

async function readAllReply(req: Request, res: Response) {
    try {
        const userId = req.body.data.id;
        const boardId = req.params.boardid;
        const rows = await pool.query(
            `SELECT reply.*, (select count(reply_id) from replygood WHERE replygood.reply_id=reply.reply_id) as goodCount,
            if((select count(reply_id) from replygood WHERE user_id=? AND replygood.reply_id=reply.reply_id) > 0 , 'Y', 'N') as goodCheck
             FROM reply where board_id=? order by parent_id, level, regdate`,
            [userId, boardId]
        );

        var list = JSON.parse(JSON.stringify(rows[0]));
        const data = [];

        list.forEach((value) => {
            value.regdate = formatDate(value.regdate);
            value["userCheck"] = "N";
            if(userId == value.user_id){
                value["userCheck"] = "Y";
            }

            data.push(value);
        });

        var tree = [];
        var cnt = -1;
        for (var d = 0; d < data.length; d++) {
            if (data[d].level === 0) {
                tree.push({
                    parent: data[d],
                    child: [],
                });
                cnt++;
            } else {
                if (cnt !== -1) tree[cnt].child.push(data[d]);
            }
        }
        res.json({
            success: true,
            data: tree,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
        });
    }
}

async function updateReply(req: Request, res: Response) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const user_id = req.body.data.id;
        const reply_id = req.params.replyid;
        const { body } = replyScheme.validateSync(req.body);

        const row = await conn.query(
            "SELECT reply_id FROM reply WHERE reply_id=? and user_id=?",
            [reply_id, user_id]
        );

        const check = JSON.parse(JSON.stringify(row[0]));

        if (!check[0]){
            conn.release();
            return res.status(401).send({ success: false });
        }

        await conn.query("UPDATE reply SET body=? WHERE reply_id = ?", [
            body,
            reply_id,
        ]);

        await conn.commit();
        res.json({
            success: true,
        });
    } catch (error) {
        await conn.rollback();
        res.status(500).send({
            success: false,
        });
    } finally{
        conn.release();
    }
}

async function deleteReply(req: Request, res: Response) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const role = req.body.data.role;
        const user_id = req.body.data.id;
        const reply_id = req.params.replyid;
        const rows = await conn.query(
            "SELECT reply_id FROM reply WHERE reply_id=? and user_id=?",
            [reply_id, user_id]
        );

        const check = JSON.parse(JSON.stringify(rows[0]));

        if ((role != 'master') && !check[0]) return res.status(401).send({ success: false });

        await conn.query(
            "DELETE FROM reply WHERE reply_id=? OR parent_id=?",
            [reply_id, reply_id]
        );

        await conn.commit();
        res.json({
            success: true,
        });
    } catch (error) {
        await conn.rollback();
        res.status(500).send({
            success: false,
        });
    } finally{
        conn.release();
    }
}

async function replyCount(req: Request, res: Response) {
    try {
        const boardId = req.params.boardid;
        const row = await pool.query(
            "select count(reply_id) as replycount from reply where board_id=?",
            [boardId]
        );

        const rows = JSON.parse(JSON.stringify(row[0]));

        var count = 0;

        if (rows[0]) count = rows[0].replycount;

        res.json({
            success: true,
            replycount: count,
        });
    } catch (error) {
        res.status(500).send({
            success: false,
        });
    }
}

export {
    deleteReply,
    insertReply,
    insertSubReply,
    readAllReply,
    replyCount,
    updateReply,
};

// const router = Router();

// //댓글 갯수
// router.get("/replycount/:boardid", replyCount);

// // 댓글 CRUD
// router.post("/:boardid", tokens.validTokenCheck, insertReply);
// router.post("/:boardid/:replyid", tokens.validTokenCheck, insertSubReply);
// router.get("/:boardid", readAllReply);
// router.put("/:boardid/:replyid", tokens.validTokenCheck, updateReply);
// router.delete("/:boardid/:replyid", tokens.validTokenCheck, deleteReply);

// export default router;
