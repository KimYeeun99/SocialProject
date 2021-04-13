import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { db } from "./db/db";
import user from "./api/user";
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

app.use("/api", user);

app.listen(app.get("port"), () => {
  console.log("start");
});

module.exports = app;
