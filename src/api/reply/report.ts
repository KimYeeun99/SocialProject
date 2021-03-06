import { Response, Request } from "express";
import * as yup from "yup";
import { db } from "../../db/db";
import moment from "moment";
import {logger} from "../../log/logger";

export const reportScheme = yup.object({
    board_id: yup.string().required(),
    reply_id: yup.number().required(),
    recv_id: yup.string().required(), //댓글 글쓴이
    body: yup.string().required(), //신고내용
});

function formatDate(date) {
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
}

//신고하기
async function reportReply(req: Request, res: Response) {
    try {
        const { board_id, reply_id, recv_id, body } = reportScheme.validateSync(
            req.body
        );

        const rows = await db(
            "INSERT INTO replyreport (board_id, reply_id, recv_id, send_id, body) values (?, ?, ?, ?, ?)",
            [board_id, reply_id, recv_id, req.body.data.id, body]
        );

        res.send({ success: true });
    } catch (error) {
        logger.error("[reportReply]" + error);
        res.status(500).send({ success: false });
    }
}

//자신이 신고한 신고목록 조회
async function getMyReplyReport(req: Request, res: Response) {
    try {
        const user_id = req.body.data.id;
        const rows = await db("SELECT * FROM replyreport WHERE send_id=?", [
            user_id,
        ]);

        const data = JSON.parse(JSON.stringify(rows));
        const report = [];

        data.forEach((value) => {
            value.regdate = formatDate(value.regdate);
            report.push(value);
        });

        res.send({ report, success: true });
    } catch (error) {
        logger.error("[getMyReportReply]" + error);
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
    } catch (error) {
        logger.error("[countReplyReportById]" + error);
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
            const reply = [];

            data.forEach((value) => {
                value.regdate = formatDate(value.regdate);
                reply.push(value);
            });

            res.send({ reply, success: true });
        } else {
            res.status(403).send({ success: false });
        }
    } catch (error) {
        logger.error("[getReplyReportById]" + error);
        res.status(500).send({ success: false });
    }
}

async function getReplyReport(req: Request, res: Response) {
    try {
        if (req.body.data.role === "master") {
            const page = ((req.params.page as unknown as number) - 1) * 10;
            const rows = await db(
                "SELECT * FROM replyreport ORDER BY regdate desc ,report_id desc LIMIT ?,10;",
                [page.toString()]
            );

            const data = JSON.parse(JSON.stringify(rows));
            const reply = [];

            data.forEach((value) => {
                value.regdate = formatDate(value.regdate);
                reply.push(value);
            });

            res.send({ reply, success: true });
        } else {
            res.status(403).send({ success: false });
        }
    } catch (error) {
        logger.error("[getReplyReport]" + error);
        res.status(500).send({ success: false });
    }
}

export {
    reportReply,
    getMyReplyReport,
    countReplyReportById,
    getReplyReportById,
    getReplyReport,
};
