import { Router, Response, Request, NextFunction } from "express";
import * as yup from "yup";
import { db } from "../db/db";

export const replyScheme = yup.object({
  body: yup.string().required(),
});

async function insertReply(req: Request, res: Response) {
  try {
    const { body } = replyScheme.validateSync(req.body);

    const board_id = req.params.boardid;
    const user_id = req.session.userId;

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
      msg: "댓글 작성 완료",
    });
  } catch (error) {
    res.status(500).send({
      msg: "댓글 작성 실패",
    });
  }
}

async function insertSubReply(req: Request, res: Response) {
  try {
    const parent_id = req.params.replyid;
    const board_id = req.params.boardid;
    const user_id = req.session.userId;
    const { body } = replyScheme.validateSync(req.body);

    const rows = await db(
      "INSERT INTO reply (body, user_id, board_id, parent_id, level) VALUES (?, ?, ?, ?, ?)",
      [body, user_id, board_id, parent_id, 1]
    );

    res.json({
      msg: "댓글 작성 완료",
    });
  } catch (error) {
    res.status(500).send({
      msg: "댓글 작성 실패",
    });
  }
}

async function readAllReply(req: Request, res: Response) {
  try {
    const boardId = req.params.boardid;
    const rows = await db(
      `SELECT * FROM reply where board_id=? order by parent_id, level, regdate`,
      [boardId]
    );

    var data = JSON.parse(JSON.stringify(rows));

    var tree = [];
    var cnt = -1;
    for (var d = 0; d < data.length; d++) {
      if (data[d].level === 0) {
        tree.push({
          data: data[d],
          child: [],
        });
        cnt++;
      } else {
        if (cnt !== -1) tree[cnt].child.push(data[d]);
      }
    }
    res.json(tree);
  } catch (error) {
    res.status(500).send({
      msg: "댓글 조회 실패",
    });
  }
}

async function updateReply(req: Request, res: Response) {
  try {
    const user_id = req.session.userId;
    const reply_id = req.params.replyid;
    const { body } = replyScheme.validateSync(req.body);

    const check = await db(
      "SELECT reply_id FROM reply WHERE reply_id=? and user_id=?",
      [reply_id, user_id]
    );

    if (!check[0])
      return res.status(401).send({ msg: "사용자가 일치하지 않습니다." });

    const rows = await db("UPDATE reply SET body=? WHERE reply_id = ?", [
      body,
      reply_id,
    ]);

    res.json({
      msg: "댓글 수정 성공",
    });
  } catch (error) {
    res.status(500).send({
      msg: "댓글 수정 실패",
    });
  }
}

async function deleteReply(req: Request, res: Response) {
  try {
    const user_id = req.session.userId;
    const reply_id = req.params.replyid;
    const check = await db(
      "SELECT reply_id FROM reply WHERE reply_id=? and user_id=?",
      [reply_id, user_id]
    );

    if (!check[0])
      return res.status(401).send({ msg: "사용자가 일치하지 않습니다." });

    const rows = await db("DELETE FROM reply WHERE reply_id=? OR parent_id=?", [
      reply_id,
      reply_id,
    ]);

    res.json({
      msg: "댓글 삭제 성공",
    });
  } catch (error) {
    res.status(500).send({
      msg: "댓글 삭제 실패",
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

    if (rows[0]) {
      res.json(rows);
    } else {
      res.json({
        replycount: 0,
      });
    }
  } catch (error) {
    res.status(500).send({
      msg: "댓글 개수 조회 실패",
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

    if (rows[0]) res.json(rows);
    else
      res.send({
        count: 0,
      });
  } catch (error) {
    res.status(400).send({
      msg: "좋아요 개수 조회 실패",
    });
  }
}

async function goodReply(req: Request, res: Response) {
  try {
    const user_id = req.session.userId;
    const reply_id = req.params.replyid;

    const check = await db(
      "SELECT good_id FROM ReplyGood WHERE reply_id=? and user_id=?",
      [reply_id, user_id]
    );

    if (check[0]) {
      await db("DELETE FROM replygood WHERE good_id=?", [check[0].good_id]);
      res.json({
        msg: "좋아요 취소 성공",
      });
    } else {
      await db("INSERT INTO replygood (user_id, reply_id) VALUES (?, ?)", [
        user_id,
        reply_id,
      ]);
      res.json({
        msg: "좋아요 성공",
      });
    }
  } catch (error) {
    res.status(500).send({
      msg: "좋아요 실패",
    });
  }
}

function loginCheck(req: Request, res: Response, next: NextFunction) {
  if (req.session.isLogedIn) {
    next();
  } else {
    res.status(401).send({
      msg: "로그인이 필요합니다",
    });
  }
}

const router = Router();

//댓글 좋아요
router.get("/goodcount/:replyid", goodCount);
router.get("/good/:replyid", loginCheck, goodReply);

//댓글 갯수
router.get("/replycount/:boardid", replyCount);

// 댓글 CRUD
router.post("/:boardid", loginCheck, insertReply);
router.post("/:boardid/:replyid", loginCheck, insertSubReply);
router.get("/:boardid", readAllReply);
router.put("/:boardid/:replyid", loginCheck, updateReply);
router.delete("/:boardid/:replyid", loginCheck, deleteReply);

export default router;
