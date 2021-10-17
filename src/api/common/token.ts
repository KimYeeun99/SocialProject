import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../../db/db";
import { logger } from "../../log/logger";

const secretKey = process.env.TOKEN_SECRET;
const accessExpireTime = 60 * 60 * 2; // 2 hours (Access 토큰 만료기한)
const refreshExpireTime = 60 * 60 * 24 * 14; // 2 Weeks (Refresh 토큰 만료기한)
const refreshRegenTime = 60 * 60 * 24 * 7; // 기한이 1 Weeks 이하로 남은경우 (Refresh 토큰 갱신 조건)

async function createTokens(data) {
    var access = await createAcToken(data);

    if (await getRefToken(data.id)) {
        await deleteRefToken(data.id);
    }
    var refresh = await createRefToken(data);

    logger.info(`Login-${data.id}`);
    return {
        access_token: access,
        refresh_token: refresh,
    };
}

async function deleteTokens(req: Request, res: Response) {
    var token = req.headers["authorization"];
    jwt.verify(token, secretKey, async function (err, decode) {
        if (err) {
            return res.status(401).send({ success: false });
        }
        const userId = decode.data.id;
        await deleteRefToken(decode.data.id);

        logger.info(`Logout-${userId}`);
    });
}

// 로그인 체크
async function loginCheck(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const token = req.headers["authorization"];

    jwt.verify(token, secretKey, async function (err, decode) {
        if (err) {
            return res.status(401).send({ success: false });
        }
        const check = await getRefToken(decode.data.id);
        if(!check){
            return res.status(401).send({success: false});
        }

        req.body.data = decode.data;
        next();
    });
}

//토큰 유효성 체크
async function validCheck(req: Request, res: Response) {
    const token = req.headers["authorization"];

    jwt.verify(token, secretKey, function (err, decode) {
        if (err) {
            return res.status(401).send({ success: false });
        } else {
            return res.json({ success: true, data: decode.data });
        }
    });
}

async function tokenRefresh(req: Request, res: Response) {
    const ref = req.body.token;

    if (!ref) return res.status(400).send({ success: false });

    const temp = await pool.query("SELECT * FROM token WHERE token=?", [ref]);
    const rows = JSON.parse(JSON.stringify(temp[0]));

    if (rows[0]) {
        const token = rows[0].token;
        const id = rows[0].id;

        jwt.verify(token, secretKey, async function (err, decode) {
            if (err) {
                await deleteRefToken(id);
                return res.status(401).send({ success: false });
            }

            if (refreshTimeCheck(decode.iat)) {
                var data = await createTokens(decode.data);
                return res.json(data);
            } else {
                var data = await createAcToken(decode.data);
                return res.json({
                    access_token: data,
                    refresh_token: "",
                });
            }
        });
    } else {
        return res.status(401).send({ success: false });
    }
}

//로그인 상태 체크 (비로그인도 접근해야 할 경우)
async function loginStatusCheck(req: Request, res: Response, next: NextFunction){
    const token = req.headers["authorization"];

    if(token) loginCheck(req, res, next);
    else{
        const data = {id : ''};
        req.body.data = data;
        next();
    }
}

/*
------------------------------------------------------------------------------
                            Supporting Function
------------------------------------------------------------------------------
*/

function createAcToken(data) {
    const acToken = jwt.sign({ data: data }, secretKey, {
        expiresIn: accessExpireTime,
    });
    return acToken;
}

async function createRefToken(data) {
    const refToken = jwt.sign({ data: data }, secretKey, {
        expiresIn: refreshExpireTime,
    });
    await pool.query("INSERT INTO token VALUES(?, ?)", [data.id, refToken]);

    return refToken;
}

async function getRefToken(id) {
    const temp = await pool.query("SELECT token FROM token WHERE id=?", [id]);
    const rows = JSON.parse(JSON.stringify(temp[0]));

    var refToken = "";

    if (rows[0]) {
        refToken = rows[0].token;
    }

    return refToken;
}

async function deleteRefToken(id: string) {
    await pool.query("DELETE FROM token WHERE id=?", [id]);
}

function refreshTimeCheck(time) {
    if (Date.now() / 1000 - time > refreshRegenTime) {
        return true;
    }

    return false;
}

const token = {
    createTokens: createTokens,
    deleteTokens: deleteTokens,
    loginCheck : loginCheck,
    validCheck : validCheck,
    tokenRefresh: tokenRefresh,
    loginStatusCheck: loginStatusCheck
};

export default token;
