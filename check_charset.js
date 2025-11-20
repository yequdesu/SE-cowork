const promisePool = require('./db');

async function checkCharset() {
    try {
        // 查询数据库默认字符集
        const [dbCharset] = await promisePool.query("SHOW VARIABLES LIKE 'character_set_database'");
        console.log('数据库默认字符集:', dbCharset[0].Value);

        // 查询students表字符集
        const [studentsStatus] = await promisePool.query("SHOW TABLE STATUS LIKE 'students'");
        console.log('students表字符集:', studentsStatus[0].Collation);

        // 查询roll_calls表字符集
        const [rollCallsStatus] = await promisePool.query("SHOW TABLE STATUS LIKE 'roll_calls'");
        console.log('roll_calls表字符集:', rollCallsStatus[0].Collation);

    } catch (error) {
        console.error('查询失败:', error);
    } finally {
        process.exit();
    }
}

checkCharset();