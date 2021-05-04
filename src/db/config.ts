import "dotenv/config";

const config = {
    /* don't expose password or any sensitive info, done only for demo */
    host: process.env.DB_HOST,
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

export { config };
