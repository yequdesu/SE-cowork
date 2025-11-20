const express = require('express');
const db = require('../db');

const router = express.Router();

// 随机点名
router.get('/random', async (req, res) => {
    try {
        const connection = await db.getConnection();

        // 获取所有学生
        const [students] = await connection.execute('SELECT student_id, name, total_score FROM students');

        if (students.length === 0) {
            connection.release();
            return res.status(404).json({ error: '没有学生' });
        }

        // 计算权重
        const weights = students.map(s => 1 / (s.total_score + 1));
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        // 随机选择
        let random = Math.random() * totalWeight;
        let selectedIndex = 0;
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                selectedIndex = i;
                break;
            }
        }

        const selected = students[selectedIndex];

        // 记录点名
        await connection.execute('INSERT INTO roll_calls (student_id) VALUES (?)', [selected.student_id]);

        connection.release();

        res.json({ student_id: selected.student_id, name: selected.name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 顺序点名
router.get('/sequential', async (req, res) => {
    try {
        const connection = await db.getConnection();

        // 获取所有学生，按学号升序
        const [students] = await connection.execute('SELECT student_id, name FROM students ORDER BY student_id ASC');

        if (students.length === 0) {
            connection.release();
            return res.status(404).json({ error: '没有学生' });
        }

        // 获取最近的点名
        const [lastRollCall] = await connection.execute('SELECT student_id FROM roll_calls ORDER BY roll_call_time DESC LIMIT 1');

        let nextIndex = 0;
        if (lastRollCall.length > 0) {
            const lastStudentId = lastRollCall[0].student_id;
            const lastIndex = students.findIndex(s => s.student_id === lastStudentId);
            if (lastIndex !== -1) {
                nextIndex = (lastIndex + 1) % students.length;
            }
        }

        const selected = students[nextIndex];

        // 记录点名
        await connection.execute('INSERT INTO roll_calls (student_id) VALUES (?)', [selected.student_id]);

        connection.release();

        res.json({ student_id: selected.student_id, name: selected.name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;