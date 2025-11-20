const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const db = require('../db');

const router = express.Router();

// 配置multer用于文件上传
const upload = multer({ dest: 'uploads/' });

// POST /importStudents - 导入学生名单
router.post('/importStudents', upload.single('file'), async (req, res) => {
    try {
        const { course_id } = req.body;

        if (!course_id) {
            return res.status(400).json({ error: 'course_id参数是必填项' });
        }

        if (!req.file) {
            return res.status(400).json({ error: '未提供文件' });
        }

        console.log('Uploaded file:', req.file); // 调试信息

        // 读取Excel文件
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // 转换为JSON
        const data = xlsx.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ error: 'Excel文件为空或格式不正确' });
        }

        // 验证列是否存在
        const firstRow = data[0];
        if (!firstRow.学号 || !firstRow.姓名 || !firstRow.专业) {
            return res.status(400).json({ error: 'Excel文件必须包含学号、姓名、专业列' });
        }

        const connection = await db.getConnection();
        let insertedCount = 0;
        let skippedCount = 0;

        for (const row of data) {
            const studentId = row.学号?.toString().trim();
            const name = row.姓名?.toString().trim();
            const major = row.专业?.toString().trim();

            if (!studentId || !name || !major) {
                continue; // 跳过无效行
            }

            // 插入或更新学生信息，确保学生在指定课程中
            const result = await connection.execute(
                'INSERT INTO students (student_id, name, major, course_id, total_score, roll_call_count) VALUES (?, ?, ?, ?, 0, 0) ON DUPLICATE KEY UPDATE name = VALUES(name), major = VALUES(major), course_id = VALUES(course_id)',
                [studentId, name, major, course_id]
            );
            insertedCount++;
        }

        connection.release();

        res.json({
            success: true,
            message: '导入完成',
            inserted: insertedCount,
            skipped: skippedCount
        });

        // 清理临时文件
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('删除临时文件失败:', err);
            });
        }

    } catch (error) {
        console.error('导入学生名单失败:', error);

        // 清理临时文件
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('删除临时文件失败:', err);
            });
        }

        res.status(500).json({ error: '服务器内部错误' });
    }
});

module.exports = router;