import { Router } from "express";
import tokens from "../common/token";
import { login, logout, userOut } from "./login";
import { deleteImage, imageUpload, showImage } from "./profile";
import { confirmDupName, register } from "./register";
import { controleRole } from "./role";

const router = Router();

router.post("/login", login);
router.post("/logout", tokens.validTokenCheck, logout);
router.delete("/quit", tokens.validTokenCheck, userOut);

router.post("/profile", tokens.validTokenCheck, imageUpload);
router.get("/profile", showImage);
router.delete("/profile", tokens.validTokenCheck, deleteImage);

router.post("/register", register);
router.post("/confirm/name", confirmDupName);

router.put("/update/role", tokens.loginCheck, controleRole);
export default router;
