import {Request, Response} from 'express';
import {pool} from '../../db/db';
import * as yup from 'yup';

export const studentSchema = yup.object({
    name : yup.string().required(),
    studentId : yup.string().required()
});

// 학번, 이름 등록
async function insertStudent(req: Request, res: Response){
    const conn = await pool.getConnection();
    try{
        const data: Array<any> = req.body.list;
        if(req.body.data.role !== 'master'){
            return res.status(403).send({success: false});
        }
        await conn.beginTransaction();

        for(var i=0; i<data.length; i++){
            const {name, studentId} = studentSchema.validateSync(data[i]);
            const rows : any = await conn.query('SELECT student_id FROM authstudent WHERE name=? AND student_id=?',
            [name, studentId]);
            
            const check = JSON.parse(JSON.stringify(rows[0]));

            if(check[0]){
                return res.status(400).send({success: false});
            }
            await conn.query('INSERT INTO authstudent VALUES(?, ?)', [studentId, name]);
        }

        await conn.commit();

        res.send({success: true});

    } catch(error){
        await conn.rollback();
        res.status(500).send({success: false});
    } finally{
        conn.release();
    }
}

// 학번 인증
async function checkStudent(req: Request, res: Response){
    try{
        const {name, studentId} = studentSchema.validateSync(req.body);
        const rows = await pool.query('SELECT * FROM authstudent WHERE name=? AND student_id=?',
         [name, studentId]);

        const check = JSON.parse(JSON.stringify(rows[0]));
         if(!check[0]) 
            return res.status(401).send({success: false});

        res.send({success: true});
    } catch(error){
        res.status(500).send({success: false});
    }
}

// 학번, 이름 목록 조회
async function getStudent(req: Request, res: Response){
    try{
        if(req.body.data.role !== 'master'){
            return res.status(403).send({success: false});
        }

        const rows = await pool.query('SELECT * FROM authstudent', []);
        const data = JSON.parse(JSON.stringify(rows[0]));

        res.send({
            success: true,
            data: data
        });

    } catch(error){
        return res.status(500).send({success: false});
    }
}

// 학번, 이름 삭제
async function deleteStudent(req: Request, res: Response){
    const conn = await pool.getConnection();
    try{
        const data : Array<any> = req.body.list;

        if(req.body.data.role !== 'master'){
            return res.status(403).send({success: false});
        }

        await conn.beginTransaction();

        for(var i=0; i<data.length; i++){
            const {name, studentId} = studentSchema.validateSync(data[i]);
            await conn.query('DELETE FROM authstudent WHERE name=? AND student_id=?',
             [name, studentId]);
        }


        await conn.commit();
        res.send({success: true});
    } catch(error){
        await conn.rollback();
        res.status(500).send({success: false});
    } finally{
        conn.release();
    }

}

export {insertStudent, checkStudent, getStudent, deleteStudent}