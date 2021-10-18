import { Response, Request } from "express";
import * as yup from "yup";
import { db } from "../../db/db";
import moment from "moment";
import {logger} from "../../log/logger";

export const reportScheme = yup.object({
    board_id: yup.string().required(),
    recv_id: yup.string().required(), //게시판 글쓴이
    body: yup.string().required(), //신고내용
});

function formatDate(date) {
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
}

//신고하기
async function reportBoard(req: Request, res: Response) {
    try {
        const { board_id, recv_id, body } = reportScheme.validateSync(req.body);

        const rows = await db(
            "INSERT INTO boardreport (board_id, recv_id, send_id, body) values (?, ?, ?, ?)",
            [board_id, recv_id, req.body.data.id, body]
        );

        res.send({ success: true });
    } catch (error) {
        logger.error("[reportBoard]" + error);
        res.status(500).send({ success: false });
    }
}

//자신이 신고한 신고목록 조회
async function getMyReport(req: Request, res: Response) {
    try {
        const user_id = req.body.data.id;
        const rows = await db("SELECT * FROM boardreport WHERE send_id=?", [
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
        logger.error("[getMyReport]" + error);
        res.status(500).send({ success: false });
    }
}

async function countReportById(req: Request, res: Response) {
    try {
        if (req.body.data.role === "master") {
            const count = await db(
                "SELECT recv_id, count(*) as count FROM boardreport GROUP BY recv_id",
                []
            );

            res.send({ count, success: true });
        } else {
            res.status(403).send({ success: false });
        }
    } catch (error) {
        logger.error("[countReportById]" + error);
        res.status(500).send({ success: false });
    }
}

async function getReportById(req: Request, res: Response) {
    try {
        if (req.body.data.role === "master") {
            const rows = await db("SELECT * FROM boardreport WHERE recv_id=?", [
                req.query.id,
            ]);

            const data = JSON.parse(JSON.stringify(rows));
            const board = [];

            data.forEach((value) => {
                value.regdate = formatDate(value.regdate);
                board.push(value);
            });

            res.send({ board, success: true });
        } else {
            res.status(403).send({ success: false });
        }
    } catch (error) {
        logger.error("[getBoardReportById]" + error);
        res.status(500).send({ success: false });
    }
}

async function getReport(req: Request, res: Response) {
    try {
        if (req.body.data.role === "master") {
            const page = ((req.params.page as unknown as number) - 1) * 10;
            const rows = await db(
                "SELECT * FROM boardreport ORDER BY regdate desc ,report_id desc LIMIT ?,10;",
                [page.toString()]
            );

            const data = JSON.parse(JSON.stringify(rows));
            const board = [];

            data.forEach((value) => {
                value.regdate = formatDate(value.regdate);
                board.push(value);
            });

            res.send({ board, success: true });
        } else {
            res.status(403).send({ success: false });
        }
    } catch (error) {
        logger.error("[getBoardReport]" + error);
        res.status(500).send({ success: false });
    }
}

export { reportBoard, getMyReport, countReportById, getReportById, getReport };
