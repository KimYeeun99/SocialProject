import { Router, Response, Request, NextFunction } from "express";
import * as yup from "yup";
import moment from "moment";
import { Board } from "../../model/board";
import tokens from "../common/token";
import { board_img } from "../common/upload";
import { BOARD_PATH } from "../common/upload";
import fs from "fs";
import { MulterRequest } from "../common/upload";
import { pool } from "../../db/db";
import { db } from "../../db/db";

export const boardScheme = yup.object({
  title: yup.string().required(),
  body: yup.string().required(),
});

function formatDate(date) {
  return moment(date).format("YYYY-MM-DD HH:mm:ss");
}

async function insertBoard(req: MulterRequest, res: Response) {
  const conn = await pool.getConnection();
  const user_id = req.body.data.id;
  board_img(req, res, async function () {
    try {
      const { title, body } = boardScheme.validateSync(req.body);
      const type = req.query.type;
      await conn.beginTransaction();

      const rows = await conn.query(
        "INSERT INTO board (title, body, user_id, type) values (?, ?, ?, ?)",
        [title, body, user_id, type]
      );

      const data = JSON.parse(JSON.stringify(rows[0]));
      const insertId = data.insertId;

      if (req.files) {
        for (var i = 0; i < req.files.length; i++) {
          await conn.query(
            "INSERT INTO boardpath (board_id, path) values (?, ?)",
            [insertId, req.files[i].filename]
          );
        }
      }

      await conn.commit();
      res.send({ success: true, data: rows[0] });
    } catch (error) {
      await conn.rollback();
      res.status(500).send({
        success: false,
      });
    } finally {
      conn.release();
    }
  });
}

async function searchBoard(req: Request, res: Response) {
  try {
    const title = req.query.title;
    const type = req.query.type;
    const rows = await pool.query(
      `select board.*,
      (select count(board_id) from boardgood where board.board_id=boardgood.board_id) as goodCount, 
      (select count(board_id) from reply where board.board_id=reply.board_id) as replyCount, 
      (select count(board_id) from scrap where board.board_id=scrap.board_id) as scrapCount  
      from board where type=? and (title like ? or body like ?) order by regdate desc`,
      [type, "%" + title + "%", "%" + title + "%"]
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
    res.status(500).send({
      success: false,
    });
  }
}

async function readAllBoard(req: Request, res: Response) {
  try {
    const type = req.query.type;
    if (!type) return res.status(400).send({ success: false });

    const rows = await pool.query(
      `select board.*,
      (select count(board_id) from boardgood where board.board_id=boardgood.board_id) as goodCount, 
      (select count(board_id) from reply where board.board_id=reply.board_id) as replyCount, 
      (select count(board_id) from scrap where board.board_id=scrap.board_id) as scrapCount  
      from board where type=? order by regdate desc`,
      [type]
    );
    const data: Array<Board> = JSON.parse(JSON.stringify(rows[0]));
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
    const rows = await pool.query(
      `select board.*,
      (select count(board_id) from boardgood where board.board_id=boardgood.board_id) as goodCount, 
      (select count(board_id) from reply where board.board_id=reply.board_id) as replyCount, 
      (select count(board_id) from scrap where board.board_id=scrap.board_id) as scrapCount 
      from board where board_id = ?`,
      [board_id]
    );

    if (!rows[0]) {
      res.status(400).send({ success: false });
    } else {
      const read = JSON.parse(JSON.stringify(rows[0]));
      read[0].regdate = formatDate(read[0].regdate);

      const rows2 = await pool.query(
        "SELECT path FROM boardpath WHERE board_id = ?",
        [board_id]
      );
      const data = JSON.parse(JSON.stringify(rows2[0]));
      var path = [];

      data.forEach((e) => {
        path.push("/img/board/" + e.path);
      });

      res.json({
        success: true,
        data: read,
        imagepath: path,
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
    });
  }
}

async function updateBoard(req: MulterRequest, res: Response) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const userId = req.body.data.id;
    board_img(req, res, async function () {
      const board_id = Number(req.params.id);
      const { title, body } = boardScheme.validateSync(req.body);
      const check = await conn.query(
        "SELECT user_id FROM board WHERE board_id=? AND user_id=?",
        [board_id, userId]
      );

      if (!check[0]) return res.status(401).send({ success: false });

      const path = await conn.query(
        "SELECT path FROM boardpath WHERE board_id=?",
        [board_id]
      );
      const pathdata = JSON.parse(JSON.stringify(path[0]));

      for (var i = 0; i < pathdata.length; i++) {
        fs.unlink(BOARD_PATH + pathdata[i].path, function (err) {
          if (err) {
            console.log(err);
          }
        });
      }
      await conn.query("DELETE FROM boardpath WHERE board_id = ?", [board_id]);

      const rows = await conn.query(
        "UPDATE board SET title=?, body=? WHERE board_id=?",
        [title, body, board_id]
      );

      if (req.files) {
        for (var i = 0; i < req.files.length; i++) {
          await conn.query(
            "INSERT INTO boardpath (board_id, path) values (?, ?)",
            [board_id, req.files[i].filename]
          );
        }
      }

      await conn.commit();

      res.json({
        success: true,
      });
    });
  } catch (error) {
    await conn.rollback();
    res.status(500).send({
      success: false,
    });
  } finally {
    conn.release();
  }
}

async function deleteBoard(req: Request, res: Response) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const board_id = req.params.id;
    const check = await conn.query(
      "SELECT user_id FROM board WHERE board_id=? AND user_id=?",
      [board_id, req.body.data.id]
    );

    if (!check[0]) return res.status(401).send({ success: false });

    const path = await conn.query(
      "SELECT path FROM boardpath WHERE board_id=?",
      [board_id]
    );
    const pathdata = JSON.parse(JSON.stringify(path[0]));

    for (var i = 0; i < pathdata.length; i++) {
      fs.unlink(BOARD_PATH + pathdata[i].path, function (err) {
        if (err) {
          console.log(err);
        }
      });
    }

    const rows = await conn.query("DELETE FROM board WHERE board_id=?", [
      board_id,
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
  } finally {
    conn.release();
  }
}

async function myReplyBoard(req: Request, res: Response) {
  try {
    const userId = req.body.data.id;
    const rows = await db(
      `select board.*,
      (select count(board_id) from boardgood where Grade1.board_id=boardgood.board_id) as goodCount, 
      (select count(board_id) from reply where Grade1.board_id=reply.board_id) as replyCount, 
      (select count(board_id) from scrap where Grade1.board_id=scrap.board_id) as ScrapCount 
      from (select distinct board_id from reply where user_id=?) as MR inner join Grade1 on MR.board_id=Grade1.board_id 
      order by regdate desc`,
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

export {
  insertBoard,
  searchBoard,
  readAllBoard,
  readOneBoard,
  updateBoard,
  deleteBoard,
  myReplyBoard,
};
// const router = Router();

// // 게시글 CRUD
// router.post("/", tokens.validTokenCheck, insertBoard);
// router.get("/search", searchBoard);
// router.get("/", readAllBoard);
// router.get("/:id", readOneBoard);
// router.put("/:id", tokens.validTokenCheck, updateBoard);
// router.delete("/:id", tokens.validTokenCheck, deleteBoard);

// export default router;
