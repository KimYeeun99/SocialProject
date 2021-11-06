import {Request, Response} from 'express';
import {pool} from '../../db/db';
import {logger} from '../../log/logger';
import * as yup from 'yup';
import moment from 'moment';

function formatDate(date) {
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
}

export const noticeScheme = yup.object({
    title: yup.string().required(),
    body: yup.string().required(),
    board_id: yup.number().required()
});
// 알림 추가
async function createNotice(req: Request, res: Response){
    try{
        const userId = req.body.data.id;

        const list: Array<any> = req.body.list;

        list.forEach(async function(data, index){
            const {title, body, board_id} = noticeScheme.validateSync(data);
            await pool.query('INSERT INTO notice (title, body, board_id, user_id) VALUES(?, ?, ?, ?)',
             [title, body, board_id, userId]);

             if(index == list.length-1){
                res.json({success: true});
             }
        })
    } catch(error){
        logger.error("[createNotice]" + error);
        return res.status(500).send({success: false});
    }
}

//알림 조회
async function getNoticeList(req: Request, res: Response){
    try{
        const userId = req.body.data.id;
        const rows = await pool.query(`SELECT N.title, N.body, N.board_id, B.type, N.regdate 
        FROM notice as N left join board as B on N.board_id=B.board_id 
        WHERE N.user_id=?
        ORDER BY N.regdate desc`,
         [userId]);

        const data = JSON.parse(JSON.stringify(rows[0]));
        data.forEach((value) => {
            value.regdate = formatDate(value.regdate);
        })
        
        res.json({
            success: true,
            data: data
        })
    } catch(error){
        logger.error("[getNoticeList]" + error);
        return res.status(500).send({success: false});
    }
}

export {createNotice, getNoticeList};