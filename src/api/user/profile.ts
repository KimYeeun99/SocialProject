import { Response, Request } from "express";
import { db } from "../../db/db";
import fs from "fs";
import { profile_img } from "../common/upload";
import { PROFILE_PATH } from "../common/upload";
import { MulterRequest } from "../common/upload";
import moment from 'moment';
import * as yup from "yup";
import tokens from '../common/token';

function formatDate(date) {
    return moment(date).format("YYYY-MM-DD HH:mm:ss");
}

export const infoScheme = yup.object({
    phone: yup.string().required(),
    schoolgrade: yup.number().required(),
    schoolclass: yup.number().required(),
    schoolnumber: yup.number().required(),
    year: yup.number().required(),
    email: yup.string().required(),
    birth: yup.date().required(),
});


async function getUserInfo(req: Request, res: Response){
    try{
        const userId = req.body.data.id;
        const rows = await db(`SELECT
         id, name, phone, schoolgrade, schoolclass, schoolnumber, birth, year, email, role 
         FROM user WHERE id=?`, [userId]);

        if(!rows[0]) return res.status(400).send({success: false});

        const data = JSON.parse(JSON.stringify(rows[0]));
        data.birth = formatDate(data.birth);

        res.json({success: true,
        data : data});

    } catch(error){
        res.status(500).send({success: false});
    }
}

async function updateUserInfo(req: Request, res: Response){
    try{
        const userId = req.body.data.id;
        const {
            phone,
            schoolgrade,
            schoolclass,
            schoolnumber,
            year,
            email,
            birth
        } = infoScheme.validateSync(req.body);
        const check = await db('SELECT id FROM user WHERE id=?', [userId]);

        if(!check[0]) return res.status(400).send({success: false});


        await db(`UPDATE user SET phone=?, schoolgrade=?, schoolclass=?, schoolnumber=?, year=?, email=?, birth=? WHERE id=?`
        ,[phone, schoolgrade, schoolclass, schoolnumber, year, email, birth, userId]);

        const rows = await db('SELECT * FROM user WHERE id=?', [userId]);
        const data = {
            id: rows[0].id,
            schoolgrade: rows[0].schoolgrade,
            schoolclass: rows[0].schoolclass,
            schoolnumber: rows[0].schoolnumber,
            role: rows[0].role,
            year: rows[0].year,
            name: rows[0].name
        };

        const token = await tokens.createTokens(data)

        res.json({
            success: true,
            token : token
        })

    } catch(error){
        console.log(error);
        res.status(500).send({success: false});
    }
}

async function imageUpload(req: MulterRequest, res: Response) {
    var userId = req.body.data.id;
    profile_img(req, res, async function (err) {
        if (err) {
            return res.status(400).send({
                success: false,
            });
        } else {
            try {
                var filename = req.file.filename;
                const rows = await db("SELECT path FROM imagepath WHERE id=?", [
                    userId,
                ]);

                if (rows[0]) {
                    fs.unlink(
                        PROFILE_PATH + rows[0].path,
                        async function (err) {
                            await db("UPDATE imagepath SET path=? WHERE id=?", [
                                filename,
                                userId,
                            ]);
                        }
                    );
                } else {
                    await db("INSERT INTO imagepath VALUES (?, ?)", [
                        userId,
                        filename,
                    ]);
                }

                res.send({ success: true });
            } catch (error) {
                res.status(500).send({ success: false });
            }
        }
    });
}

async function showImage(req: Request, res: Response) {
    try {
        const userId = req.query.id;
        const rows = await db("SELECT path FROM imagepath WHERE id=?", [
            userId,
        ]);

        var filepath = "";

        if (rows[0]) {
            filepath = rows[0].path;
            res.json({ success: true, path: "/img/profile/" + filepath });
        } else {
            res.status(204).json({ success: true });
        }
    } catch (error) {
        res.status(500).send({ success: false });
    }
}

async function deleteImage(req: Request, res: Response) {
    try {
        const userId = req.body.data.id;

        const rows = await db("SELECT path FROM imagepath WHERE id=?", [
            userId,
        ]);

        if (rows[0]) {
            fs.unlink(PROFILE_PATH + rows[0].path, async function (err) {
                await db("DELETE FROM imagepath WHERE id=?", [userId]);
                return res.json({ success: true });
            });
        } else {
            res.status(400).send({ success: false });
        }
    } catch (error) {
        res.status(500).send({ success: false });
    }
}
export { getUserInfo, updateUserInfo, imageUpload, showImage, deleteImage };
// const router = Router();
// router.post("/profile", tokens.validTokenCheck, imageUpload);
// router.get("/profile", showImage);
// router.delete("/profile", tokens.validTokenCheck, deleteImage);

// export default router;
