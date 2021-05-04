const config = {
<<<<<<< HEAD
  /* don't expose password or any sensitive info, done only for demo */
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '1234',
  database: 'project'
=======
    /* don't expose password or any sensitive info, done only for demo */
    host: process.env.DB_HOST,
    port: 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
>>>>>>> upstream/master
};

export { config };
