import { Router, Response, Request } from "express";
import * as yup from "yup";
import { db } from "../db/db";
import tokens from "./token";
import argon2 from "argon2";

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
      const token = await tokens.createTokens(id);
      res.send({
        success: true,
        token: token,
      });
    } else {
      res.status(400).send({ success: false });
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
    const rows = await db("DELETE FROM user WHERE id=?", [req.body.id]);
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

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.delete("/quit", userOut);
router.post("/confirm/name", confirmDupName);
router.post("/confirm/nickname", confirmDupNickname);

export default router;
