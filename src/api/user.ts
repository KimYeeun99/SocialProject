import { Router, Response, Request } from "express";
import * as yup from "yup";
import { db } from "../db/db";
import tokens from "./token";
import argon2 from "argon2";
import multer from "multer";
import fs from "fs";

const STORAGE_PATH = "public/img/";

var storage = multer.diskStorage({
  destination : function(req, file, cb) {
    cb(null, STORAGE_PATH);
  },
  filename : function(req, file, cb) {
    req.body.filename = file.fieldname + '-' + Date.now() + '.jpg';
    cb(null, req.body.filename);
  }
})

var upload = multer({storage : storage});

export const registerScheme = yup.object({
  id: yup.string().required(),
  password: yup.string().required(),
  name: yup.string().required(),
  nickname: yup.string().required(),
  birth: yup.date().required(),
  phone: yup.string().required(),
  schoolgrade: yup.number().required(),
  schoolclass: yup.number().required(),
});

async function register(req: Request, res: Response) {
  try {
    const {
      id,
      password,
      name,
      phone,
      nickname,
      birth,
      schoolgrade,
      schoolclass,
    } = registerScheme.validateSync(req.body);
    const search = await db("SELECT id FROM user WHERE id=?", [id]);

    const hashPassword = await argon2.hash(password);
    if (!search[0]) {
      const rows = await db(
        "INSERT INTO user(id, password, name, phone, nickname, birth, schoolgrade, schoolclass) VALUES(?,?,?,?,?,?,?,?)",
        [
          id,
          hashPassword,
          name,
          phone,
          nickname,
          birth,
          schoolgrade,
          schoolclass,
        ]
      );
      res.send({ success: true });
    } else {
      res.status(400).send({ success: false });
    }
  } catch (error) {
    res.status(500).send({ success: false });
  }
}

export const loginScheme = yup.object({
  id: yup.string().required(),
  password: yup.string().required(),
});

async function login(req: Request, res: Response) {
  try {
    const { id, password } = loginScheme.validateSync(req.body);
    const rows = await db("SELECT * FROM user WHERE id=?", [id]);
    if (!rows[0]) res.status(400).send({ success: false });
    else if (await argon2.verify(rows[0].password, password)) {
      const data = {
        id: rows[0].id,
        schoolgrade : rows[0].schoolgrade,
        schoolclass : rows[0].schoolclass
      }

      const token = await tokens.createTokens(data);
      
      res.send({
        success: true,
        token: token,
      });
    } else {
      res.send({ success: false });
    }
  } catch (error) {
    res.status(500).send({ success: false });
  }
}

async function logout(req: Request, res: Response) {
  tokens.deleteTokens(req, res);
  req.session.destroy((err) => {
    if (err) throw err;
  });
  res.send({ success: true });
}

async function userOut(req: Request, res: Response) {
  try {
    const rows = await db("DELETE FROM user WHERE id=?", [req.body.data.id]);
    res.send({ success: true });
  } catch (error) {
    res.status(500).send({ success: false });
  }
}

async function confirmDupName(req: Request, res: Response) {
  try {
    const search = await db("SELECT id FROM user WHERE id=?", [req.body.id]);
    if (!search[0]) {
      res.status(400).send({ success: false });
    } else {
      res.send({ success: true });
    }
  } catch (error) {
    res.status(500).send({ success: false });
  }
}

async function confirmDupNickname(req: Request, res: Response) {
  try {
    const search = await db("SELECT nickname FROM user WHERE nickname=?", [
      req.body.nickname,
    ]);
    if (!search[0]) {
      res.status(400).send({ success: false });
    }
    res.send({ success: true });
  } catch (error) {
    res.status(500).send({ success: false });
  }
}

async function imageUpload(req: Request, res: Response){
  try{
    var userId = req.body.data.id;
    var filename = req.body.filename;
    const rows = await db('SELECT path FROM imagepath WHERE id=?', [userId]);

    if(rows[0]){
      fs.unlink(STORAGE_PATH + rows[0].path, async function(err){
        await db('UPDATE imagepath SET path=? WHERE id=?', [filename, userId]);
      });
    } else{
      await db('INSERT INTO imagepath VALUES (?, ?)', [userId, filename]);
    }

    res.send({success: true, filename : req.body.filename});
  } catch(error){
    fs.unlink(STORAGE_PATH + req.body.filename, function(err){
      res.status(500).send({success: false});
    });
    
  }
}

async function showImage(req: Request, res: Response){
  try{
    const rows = await db('SELECT path FROM imagepath WHERE id=?', [req.body.data.id]);
    
    var filepath = '';

    if(rows[0]){
      filepath = rows[0].path;
      res.redirect('/img/' + filepath);
    } else{
      res.status(204).json({success: true});
    }
  } catch(error){
    res.status(500).send({success: false});
  }
}

async function deleteImage(req: Request, res: Response){
  try{
    const userId = req.body.data.id;

    const rows = await db('SELECT path FROM imagepath WHERE id=?', [userId]);

    if(rows[0]){
      fs.unlink(STORAGE_PATH + rows[0].path, async function(err){   
        await db('DELETE FROM imagepath WHERE id=?', [userId]);    
        return res.json({success: true});
      })
    } else{
      res.status(400).send({success: false});
    }
    
  } catch(error){
    res.status(500).send({success: false});
  }
}

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", tokens.validTokenCheck, logout);
router.delete("/quit", tokens.validTokenCheck, userOut);
router.post("/confirm/name", confirmDupName);
router.post("/confirm/nickname", confirmDupNickname);

router.post("/profile", upload.single('profile'), tokens.validTokenCheck, imageUpload);
router.get("/profile", tokens.validTokenCheck, showImage);
router.delete("/profile", tokens.validTokenCheck, deleteImage);

export default router;
