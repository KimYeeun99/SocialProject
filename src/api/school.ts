import { Router, Response, Request } from "express";
import Neis from "@my-school.info/neis-api";

const neis = new Neis({
  KEY: process.env.NEIS_KEY,
  Type: "json",
});

async function getCafeteria(req: Request, res: Response) {
  try {
    const school = await neis.getSchoolInfo({
      SCHUL_NM: "상명고등학교",
    });

    const mealInfo = await neis.getMealInfo({
      ATPT_OFCDC_SC_CODE: school[0].ATPT_OFCDC_SC_CODE,
      SD_SCHUL_CODE: school[0].SD_SCHUL_CODE,
      MLSV_YMD: req.query.day as string,
    });

    const day_meal = {
      MLSV_YMD: mealInfo[0].MLSV_YMD,
      DDISH_NM: mealInfo[0].DDISH_NM,
      ORPLC_INFO: mealInfo[0].ORPLC_INFO,
      CAL_INFO: mealInfo[0].CAL_INFO,
    };

    res.send({ day_meal, success: true });
  } catch (error) {
    res.status(500).send({ error: error.message, success: false });
  }
}

async function getClass(req: Request, res: Response) {
  try {
    const school = await neis.getSchoolInfo({
      SCHUL_NM: "상명고등학교",
    });

    const timetable = await neis.getTimetable(
      {
        ATPT_OFCDC_SC_CODE: school[0].ATPT_OFCDC_SC_CODE,
        SD_SCHUL_CODE: school[0].SD_SCHUL_CODE,
      },
      {
        TI_FROM_YMD: req.body.TI_FROM_YMD,
        TI_TO_YMD: req.body.TI_TO_YMD,
        GRADE: req.body.GRADE,
        CLASS_NM: req.body.CLASS_NM,
      }
    );

    res.send({ timetable, success: true });
  } catch (error) {
    res.status(500).send({ error: error.message, success: false });
  }
}

async function getSchedule(req: Request, res: Response) {
  try {
    const school = await neis.getSchoolInfo({
      SCHUL_NM: "상명고등학교",
    });

    const schedule = await neis.getSchedule({
      ATPT_OFCDC_SC_CODE: school[0].ATPT_OFCDC_SC_CODE,
      SD_SCHUL_CODE: school[0].SD_SCHUL_CODE,
      AA_YMD: req.body.AA_YMD,
    });

    res.send({ schedule, success: true });
  } catch (error) {
    res.status(500).send({ error: error.message, success: false });
  }
}

const router = Router();
router.get("/cafeteria", getCafeteria);
router.get("/class", getClass);
router.get("/schedule", getSchedule);

export default router;
