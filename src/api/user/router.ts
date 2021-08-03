import { Router } from "express";
import tokens from "../common/token";
import { login, logout, userOut } from "./login";
import { deleteImage, imageUpload, showImage } from "./profile";
import { confirmDupName, register } from "./register";
import { insertStudent, checkStudent, deleteStudent, getStudent } from "./auth";
import { controleRole } from "./role";
import { checkPassword, setPassword } from "./password";

const router = Router();

router.post("/login", login);
router.post("/logout", tokens.loginCheck, logout);
router.delete("/quit", tokens.loginCheck, userOut);

router.post("/profile", tokens.loginCheck, imageUpload);
router.get("/profile", showImage);
router.delete("/profile", tokens.loginCheck, deleteImage);

router.post("/register", register);
router.post("/confirm/name", confirmDupName);

router.put("/update/role", tokens.loginCheck, controleRole);

router.post("/auth/student", tokens.loginCheck, insertStudent);
router.get("/auth/student", tokens.loginCheck, getStudent);
router.delete("/auth/student", tokens.loginCheck, deleteStudent);

router.post("/auth/student/check", checkStudent);

router.post("/password/check", tokens.loginCheck, checkPassword);
router.post("/password/change", tokens.loginCheck, setPassword);

export default router;
