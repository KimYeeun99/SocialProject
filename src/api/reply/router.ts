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
import {
    reportReply,
    getMyReplyReport,
    getReplyReportById,
    countReplyReportById,
    getReplyReport,
} from "./report";

const router = Router();

//댓글 좋아요
router.get("/goodcount/:replyid", goodCount);
router.get("/good/:replyid", tokens.loginCheck, goodReply);

//댓글 갯수
router.get("/replycount/:boardid", replyCount);

//댓글 신고 기능
router.post("/report", tokens.loginCheck, reportReply);
router.get("/report/me", tokens.loginCheck, getMyReplyReport);
router.get("/report/count", tokens.loginCheck, countReplyReportById);
router.get("/report", tokens.loginCheck, getReplyReportById);

router.get("/report/:page", tokens.loginCheck, getReplyReport);

// 댓글 CRUD
router.post("/:boardid", tokens.loginCheck, insertReply);
router.post("/:boardid/:replyid", tokens.loginCheck, insertSubReply);
router.get("/:boardid", tokens.loginStatusCheck, readAllReply);
router.put("/:boardid/:replyid", tokens.loginCheck, updateReply);
router.delete("/:boardid/:replyid", tokens.loginCheck, deleteReply);

export default router;
