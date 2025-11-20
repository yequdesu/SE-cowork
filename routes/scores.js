const express = require('express');
const db = require('../db');

const router = express.Router();

// 获取积分排名
router.get('/scores', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        // 验证limit参数
        if (limit <= 0 || limit > 100) {
            return res.status(400).json({ error: 'limit参数必须是1-100之间的整数' });
        }

        const connection = await db.getConnection();

        // 查询积分最高的limit名学生
        const [students] = await connection.execute(
            'SELECT student_id, name, major, total_score, roll_call_count FROM students ORDER BY total_score DESC LIMIT ?',
            [limit]
        );

        connection.release();

        // 格式化数据为适合前端可视化的格式
        const formattedData = students.map(student => ({
            studentId: student.student_id,
            name: student.name,
            major: student.major,
            score: parseFloat(student.total_score),
            rollCallCount: student.roll_call_count,
            // 为可视化添加标签和值
            label: student.name,
            value: parseFloat(student.total_score)
        }));

        res.json({
            success: true,
            data: formattedData,
            count: formattedData.length
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;