import express from "express";
import { db } from "./db/db";
import user from "./api/user/router";
import board from "./api/board/router";
import reply from "./api/reply/router";
import school from "./api/school/router";
import token from "./api/common/token";
import notice from "./api/notice/router";
import { insertDevice, deleteDevice } from "./api/common/device";
import "dotenv/config";
import { logger } from "./log/logger";

const app = express();

app.set("port", process.env.PORT || 3000);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));
app.use("/api/user", user);
app.use("/api/board", board);
app.use("/api/reply", reply);
app.use("/api/school", school);
app.use("/api/notice", notice);

// 토큰 인증
app.post("/api/auth/refresh", token.tokenRefresh);
app.get("/api/auth/valid", token.validCheck);

// 장치 등록
app.post("/api/device", token.loginCheck, insertDevice);
// 장치 삭제
app.delete("/api/device", token.loginCheck, deleteDevice);

app.listen(app.get("port"), () => {
    logger.info("SocialServer Start");
    console.log("start");
});

module.exports = app;
