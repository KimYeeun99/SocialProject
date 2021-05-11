import express, { Request, Response, NextFunction } from "express";
import { db } from "./db/db";
import user from "./api/user";
import board from "./api/board";
import reply from "./api/reply";
import cafeteria from "./api/cafeteria";
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

app.use("/api/user", user);
app.use("/api/board", board);
app.use("/api/reply", reply);
app.use("/api/cafeteria", cafeteria);

app.get("/api/token/refresh", token.refreshRegen);

app.listen(app.get("port"), () => {
  console.log("start");
});

module.exports = app;
