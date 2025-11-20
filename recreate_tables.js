const fs = require('fs');
const db = require('./db');

async function recreateTables() {
    try {
        // 先删除现有表（注意外键约束顺序）
        console.log('Dropping existing tables...');
        await db.execute('DROP TABLE IF EXISTS roll_calls');
        console.log('Dropped roll_calls table');
        await db.execute('DROP TABLE IF EXISTS students');
        console.log('Dropped students table');

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