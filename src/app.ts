import express, { Request, Response, NextFunction } from "express";
import { db } from "./db/db";
import user from "./api/user";
import board from "./api/board";
import reply from "./api/reply";
import cafeteria from "./api/school";
import token from "./api/token";
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
app.use("/api/school", cafeteria);

app.get("/api/auth/refresh", token.refreshRegen);
app.get("/api/auth/valid", token.tokenValid);

app.use(function(req, res, next){
  res.status(404).send({success: false});
})
app.listen(app.get("port"), () => {
  console.log("start");
});

export default app;
