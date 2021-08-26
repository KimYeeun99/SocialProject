import {Request, Response, Router} from 'express';
import {pool} from '../../db/db';
import * as yup from 'yup';

export const timeTableScheme = yup.object({
    subject : yup.string().required(),
    days : yup.string().required(),
    period : yup.number().required()
})


// 시간표 등록
async function insertTimeTable(req: Request, res: Response){
    const conn = await pool.getConnection();
    try{
        const user_id = req.body.data.id;
        const list: Array<any> = req.body.list;

        await conn.beginTransaction();


        for(var i=0; i<list.length; i++){
            const {subject, days, period} = timeTableScheme.validateSync(list[i]);

            await conn.query("INSERT INTO timetable (user_id, subject, days, period) VALUES(?, ?, ?, ?)",
            [user_id, subject, days, period]);
        }

        await conn.commit();
        res.json({success: true});
    } catch(err){
        await conn.rollback();
        console.log(err);
        res.status(500).send({success: false});
    } finally{
        conn.release();
    }
}

// 시간표 조회
async function getTimeTable(req: Request, res: Response){
    try{
        const user_id = req.body.data.id;

        const rows = await pool.query("SELECT subject, days, period FROM timetable WHERE user_id=?", [user_id]);

        const data = JSON.parse(JSON.stringify(rows[0]));

        var table = {};

        data.forEach(e => {
            if(table[e.days] == undefined)
                table[e.days] = {};

            const times = "t" + e.period;

            table[e.days][times] = e.subject;
        })
        res.json({table : table});
    } catch(err){
        res.status(500).send({success: false});
    }

}

// 시간표 수정
async function updateTimeTable(req: Request, res: Response){
    const conn = await pool.getConnection();
    try{
        const user_id = req.body.data.id;
        const list: Array<any> = req.body.list;

        await conn.beginTransaction();

        list.forEach(async element => {
            try{
                const {subject, days, period} = timeTableScheme.validateSync(element);
                await conn.query("UPDATE timetable set subject=? WHERE days=? AND period=? AND user_id =?",
                [subject, days, period, user_id]);

            } catch(err){
                await conn.rollback();
                res.status(400).send({success: false});
            }
        });

        await conn.commit();
        res.json({success: true});
    } catch(err){
        await conn.rollback();
        res.status(500).send({success: false});
    } finally{
        conn.release();
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
                const {subject, days, period} = timeTableScheme.validateSync(element);
                await conn.query("DELETE FROM timetable WHERE user_id=? AND days=? AND period=?",
                [user_id, days, period]);
            } catch(err){
                await conn.rollback();
                res.status(500).send({success: false});
            }
        });

        await conn.commit();
        res.json({success: true});
    } catch(err){
        await conn.rollback();
        res.status(500).send({success: false});
    } finally{
        conn.release();
    }
}

export {insertTimeTable, getTimeTable, updateTimeTable, deleteTimeTable}