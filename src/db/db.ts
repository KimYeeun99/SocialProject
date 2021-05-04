import mysql from "mysql2/promise";
import { config } from "./config";

async function db(sql, params) {
    try {
        const connection = await mysql.createConnection(config);
        const [rows, fields] = await connection.execute(sql, params);
        return rows;
    } catch (error) {
        throw error;
    }
}

export { db };
