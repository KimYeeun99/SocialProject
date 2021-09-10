import {Request, Response} from 'express';
import nodemailer from 'nodemailer';
import {pool} from '../../db/db';
import argon2 from 'argon2';
import { db } from "../../db/db";
import * as crypto from "crypto";

function createTempPassword(){
    const password = Math.random().toString(36).slice(2);

    return password;
}

async function sendMailer(email : string, password : string){
    try{
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            host : 'smtp.gmail.com',
            port : 587,
            secure : false,
            auth : {
                user : process.env.NODEMAILER_USER,
                pass : process.env.NODEMAILER_PASS
            }
        });

        let send = await transporter.sendMail({
            from : 'Test@gmail.com',
            to : email,
            // 제목
            subject : "임시 비밀번호 발급", 
            // 내용
            html : `
            <h3>임시 비밀번호 : ${password}</h3>
            `
        })
    } catch(error){
        throw "Email Send Error";
    }
}

// 임시 비밀번호 전송
async function forgotPassword(req: Request, res: Response) {
    const conn = await pool.getConnection();
    try{
      const data = {
          id : req.body.id,
          name : req.body.name,
          studentId : req.body.studentId
      };

      await conn.beginTransaction();

      const rows = await conn.query('SELECT email FROM user natural join authstudent WHERE id=? AND name=? AND student_id=?',
      [data.id, data.name, data.studentId]);

      const userData = JSON.parse(JSON.stringify(rows[0]));

      if(!userData[0]){
        return res.status(401).send({success: false});
      }

      const password = createTempPassword();
      const hashpassword = await argon2.hash(password);
      await conn.query('UPDATE user SET password=? WHERE id=?', [hashpassword, data.id]);

      // 메일 보내기
      await sendMailer(userData[0].email, password);
      await conn.commit();

      res.json({succecss: true});

    } catch(error){
        await conn.rollback();
        res.status(500).send({success: false});
    } finally{
        conn.release();
    }
}

//password 수정
async function setPassword(req: Request, res: Response) {
    try {
        const newPassword = req.body.password;
        const hashPassword = await argon2.hash(newPassword);

        const update = await db("UPDATE user SET password=? WHERE id=?", [
            hashPassword,
            req.body.data.id,
        ]);

        res.send({ success: true });
    } catch (error) {
        res.status(500).send({ success: false });
    }
}

//입력된 password가 Login된 password가 일치하는지 여부
async function checkPassword(req: Request, res: Response) {
    try {
        const password = req.body.password;
        const rows = await db("SELECT * FROM user WHERE id=?", [
            req.body.data.id,
        ]);
        if (await argon2.verify(rows[0].password, password)) {
            return res.send({ success: true });
        }
        return res.status(400).send({ success: false });
    } catch (error) {
        res.status(500).send({ success: false });
    }
}

export { forgotPassword, setPassword, checkPassword };
