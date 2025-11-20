const mysql = require('mysql2');

// 创建数据库连接池
const pool = mysql.createPool({
    host: 'sql12.freesqldatabase.com',
    user: 'sql12808614',
    password: 'Xb4nWhdNEg',
    database: 'sql12808614',
    port: 3306,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 导出连接池的promise版本
const promisePool = pool.promise();

module.exports = promisePool;