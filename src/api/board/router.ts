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
import { reportBoard, getReportById } from "./report";

const router = Router();
// 게시글 좋아요
router.get("/good/:id", tokens.validTokenCheck, goodBoard);
router.get("/goodcount/:id", goodCount);

// 게시글 스크랩
router.get("/scrap", tokens.validTokenCheck, readScrapBoard);
router.get("/scrap/:id", tokens.validTokenCheck, scrapBoard);
router.get("/scrapcount/:id", scrapCount);

//내가 단 댓글 게시글 조회
router.get("/myreply", tokens.validTokenCheck, myReplyBoard);

// 게시글 CRUD
router.post("/", tokens.validTokenCheck, insertBoard);
router.get("/search", searchBoard);
router.get("/", readAllBoard);
router.get("/:id", tokens.loginCheck, readOneBoard);
router.put("/:id", tokens.validTokenCheck, updateBoard);
router.delete("/:id", tokens.validTokenCheck, deleteBoard);

//신고기능
router.post("/report", tokens.validTokenCheck, reportBoard);
router.get("/report", tokens.loginCheck, getReportById);

export default router;
