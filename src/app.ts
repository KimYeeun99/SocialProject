import express from "express";
import { db } from "./db/db";
import user from "./api/user/router";
import board from "./api/board/router";
import reply from "./api/reply/router";
import school from "./api/school/router";
import token from "./api/common/token";
import "dotenv/config";

const app = express();

app.set("port", process.env.PORT || 3000);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
    const rows = await db("SELECT * FROM user", []);
    const user1 = rows[0].id;
    console.log(user1);
    res.send(rows);
});

app.use(express.static("public"));
app.use("/api/user", user);
app.use("/api/board", board);
app.use("/api/reply", reply);
app.use("/api/school", school);


// 토큰 인증
app.get("/api/auth/refresh", token.refreshRegen);
app.get("/api/auth/valid", token.tokenValid);

app.listen(app.get("port"), () => {
    console.log("start");
});

module.exports = app;
