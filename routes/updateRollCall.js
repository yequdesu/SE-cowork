const express = require('express');
const db = require('../db');

const router = express.Router();

// 更新点名积分
router.post('/updateRollCall', async (req, res) => {
    console.log('[DEBUG] /updateRollCall: 开始更新点名积分');
    try {
        const { studentId, score, course_id } = req.body;
        console.log('[DEBUG] /updateRollCall: 请求参数 - studentId:', studentId, 'score:', score, 'course_id:', course_id);

        // 验证参数
        if (!studentId || typeof score !== 'number' || !course_id) {
            console.log('[DEBUG] /updateRollCall: 参数无效');
            return res.status(400).json({ error: '参数无效' });
        }

        const connection = await db.getConnection();
        console.log('[DEBUG] /updateRollCall: 数据库连接成功');

        // 更新学生积分和点名次数
        const updateQuery = 'UPDATE students SET total_score = ?, roll_call_count = roll_call_count + 1 WHERE student_id = ? AND course_id = ?';
        console.log('[DEBUG] /updateRollCall: 执行更新查询:', updateQuery, '参数:', [score, studentId, course_id]);
        const [result] = await connection.execute(updateQuery, [score, studentId, course_id]);
        console.log('[DEBUG] /updateRollCall: 更新结果 affectedRows:', result.affectedRows);

        connection.release();

        if (result.affectedRows === 0) {
            console.log('[DEBUG] /updateRollCall: 学生不存在');
            return res.status(404).json({ error: '学生不存在' });
        }

        console.log('[DEBUG] /updateRollCall: 积分更新成功');
        res.json({
            success: true,
            message: '积分更新成功'
        });
    } catch (error) {
        console.error('[DEBUG] /updateRollCall: 服务器错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;