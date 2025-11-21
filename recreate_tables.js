const fs = require('fs');
const db = require('./db');

async function recreateTables() {
    try {
        // 禁用外键检查
        console.log('Disabling foreign key checks...');
        await db.execute('SET FOREIGN_KEY_CHECKS = 0');

        // 删除现有表
        console.log('Dropping existing tables...');
        await db.execute('DROP TABLE IF EXISTS scores');
        console.log('Dropped scores table');
        await db.execute('DROP TABLE IF EXISTS roll_calls');
        console.log('Dropped roll_calls table');
        await db.execute('DROP TABLE IF EXISTS students');
        console.log('Dropped students table');
        await db.execute('DROP TABLE IF EXISTS courses');
        console.log('Dropped courses table');

        // 重新启用外键检查
        await db.execute('SET FOREIGN_KEY_CHECKS = 1');

        // 读取并执行setup.sql
        console.log('Reading setup.sql...');
        const sql = fs.readFileSync('setup.sql', 'utf8');
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

        console.log('Executing setup.sql statements...');
        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.trim());
                await db.execute(statement);
            }
        }

        console.log('Database tables recreated successfully with UTF-8 encoding');
    } catch (error) {
        console.error('Error recreating database tables:', error);
    } finally {
        process.exit();
    }
}

recreateTables();