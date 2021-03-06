import { Request, Response } from "express";
import { pool } from "../../db/db";
import * as yup from "yup";
import multiparty from "multiparty";
import xlsx from "xlsx";
import {logger} from "../../log/logger";

export const studentScheme = yup.object({
    name: yup.string().required(),
    studentId: yup.string().required(),
});

function getStudentId(sGrade, sClass, sNumber) {
    const year = new Date().getFullYear() - (sGrade - 1);
    var studentId = year + "" + sGrade;

    sClass = sClass < 10 ? "0" + sClass : sClass;
    sNumber = sNumber < 10 ? "0" + sNumber : sNumber;

    studentId += sClass + "" + sNumber;

    return studentId;
}

// 학번, 이름 등록
async function insertStudent(req: Request, res: Response) {
    const conn = await pool.getConnection();
    if (req.body.data.role !== "master") {
        return res.status(403).send({ success: false });
    }

    var data;

    const form = new multiparty.Form({
        autoFiles: false,
    });

    form.on("file", async function (name: any, file: any) {
        try{
            const workSheet = xlsx.readFile(file.path);
            const sheetName = Object.keys(workSheet.Sheets);

            data = xlsx.utils.sheet_to_json(workSheet.Sheets[sheetName[0]]);

            await conn.beginTransaction();
            for (var i = 0; i < data.length; i++) {
                const name = data[i].이름;
                const studentId = getStudentId(
                    data[i].학년,
                    data[i].반,
                    data[i].번호
                );
                const rows: any = await conn.query(
                    "SELECT student_id FROM authstudent WHERE name=? AND student_id=?",
                    [name, studentId]
                );

                const check = JSON.parse(JSON.stringify(rows[0]));

                if (check[0]) {
                    continue;
                }
                await conn.query("INSERT INTO authstudent VALUES(?, ?)", [
                    studentId,
                    name,
                ]);
            }
        
        } catch(error){
            logger.error("[auth/insertStudent]" + error);
            res.status(500).send({success: false});
        } finally{
            conn.release();
        }

        await conn.commit();
    });

    form.on("close", () => {
        res.send({success: true});
    })

    form.parse(req);
}

// 학번 인증
async function checkStudent(req: Request, res: Response) {
    try {
        const { name, studentId } = studentScheme.validateSync(req.body);
        const rows = await pool.query(
            "SELECT * FROM authstudent WHERE name=? AND student_id=?",
            [name, studentId]
        );

        const check = JSON.parse(JSON.stringify(rows[0]));
        if (!check[0]) return res.status(401).send({ success: false });

        res.send({ success: true });
    } catch (error) {
        logger.error("[auth/checkStudent]" + error);
        res.status(500).send({ success: false });
    }
}

// 학번, 이름 목록 조회
async function getStudent(req: Request, res: Response) {
    try {
        if (req.body.data.role !== "master") {
            return res.status(403).send({ success: false });
        }

        const rows = await pool.query("SELECT * FROM authstudent", []);
        const data = JSON.parse(JSON.stringify(rows[0]));

        res.send({
            success: true,
            data: data,
        });
    } catch (error) {
        logger.error("[auth/getStudent]" + error);
        return res.status(500).send({ success: false });
    }
}

// 학번, 이름 삭제
async function deleteStudent(req: Request, res: Response) {
    const conn = await pool.getConnection();
    try {
        const data: Array<any> = req.body.list;

        if (req.body.data.role !== "master") {
            return res.status(403).send({ success: false });
        }

        await conn.beginTransaction();

        for (var i = 0; i < data.length; i++) {
            const { name, studentId } = studentScheme.validateSync(data[i]);
            await conn.query(
                "DELETE FROM authstudent WHERE name=? AND student_id=?",
                [name, studentId]
            );
        }

        await conn.commit();
        res.send({ success: true });
    } catch (error) {
        await conn.rollback();
        logger.error("[auth/deleteStudent]" + error);
        res.status(500).send({ success: false });
    } finally {
        conn.release();
    }
}

// 회원가입 학생 학번, 아이디, 이름, role 목록 조회
async function getRegisterStudent(req: Request, res: Response) {
    try {
        if (req.body.data.role !== "master") {
            return res.status(403).send({ success: false });
        }

        const rows = await pool.query(
            "SELECT id, name, role, schoolgrade, schoolclass, schoolnumber FROM user",
            []
        );
        const data = JSON.parse(JSON.stringify(rows[0]));

        res.send({
            success: true,
            data: data,
        });
    } catch (error) {
        logger.error("[auth/getRegisterStudent]" + error);
        return res.status(500).send({ success: false });
    }
}

export {
    insertStudent,
    checkStudent,
    getStudent,
    deleteStudent,
    getRegisterStudent,
};
