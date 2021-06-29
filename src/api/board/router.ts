import { Router } from "express";
import tokens from "../common/token";
import {
    deleteBoard,
    insertBoard,
    readAllBoard,
    readOneBoard,
    searchBoard,
    updateBoard,
} from "./board";
import { goodBoard, goodCount } from "./good";
import { readScrapBoard, scrapBoard, scrapCount } from "./scrap";

const router = Router();

// 게시글 CRUD
router.post("/", tokens.validTokenCheck, insertBoard);
router.get("/search", searchBoard);
router.get("/", readAllBoard);
router.get("/:id", readOneBoard);
router.put("/:id", tokens.validTokenCheck, updateBoard);
router.delete("/:id", tokens.validTokenCheck, deleteBoard);

// 게시글 좋아요
router.get("/good/:id", tokens.validTokenCheck, goodBoard);
router.get("/goodcount/:id", goodCount);

// 게시글 스크랩
router.get("/scrap", tokens.validTokenCheck, readScrapBoard);
router.get("/scrap/:id", tokens.validTokenCheck, scrapBoard);
router.get("/scrapcount/:id", scrapCount);

export default router;
