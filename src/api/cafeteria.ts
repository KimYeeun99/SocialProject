import { Router, Response, Request } from "express";
import Neis from "@my-school.info/neis-api";

const neis = new Neis({
  KEY: process.env.NEIS_KEY,
  Type: "json",
});

async function test(req: Request, res: Response) {
  const school = await neis.getSchoolInfo({
    SCHUL_NM: "상명고등학교",
  });

  const mealInfo = await neis.getMealInfo({
    ATPT_OFCDC_SC_CODE: school[0].ATPT_OFCDC_SC_CODE,
    SD_SCHUL_CODE: school[0].SD_SCHUL_CODE,
    MLSV_YMD: req.body.day,
  });

  mealInfo.forEach((value) => {});

  res.send(mealInfo);
}

const router = Router();
router.post("/", test);

export default router;
