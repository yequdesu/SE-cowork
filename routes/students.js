const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /students - 获取所有学生列表
router.get('/students', async (req, res) => {
    try {
        const connection = await db.getConnection();

        const [students] = await connection.execute(
            'SELECT student_id, name, major, total_score, roll_call_count FROM students ORDER BY student_id'
        );

        connection.release();

        res.json({
            success: true,
            students: students
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// POST /students - 添加新学生
router.post('/students', async (req, res) => {
    try {
        const { student_id, name, major } = req.body;

        if (!student_id || !name || !major) {
            return res.status(400).json({
                success: false,
                message: '学号、姓名和专业都是必填项'
            });
        }

        const connection = await db.getConnection();

        // 检查学号是否已存在
        const [existing] = await connection.execute(
            'SELECT student_id FROM students WHERE student_id = ?',
            [student_id]
        );

        if (existing.length > 0) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: '学号已存在'
            });
        }

        // 插入新学生
        await connection.execute(
            'INSERT INTO students (student_id, name, major, total_score, roll_call_count) VALUES (?, ?, ?, 0, 0)',
            [student_id, name, major]
        );

        connection.release();

        console.log('学生添加成功: 学号=%s, 姓名=%s, 专业=%s', student_id, name, major);

        res.json({
            success: true,
            message: '学生添加成功'
        });
    } catch (error) {
        console.error(error);
        console.log('学生添加失败: %s', error.message);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// PUT /students/:student_id - 修改学生信息
router.put('/students/:student_id', async (req, res) => {
    try {
        const { student_id } = req.params;
        const { name, major } = req.body;

        if (!name || !major) {
            return res.status(400).json({
                success: false,
                message: '姓名和专业都是必填项'
            });
        }

        const connection = await db.getConnection();

        // 检查学生是否存在
        const [existing] = await connection.execute(
            'SELECT student_id FROM students WHERE student_id = ?',
            [student_id]
        );

        if (existing.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: '学生不存在'
            });
        }

        // 更新学生信息
        await connection.execute(
            'UPDATE students SET name = ?, major = ? WHERE student_id = ?',
            [name, major, student_id]
        );

        connection.release();

        console.log('学生信息修改成功: 学号=%s, 新姓名=%s, 新专业=%s', student_id, name, major);

        res.json({
            success: true,
            message: '学生信息修改成功'
        });
    } catch (error) {
        console.error(error);
        console.log('学生信息修改失败: %s', error.message);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// DELETE /students/:student_id - 删除学生
router.delete('/students/:student_id', async (req, res) => {
    try {
        const { student_id } = req.params;

        const connection = await db.getConnection();

        // 检查学生是否存在
        const [existing] = await connection.execute(
            'SELECT student_id FROM students WHERE student_id = ?',
            [student_id]
        );

        if (existing.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: '学生不存在'
            });
        }

        // 先删除该学生在roll_calls表中的所有记录
        await connection.execute(
            'DELETE FROM roll_calls WHERE student_id = ?',
            [student_id]
        );

        // 删除学生
        await connection.execute(
            'DELETE FROM students WHERE student_id = ?',
            [student_id]
        );

        connection.release();

        console.log('学生删除成功: 学号=%s', student_id);

        res.json({
            success: true,
            message: '学生删除成功'
        });
    } catch (error) {
        console.error(error);
        console.log('学生删除失败: %s', error.message);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

module.exports = router;