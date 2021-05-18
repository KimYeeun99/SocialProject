import { Router, Response, Request, NextFunction } from "express";
import * as yup from "yup";
import { db } from "../db/db";
import moment from "moment";
import tokens from "./token";

export const replyScheme = yup.object({
  body: yup.string().required(),
});

function formatDate(date) {
  return moment(date).format("YYYY-MM-DD HH:mm:ss");
}

async function insertReply(req: Request, res: Response) {
  try {
    const { body } = replyScheme.validateSync(req.body);

    const board_id = req.params.boardid;
    const user_id = req.body.userId;

    const rows = await db(
      "INSERT INTO reply (body, user_id, board_id, parent_id, level) VALUES (?, ?, ?, ?, ?)",
      [body, user_id, board_id, 0, 0]
    );

    const data = JSON.parse(JSON.stringify(rows));

    await db("UPDATE reply SET parent_id=? WHERE reply_id=?", [
      data.insertId,
      data.insertId,
    ]);
    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
    });
  }
}

async function insertSubReply(req: Request, res: Response) {
  try {
    const parent_id = req.params.replyid;
    const board_id = req.params.boardid;
    const user_id = req.body.userId;
    const { body } = replyScheme.validateSync(req.body);

    const rows = await db(
      "INSERT INTO reply (body, user_id, board_id, parent_id, level) VALUES (?, ?, ?, ?, ?)",
      [body, user_id, board_id, parent_id, 1]
    );

    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
    });
  }
}

async function readAllReply(req: Request, res: Response) {
  try {
    const boardId = req.params.boardid;
    const rows = await db(
      `SELECT *, (select count(reply_id) from replygood WHERE replygood.reply_id=reply.reply_id) as goodCount FROM reply where board_id=? order by parent_id, level, regdate`,
      [boardId]
    );

    var list = JSON.parse(JSON.stringify(rows));
    const data = [];

    list.forEach((value) => {
      value.regdate = formatDate(value.regdate);
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
    res.status(500).send({
      success: false,
    });
  }
}

async function updateReply(req: Request, res: Response) {
  try {
    const user_id = req.body.userId;
    const reply_id = req.params.replyid;
    const { body } = replyScheme.validateSync(req.body);

    const check = await db(
      "SELECT reply_id FROM reply WHERE reply_id=? and user_id=?",
      [reply_id, user_id]
    );

    if (!check[0]) return res.status(401).send({ success: false });

    const rows = await db("UPDATE reply SET body=? WHERE reply_id = ?", [
      body,
      reply_id,
    ]);

    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
    });
  }
}

async function deleteReply(req: Request, res: Response) {
  try {
    const user_id = req.body.userId;
    const reply_id = req.params.replyid;
    const check = await db(
      "SELECT reply_id FROM reply WHERE reply_id=? and user_id=?",
      [reply_id, user_id]
    );

    if (!check[0]) return res.status(401).send({ success: false });

    const rows = await db("DELETE FROM reply WHERE reply_id=? OR parent_id=?", [
      reply_id,
      reply_id,
    ]);

    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
    });
  }
}

async function replyCount(req: Request, res: Response) {
  try {
    const boardId = req.params.boardid;
    const rows = await db(
      "select count(reply_id) as replycount from reply where board_id=?",
      [boardId]
    );

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
    const user_id = req.body.userId;
    const reply_id = req.params.replyid;

    const check = await db(
      "SELECT good_id FROM ReplyGood WHERE reply_id=? and user_id=?",
      [reply_id, user_id]
    );

    if (check[0]) {
      await db("DELETE FROM replygood WHERE good_id=?", [check[0].good_id]);
      res.json({
        success: true,
        stat: "DELETE",
      });
    } else {
      await db("INSERT INTO replygood (user_id, reply_id) VALUES (?, ?)", [
        user_id,
        reply_id,
      ]);
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


const router = Router();

//댓글 좋아요
router.get('/goodcount/:replyid', goodCount);
router.get('/good/:replyid', tokens.validTokenCheck, goodReply);

//댓글 갯수
router.get("/replycount/:boardid", replyCount);

// 댓글 CRUD
router.post('/:boardid', tokens.validTokenCheck, insertReply);
router.post('/:boardid/:replyid', tokens.validTokenCheck, insertSubReply);
router.get('/:boardid', readAllReply);
router.put('/:boardid/:replyid', tokens.validTokenCheck, updateReply);
router.delete('/:boardid/:replyid', tokens.validTokenCheck, deleteReply);

export default router;
