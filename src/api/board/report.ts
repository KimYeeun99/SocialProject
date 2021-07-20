import { Response, Request } from "express";
import * as yup from "yup";
import { db } from "../../db/db";
import tokens from "../common/token";

export const reportScheme = yup.object({
    board_id: yup.string().required(),
    recv_id: yup.string().required(), //게시판 글쓴이
    body: yup.string().required(), //신고내용
});

//신고하기
async function reportBoard(req: Request, res: Response) {
    try {
        const { board_id, recv_id, body } = reportScheme.validateSync(req.body);

        const rows = await db(
            "INSERT INTO report (board_id, recv_id, send_id, body) values (?, ?, ?, ?)",
            [board_id, recv_id, req.body.data.id, body]
        );

        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ success: false });
    }
}

//자신이 신고한 신고목록 조회
async function getReportById(req: Request, res: Response) {
    try {
        const user_id = req.body.data.id;
        const report = await db("SELECT * FROM report WHERE user_id=?", [
            user_id,
        ]);

        res.send({ report, success: true });
    } catch (err) {
        res.status(500).send({ success: false });
    }
}

async function countReportById(req: Request, res: Response) {
    try {
        if (req.body.data.role === "master") {
            const count = await db(
                "SELECT recv_id, count(*) as count FROM report GROUP BY recv_id",
                []
            );

            res.send({ count, success: true });
        } else {
            res.status(400).send({ success: false });
        }
    } catch (err) {
        res.status(500).send({ success: false });
    }
}

export { reportBoard, getReportById, countReportById };
