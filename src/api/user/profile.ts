import { Response, Request } from "express";
import { db } from "../../db/db";
import fs from "fs";
import { profile_img } from "../common/upload";
import { PROFILE_PATH } from "../common/upload";
import { MulterRequest } from "../common/upload";

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
export { imageUpload, showImage, deleteImage };
// const router = Router();
// router.post("/profile", tokens.validTokenCheck, imageUpload);
// router.get("/profile", showImage);
// router.delete("/profile", tokens.validTokenCheck, deleteImage);

// export default router;
