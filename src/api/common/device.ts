import { Request, Response } from "express";
import { pool } from "../../db/db";

// 장치 등록
async function insertDevice(req: Request, res: Response){
    try{
        const deviceToken = req.body.deviceToken;
        const userId = req.body.data.id;
        const curDevice = await getDevice(userId);


        if(curDevice == ""){
            await pool.query("INSERT INTO devices VALUES(?, ?)", [userId, deviceToken]);
        }

        if(curDevice != deviceToken){
            await pool.query("UPDATE devices SET device_id=? WHERE user_id=?", [deviceToken, userId]);
        }

        res.json({success: true});
    } catch(error){
        res.status(500).send({success: false});
    }
}

// 장치 조회
async function getDevice(userId : string){
    try{
        const rows = await pool.query("SELECT device_id FROM devices WHERE user_id=?", [userId]);
        const check = JSON.parse(JSON.stringify(rows[0]));

        if(!check[0]){
            return "";
        }

        return check[0].device_id;
    } catch(error){
        throw error;
    }
    
}

export {insertDevice, getDevice};