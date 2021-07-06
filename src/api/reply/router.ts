import { Router } from "express";
import tokens from "../common/token";
import {
    deleteReply,
    updateReply,
    replyCount,
    readAllReply,
    insertSubReply,
    insertReply,
} from "./reply";
import { goodCount, goodReply } from "./good";

const router = Router();

//댓글 좋아요
router.get("/goodcount/:replyid", goodCount);
router.get("/good/:replyid", tokens.validTokenCheck, goodReply);

//댓글 갯수
router.get("/replycount/:boardid", replyCount);

// 댓글 CRUD
router.post("/:boardid", tokens.validTokenCheck, insertReply);
router.post("/:boardid/:replyid", tokens.validTokenCheck, insertSubReply);
router.get("/:boardid", tokens.loginCheck, readAllReply);
router.put("/:boardid/:replyid", tokens.validTokenCheck, updateReply);
router.delete("/:boardid/:replyid", tokens.validTokenCheck, deleteReply);

export default router;
