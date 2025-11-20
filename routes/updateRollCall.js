const express = require('express');
const db = require('../db');

const router = express.Router();

// 更新点名积分
router.post('/updateRollCall', async (req, res) => {
    try {
        const { studentId, score } = req.body;

        // 验证参数
        if (!studentId || typeof score !== 'number') {
            return res.status(400).json({ error: '参数无效' });
        }

        const connection = await db.getConnection();

        // 更新学生积分和点名次数
        const [result] = await connection.execute(
            'UPDATE students SET total_score = ?, roll_call_count = roll_call_count + 1 WHERE student_id = ?',
            [score, studentId]
        );

        connection.release();

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: '学生不存在' });
        }

        res.json({
            success: true,
            message: '积分更新成功'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;