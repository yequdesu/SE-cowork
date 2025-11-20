const express = require('express');
const db = require('../db');
const XLSX = require('xlsx');

const router = express.Router();

// GET /exportScores - 导出积分详单
router.get('/exportScores', async (req, res) => {
    try {
        const connection = await db.getConnection();

        // 查询所有学生数据：学号、姓名、专业、随机点名次数、总积分
        const [students] = await connection.execute(
            'SELECT student_id, name, major, roll_call_count, total_score FROM students'
        );

        connection.release();

        // 生成Excel文件
        const ws = XLSX.utils.json_to_sheet(students);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '积分详单');

        // 生成包含时间戳的文件名
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `scores_${timestamp}.xlsx`;

        // 设置响应头为下载
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        // 写入Excel到响应
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;