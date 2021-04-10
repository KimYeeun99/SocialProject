import { Router, Response, Request } from "express";
import * as yup from "yup";
import { db } from "../db/db";

export const registerScheme = yup.object({
  id: yup.string().required(),
  password: yup.string().required(),
  email: yup.string().required(),
  name: yup.string().required(),
  nickname: yup.string().required(),
  birth: yup.date().required(),
  phone: yup.string().required(),
});

async function register(req: Request, res: Response) {
  try {
    const {
      id,
      password,
      email,
      name,
      nickname,
      birth,
      phone,
    } = registerScheme.validateSync(req.body);
    const rows = await db(
      "INSERT INTO user(id, password, email, name, nickname, birth, phone) VALUES(?,?,?,?,?,?,?)",
      [id, password, email, name, nickname, birth, phone]
    );
    res.send(rows);
  } catch (error) {
    res.status(400).send({ error: "에러" });
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
    else if (rows[0].password === password) {
      res.send("로그인 성공");
    } else {
      res.status(400).send("잘못된 Password입니다.");
    }
  } catch (error) {}
}

const router = Router();
router.post("/register", register);
router.post("/login", login);
export default router;
