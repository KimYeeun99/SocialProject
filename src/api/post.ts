import { Router, Response, Request } from "express";
import * as yup from "yup";
import { db } from "../db/db";

export const postScheme = yup.object({
  title: yup.string().required(),
  body: yup.string().required(),
});

async function insertPost(req: Request, res: Response) {}
