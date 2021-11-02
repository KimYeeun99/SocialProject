import { Router } from "express";
import { createNotice, getNoticeList } from "./notice";
import token from "../common/token"

const router = Router();
router.post('/', token.loginCheck, createNotice);
router.get("/", token.loginCheck, getNoticeList);

export default router;