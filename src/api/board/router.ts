import { Router } from "express";
import tokens from "../common/token";
import {
  deleteBoard,
  insertBoard,
  readAllBoard,
  readOneBoard,
  searchBoard,
  updateBoard,
  myReplyBoard,
} from "./board";
import { goodBoard, goodCount } from "./good";
import { readScrapBoard, scrapBoard, scrapCount } from "./scrap";
import { reportBoard, getReportById, countReportById } from "./report";

const router = Router();
// 게시글 좋아요
router.get("/good/:id", tokens.loginCheck, goodBoard);
router.get("/goodcount/:id", goodCount);

// 게시글 스크랩
router.get("/scrap", tokens.loginCheck, readScrapBoard);
router.get("/scrap/:id", tokens.loginCheck, scrapBoard);
router.get("/scrapcount/:id", scrapCount);

//내가 단 댓글 게시글 조회
router.get("/myreply", tokens.loginCheck, myReplyBoard);

//신고기능
router.post("/report", tokens.loginCheck, reportBoard);
router.get("/report", tokens.loginCheck, getReportById);
router.get("/report/count", tokens.loginCheck, countReportById);

// 게시글 CRUD
router.post("/", tokens.loginCheck, insertBoard);
router.get("/search", searchBoard);
router.get("/", readAllBoard);
router.get("/:id", tokens.loginStatusCheck, readOneBoard);
router.put("/:id", tokens.loginCheck, updateBoard);
router.delete("/:id", tokens.loginCheck, deleteBoard);

export default router;
