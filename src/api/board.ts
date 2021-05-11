import { Router, Response, Request, NextFunction } from "express";
import * as yup from "yup";
import { db } from "../db/db";
import moment from "moment";
import { Board } from "../model/board";
import tokens from "./token";

export const boardScheme = yup.object({
  title: yup.string().required(),
  body: yup.string().required(),
});

function formatDate(date) {
  return moment(date).format("YYYY-MM-DD HH:mm:ss");
}

async function insertBoard(req: Request, res: Response) {
  try {
    const { title, body } = boardScheme.validateSync(req.body);

    const user_id = req.body.userId;

    const rows = await db(
      "INSERT INTO board (title, body, user_id) values (?, ?, ?)",
      [title, body, user_id]
    );
    res.send({
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
    });
  }
}

async function searchBoard(req: Request, res: Response) {
  try {
    const title = req.query.title;
    const rows = await db(
      `select * from board where title like ? or body like ? order by regdate desc`,
      ["%" + title + "%", "%" + title + "%"]
    );

    const data = JSON.parse(JSON.stringify(rows));
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
    res.status(500).send({
      success: false,
    });
  }
}

async function readAllBoard(req: Request, res: Response) {
  try {
    const rows = await db(
      "select *, (select count(board_id) from boardgood where board.board_id=boardgood.board_id) as goodCount from board order by regdate desc",
      []
    );
    const data: Array<Board> = JSON.parse(JSON.stringify(rows));
    const list: Array<Board> = [];

    data.forEach((value) => {
      value.regdate = formatDate(value.regdate);
      list.push(value);
    });

    res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
    });
  }
}

async function readOneBoard(req: Request, res: Response) {
  try {
    const board_id = req.params.id;
    const rows = await db(`select * from board WHERE board_id=?`, [board_id]);
    const good_row = await db(
      "select count(board_id) as goodcount from boardgood where board_id=? group by board_id",
      [board_id]
    );

    if (!rows) {
      res.status(400).send({ success: false });
    }

    if (!good_row[0]) rows[0].goodCount = 0;
    else rows[0].goodCount = good_row[0].goodcount;

    const read: Board = rows[0];
    read.regdate = formatDate(read.regdate);

    res.json({
      success: true,
      data: read,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
    });
  }
}

async function updateBoard(req: Request, res: Response) {
  try {
    const board_id = Number(req.params.id);
    const { title, body } = boardScheme.validateSync(req.body);
    const check = await db(
      "SELECT user_id FROM board WHERE board_id=? AND user_id=?",
      [board_id, req.body.userId]
    );

    if (!check[0]) return res.status(401).send({ success: false });

    const rows = await db("UPDATE board SET title=?, body=? WHERE board_id=?", [
      title,
      body,
      board_id,
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

async function deleteBoard(req: Request, res: Response) {
  try {
    const board_id = req.params.id;
    const check = await db(
      "SELECT user_id FROM board WHERE board_id=? AND user_id=?",
      [board_id, req.body.userId]
    );

    if (!check[0]) return res.status(401).send({ success: false });

    const rows = await db("DELETE FROM board WHERE board_id=?", [board_id]);
    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
    });
  }
}

async function scrapBoard(req: Request, res: Response) {
  try {
    const boardId = req.params.id;
    const userId = req.body.userId;

    const check = await db(
      "SELECT scrap_id FROM scrap WHERE board_id=? AND user_id=?",
      [boardId, userId]
    );

    if (check[0]) {
      await db("DELETE FROM scrap WHERE scrap_id=?", [check[0].scrap_id]);
      res.json({
        success: true,
        stat: "DELETE",
      });
    } else {
      await db("INSERT INTO scrap (board_id, user_id) VALUES (?, ?)", [
        boardId,
        userId,
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

async function readScrapBoard(req: Request, res: Response) {
  try {
    const userId = req.body.userId;

    const rows = await db(
      `select board.* from scrap inner join board on board.board_id=scrap.board_id where scrap.user_id=? order by regdate desc`,
      [userId]
    );

    const data = JSON.parse(JSON.stringify(rows));
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
    res.status(500).send({
      success: false,
    });
  }
}

async function scrapCount(req: Request, res: Response) {
  try {
    const boardId = req.params.id;
    const rows = await db(
      "select count(scrap_id) as scrapcount from scrap where board_id=?",
      [boardId]
    );

    var count = 0;

    if (rows[0]) count = rows[0].scrapcount;

    res.json({
      success: true,
      scrapcount: count,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
    });
  }
}

async function goodCount(req: Request, res: Response) {
  try {
    const boardId = req.params.id;
    const rows = await db(
      "select count(board_id) as goodcount from boardgood where board_id=? group by board_id",
      [boardId]
    );

    var count = 0;

    if (rows[0]) count = rows[0].goodcount;

    res.json({
      success: true,
      goodcount: count,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
    });
  }
}

async function goodBoard(req: Request, res: Response) {
  try {
    const user_id = req.body.userId;
    const board_id = req.params.id;

    const check = await db(
      "SELECT good_id FROM BoardGood WHERE board_id=? and user_id=?",
      [board_id, user_id]
    );

    if (check[0]) {
      await db("DELETE FROM boardgood WHERE good_id=?", [check[0].good_id]);
      res.json({
        success: true,
        stat: "DELETE",
      });
    } else {
      await db("INSERT INTO boardgood (user_id, board_id) VALUES (?, ?)", [
        user_id,
        board_id,
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

async function myReplyBoard(req: Request, res: Response) {
  try {
    const userId = req.body.userId;
    const rows = await db(
      `select board.* from (select distinct board_id from reply where user_id=?) as R 
    inner join board on R.board_id=board.board_id order by regdate desc`,
      [userId]
    );

    const data = JSON.parse(JSON.stringify(rows));
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
    res.status(500).send({
      success: false,
    });
  }
}

const router = Router();

// 게시글 좋아요
router.get("/good/:id", tokens.validTokenCheck, goodBoard);
router.get("/goodcount/:id", goodCount);

// 게시글 스크랩
router.get("/scrap", tokens.validTokenCheck, readScrapBoard);
router.get("/scrap/:id", tokens.validTokenCheck, scrapBoard);
router.get("/scrapcount/:id", scrapCount);

//내가 단 댓글 게시글 조회
router.get("/myreply", tokens.validTokenCheck, myReplyBoard);

// 게시글 CRUD
router.post("/", tokens.validTokenCheck, insertBoard);
router.get("/search", searchBoard);
router.get("/", readAllBoard);
router.get("/:id", readOneBoard);
router.put("/:id", tokens.validTokenCheck, updateBoard);
router.delete("/:id", tokens.validTokenCheck, deleteBoard);

export default router;
