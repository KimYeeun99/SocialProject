import { Router, Response, Request } from "express";
import * as yup from "yup";
import { db } from "../db/db";
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
      res.send({ msg: "회원가입 성공" });
    } else {
      res.status(400).send({ msg: "이미 존재하는 ID" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "에러" });
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
    if (!rows[0]) res.status(400).send("잘못된 ID입니다.");
    else if (await argon2.verify(rows[0].password, password)) {
      req.session.userId = id;
      req.session.password = password;
      req.session.isLogedIn = true;
      console.log({
        id: req.session.userId,
        password: req.session.password,
        logined: req.session.isLogedIn,
      });
      res.send("로그인 성공");
    } else {
      res.status(400).send("잘못된 Password입니다.");
    }
  } catch (error) {}
}

async function logout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) throw err;
  });
  res.send({ msg: "로그아웃 했습니다." });
}

async function userOut(req: Request, res: Response) {
  try {
    const rows = await db("DELETE FROM user WHERE id=?", [req.session.userId]);
    res.send({ msg: "탈퇴성공" });
  } catch (error) {
    res.status(500).send({ error: "탈퇴하는데 실패했습니다." });
  }
}

async function confirmDupName(req: Request, res: Response) {
  try {
    const search = await db("SELECT id FROM user WHERE id=?", [req.body.id]);
    if (!search[0]) {
      res.status(400).send({ success: false });
    }
    res.send({ success: true });
  } catch (error) {
    res.status(500).send({ error: "탈퇴하는데 실패했습니다." });
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
    res.status(500).send({ error: "탈퇴하는데 실패했습니다." });
  }
}

const router = Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.delete("/quit", userOut);
router.get("/confirm/name", confirmDupName);
router.get("/confirm/nickname", confirmDupNickname);

export default router;
