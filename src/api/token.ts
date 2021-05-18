import {Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import {db} from '../db/db';

const secretKey = process.env.TOKEN_SECRET;
const accessExpireTime = 60 * 60 * 2;  // 2 hours (Access 토큰 만료기한)
const refreshExpireTime = 60 * 60 * 24 * 14;  // 2 Weeks (Refresh 토큰 만료기한)
const refreshRegenTime = 60 * 60 * 24 * 7; // 기한이 1 Weeks 이하로 남은경우 (Refresh 토큰 갱신 조건)

async function createTokens(data){
    var access = await createAcToken(data);

    if(await getRefToken(data.id)){
        await deleteRefToken(data.id);
    }
    var refresh = await createRefToken(data.id);

    return {
        access_token : access,
        refresh_token : refresh
    }
}

function deleteTokens(req: Request, res: Response){
    var token = req.headers["authorization"];
    jwt.verify(token, secretKey, async function(err, decode){
        if(err){
            return res.status(401).send({success: false});
        }
        await deleteRefToken(decode.id);
    })
}

async function validTokenCheck(req: Request, res: Response, next: NextFunction){
    const token = req.headers["authorization"];

    jwt.verify(token, secretKey, function(err, decode){
        if(err){
            return res.status(401).send({success: false});
        }
        req.body.data = decode.data;
        next();
    })
}

async function refreshRegen(req: Request, res: Response){
    const ref = req.headers["authorization"];

    const rows = await db('SELECT * FROM token WHERE token=?', [ref]);

    if(rows[0]){
        const token = rows[0].token;
        const id = rows[0].id;

        jwt.verify(token, secretKey, async function(err, decode){
            if(err){
                await deleteRefToken(id);
                return res.status(401).send({success: false});
            }

            if(refreshTimeCheck(decode.iat)){
                var data = await createTokens(decode.data);
                return res.json(data);
            } else {
                var data = await createAcToken(decode.data);
                return res.json({
                    access_token : data,
                    refresh_token : ""
                })
            }
        });
    } else{
        return res.status(401).send({success: false});
    }
}


/*
------------------------------------------------------------------------------
                            Supporting Function
------------------------------------------------------------------------------
*/

function createAcToken(data){
    const acToken = jwt.sign({data: data}, secretKey, {expiresIn : accessExpireTime});
    return acToken;
}

async function createRefToken(id){
    const refToken = jwt.sign({}, secretKey, {expiresIn : refreshExpireTime});
    await db('INSERT INTO token VALUES(?, ?)',[id, refToken]);

    return refToken;
}

async function getRefToken(id){
    const rows = await db('SELECT token FROM token WHERE id=?',[id]);

    var refToken = '';
    
    if(rows[0]){
        refToken = rows[0].token;
    }

    return refToken;
}

async function deleteRefToken(id: string) {
    const rows = await db('DELETE FROM token WHERE id=?', [id]);
}

function refreshTimeCheck(time){
    if((Date.now()/1000) - time > refreshRegenTime){
        return true
    }

    return false
}

const token = {
    createTokens : createTokens,
    deleteTokens : deleteTokens,
    validTokenCheck : validTokenCheck,
    refreshRegen : refreshRegen
}

export default token