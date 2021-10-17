import {Request, Response, Router} from 'express';
import {pool} from '../../db/db';
import * as yup from 'yup';
import {logger} from "../../log/logger";

export const timeTableScheme = yup.object({
    subject : yup.string().required(),
    days : yup.string().required(),
    period : yup.number().required(),
    location : yup.string().required(),
    teacher : yup.string().required()
})


// 시간표 등록
async function insertTimeTable(req: Request, res: Response){
    const conn = await pool.getConnection();
    try{
        const user_id = req.body.data.id;
        const list: Array<any> = req.body.list;

        await conn.beginTransaction();


        list.forEach(async e => {
            const {subject, days, period, location, teacher} = timeTableScheme.validateSync(e);

            const rows = await conn.query("SELECT user_id FROM timetable WHERE user_id=? AND days=? AND period=?",[user_id, days, period]);
            const check = JSON.parse(JSON.stringify(rows[0])); 
            
            if(!check[0]){
                await conn.query("INSERT INTO timetable (user_id, subject, days, period, location, teacher) VALUES(?, ?, ?, ?, ? ,?)",
                [user_id, subject, days, period, location, teacher]);
            } else{
                await conn.query("UPDATE timetable set subject=?, location=?, teacher=? WHERE days=? AND period=? AND user_id =?",
                [subject, location, teacher, days, period, user_id]);
            }
        })
        await conn.commit();
        res.json({success: true});
    } catch(error){
        await conn.rollback();
        logger.error("[insertTimetable]" + error);
        res.status(500).send({success: false});
    } finally{
        conn.release();
    }
}

// 시간표 조회
async function getTimeTable(req: Request, res: Response){
    try{
        const user_id = req.body.data.id;

        const rows = await pool.query("SELECT subject, days, period, location, teacher FROM timetable WHERE user_id=?", [user_id]);

        const data = JSON.parse(JSON.stringify(rows[0]));

        var table = {};

        data.forEach(e => {
            if(table[e.days] == undefined)
                table[e.days] = {};

            const times = "t" + e.period;

            table[e.days][times] = {
                subject: e.subject,
                location : e.location,
                teacher : e.teacher
            };
        })
        res.json({table : table});
    } catch(error){
        logger.error("[getTimetable]" + error);
        res.status(500).send({success: false});
    }

}


// 시간표 삭제
async function deleteTimeTable(req: Request, res: Response) {
    const conn = await pool.getConnection();
    try{
        const user_id = req.body.data.id;
        const list: Array<any> = req.body.list;

        await conn.beginTransaction();

        list.forEach(async element => {
            try{
                await conn.query("DELETE FROM timetable WHERE user_id=? AND days=? AND period=?",
                [user_id, element.days, element.period]);
            } catch(err){
                await conn.rollback();
                res.status(500).send({success: false});
            }
        });

        await conn.commit();
        res.json({success: true});
    } catch(error){
        await conn.rollback();
        logger.error("[deleteTimetable]" + error);
        res.status(500).send({success: false});
    } finally{
        conn.release();
    }
}

export {insertTimeTable, getTimeTable, deleteTimeTable}