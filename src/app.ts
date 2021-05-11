import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { db } from "./db/db";
import user from "./api/user";
import board from "./api/board";
import reply from "./api/reply";
<<<<<<< HEAD
import cafeteria from "./api/cafeteria";
=======
import token from "./api/token";
>>>>>>> a8c5fd3b3f2bb26404cfe2f7c365ae4d6e003217
import "dotenv/config";

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
  const rows = await db("SELECT * FROM user", []);
  const user1 = rows[0].id;
  console.log(user1);
  res.send(rows);
});

app.use("/api/user", user);
app.use("/api/board", board);
app.use("/api/reply", reply);
app.use("/api/", cafeteria);

app.get("/api/token/refresh", token.refreshRegen);

app.listen(app.get("port"), () => {
  console.log("start");
});

module.exports = app;
