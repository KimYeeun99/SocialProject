import { Router, Response, Request } from "express";
import Neis from "@my-school.info/neis-api";
import { resolve } from "path";
import moment from "moment";

const neis = new Neis({
    KEY: process.env.NEIS_KEY,
    Type: "json",
});

const weekOfMonth = (m) => m.week() - moment(m).startOf("month").week() + 1;
const nowDate = moment().utc(true);

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
            var year = value.MLSV_YMD.substr(0, 4);
            var month = value.MLSV_YMD.substr(4, 2);
            var day = value.MLSV_YMD.substr(6, 2);

            const data = {
                year: year,
                month: month,
                day: day,
                dish: dish,
                cal_info: value.CAL_INFO,
            };
            mealInfo.push(data);
        });

        //MLSV_YMD, DDISH_NM, CAL_INFO

        res.send({ mealInfo, success: true });
    } catch (error) {
        res.status(500).send({ error: error.message, success: false });
    }
}

async function getMonthCafeteria(req: Request, res: Response) {
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

        const mealInfo = {
            1: [],
            2: [],
            3: [],
            4: [],
            5: [],
        };

        rows.forEach((value) => {
            const dish = value.DDISH_NM.split("<br/>");
            var year = value.MLSV_YMD.substr(0, 4);
            var month = value.MLSV_YMD.substr(4, 2);
            var day = value.MLSV_YMD.substr(6, 2);

            const data = {
                year: year,
                month: month,
                day: day,
                dish: dish,
                cal_info: value.CAL_INFO,
            };

            mealInfo[weekOfMonth(moment(value.MLSV_YMD))].push(data);
        });

        res.send({ mealInfo, success: true });
    } catch (error) {
        res.status(500).send({ error: error.message, success: false });
    }
}

export { getCafeteria, getMonthCafeteria };
