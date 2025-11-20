const db = require('./db');

async function verifyCharset() {
    try {
        console.log('Verifying table character sets...');

        // 检查students表
        const [studentsResult] = await db.execute('SHOW CREATE TABLE students');
        console.log('Students table CREATE statement:');
        console.log(studentsResult[0]['Create Table']);

        // 检查roll_calls表
        const [rollCallsResult] = await db.execute('SHOW CREATE TABLE roll_calls');
        console.log('\nRoll_calls table CREATE statement:');
        console.log(rollCallsResult[0]['Create Table']);

        console.log('\nCharacter set verification completed.');
    } catch (error) {
        console.error('Error verifying character sets:', error);
    } finally {
        process.exit();
    }
}

verifyCharset();