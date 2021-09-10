import { Response, Request } from "express";
import * as yup from "yup";
import { db } from "../../db/db";
import tokens from "../common/token";
import moment from "moment";

export const reportScheme = yup.object({
  reply_id: yup.string().required(),
  recv_id: yup.string().required(), //댓글 글쓴이
  body: yup.string().required(), //신고내용
});

function formatDate(date) {
  return moment(date).format("YYYY-MM-DD HH:mm:ss");
}

//신고하기
async function reportReply(req: Request, res: Response) {
  try {
    const { reply_id, recv_id, body } = reportScheme.validateSync(req.body);

    const rows = await db(
      "INSERT INTO replyreport (reply_id, recv_id, send_id, body) values (?, ?, ?, ?)",
      [reply_id, recv_id, req.body.data.id, body]
    );

    res.send({ success: true });
  } catch (err) {
    res.status(500).send({ success: false });
  }
}

//자신이 신고한 신고목록 조회
async function getMyReplyReport(req: Request, res: Response) {
  try {
    const user_id = req.body.data.id;
    const rows = await db("SELECT * FROM replyreport WHERE send_id=?", [user_id]);

    const data = JSON.parse(JSON.stringify(rows));
    const report = [];

    data.forEach((value) => {
      value.regdate = formatDate(value.regdate);
      report.push(value);
    });

    res.send({ report, success: true });
  } catch (err) {
    res.status(500).send({ success: false });
  }
}

async function countReplyReportById(req: Request, res: Response) {
  try {
    if (req.body.data.role === "master") {
      const count = await db(
        "SELECT recv_id, count(*) as count FROM replyreport GROUP BY recv_id",
        []
      );

      res.send({ count, success: true });
    } else {
      res.status(403).send({ success: false });
    }
  } catch (err) {
    res.status(500).send({ success: false });
  }
}

async function getReplyReportById(req: Request, res: Response) {
  try {
    if (req.body.data.role === "master") {
      const rows = await db("SELECT * FROM replyreport WHERE recv_id=?", [
        req.query.id,
      ]);

      const data = JSON.parse(JSON.stringify(rows));
      const report = [];

      data.forEach((value) => {
        value.regdate = formatDate(value.regdate);
        report.push(value);
      });

      res.send({ report, success: true });
    } else {
      res.status(403).send({ success: false });
    }
  } catch (err) {
    res.status(500).send({ success: false });
  }
}

export { reportReply, getMyReplyReport, countReplyReportById, getReplyReportById };
