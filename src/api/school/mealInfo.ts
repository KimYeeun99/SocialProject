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

        const rows = await neis.getMealInfo({
            ATPT_OFCDC_SC_CODE: school[0].ATPT_OFCDC_SC_CODE,
            SD_SCHUL_CODE: school[0].SD_SCHUL_CODE,
            MLSV_FROM_YMD: req.query.MLSV_FROM_YMD as string, //시작 일자
            MLSV_TO_YMD: req.query.MLSV_TO_YMD as string, //종료 일자
        });

        const mealInfo = [];
        rows.forEach((value) => {
            const dish = value.DDISH_NM.split("<br/>");
            const data = {
                MLSV_YMD: value.MLSV_YMD,
                DDISH_NM: dish,
                CAL_INFO: value.CAL_INFO,
            };
            mealInfo.push(data);
        });

        //MLSV_YMD, DDISH_NM, CAL_INFO

        res.send({ mealInfo, success: true });
    } catch (error) {
        res.status(500).send({ error: error.message, success: false });
    }
}

export { getCafeteria };
