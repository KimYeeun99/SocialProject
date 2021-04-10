import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import { login } from "./login";
import { post } from "./post";
import path from "path";
import createError from "http-errors";
import session from "express-session";
import { Db } from "mongodb";
import mysql from "mysql";
import { db } from "./db/db";
import user from "./api/user";
import { User } from "./model/user";

const app = express();

app.set("port", process.env.PORT || 3000);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

declare module "express-session" {
  interface SessionData {
    userId: String;
    password: String;
    isLogedIn: boolean;
  }
}

app.use(
  session({
    secret: "asadlfkj!@#!@#dfgasdg",
    resave: false,
    saveUninitialized: true,
  })
);

app.get("/", async (req, res) => {
  console.log(req.body.id);
  const rows = await db("SELECT * FROM user WHERE id=?", [req.body.id]);
  const user1 = rows[0].id;
  console.log(user1);
  res.send(rows);
});

app.use("/api", user);

app.listen(app.get("port"), () => {
  console.log("start");
});

module.exports = app;
