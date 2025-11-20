const fs = require('fs');
const db = require('./db');

async function setupDatabase() {
    try {
        const sql = fs.readFileSync('setup.sql', 'utf8');
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

        for (const statement of statements) {
            if (statement.trim()) {
                console.log('Executing:', statement.trim());
                await db.execute(statement);
            }
        }

        console.log('Database setup completed successfully');
    } catch (error) {
        console.error('Error setting up database:', error);
    } finally {
        process.exit();
    }
}

setupDatabase();