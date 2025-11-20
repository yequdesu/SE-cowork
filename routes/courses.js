const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /courses - 获取所有课程列表
router.get('/courses', async (req, res) => {
    try {
        const connection = await db.getConnection();

        const [courses] = await connection.execute(
            'SELECT id, name, description FROM courses ORDER BY id'
        );

        // 处理空白课程名称
        const processedCourses = courses.map(course => ({
            ...course,
            name: course.name || '未命名课程'
        }));

        connection.release();

        res.json({
            success: true,
            courses: processedCourses
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// POST /courses - 添加新课程
router.post('/courses', async (req, res) => {
    try {
        const { course_name, description } = req.body;

        if (!course_name) {
            return res.status(400).json({
                success: false,
                message: '课程名称是必填项'
            });
        }

        const connection = await db.getConnection();

        // 检查课程名称是否已存在
        const [existing] = await connection.execute(
            'SELECT id FROM courses WHERE name = ?',
            [course_name]
        );

        if (existing.length > 0) {
            connection.release();
            return res.status(400).json({
                success: false,
                message: '课程名称已存在'
            });
        }

        // 插入新课程
        await connection.execute(
            'INSERT INTO courses (name, description) VALUES (?, ?)',
            [course_name, description || '']
        );

        connection.release();

        console.log('课程添加成功: 名称=%s, 描述=%s', course_name, description);

        res.json({
            success: true,
            message: '课程添加成功'
        });
    } catch (error) {
        console.error(error);
        console.log('课程添加失败: %s', error.message);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// PUT /courses/:course_id - 修改课程信息
router.put('/courses/:course_id', async (req, res) => {
    try {
        const { course_id } = req.params;
        const { course_name, description } = req.body;

        if (!course_name) {
            return res.status(400).json({
                success: false,
                message: '课程名称是必填项'
            });
        }

        const connection = await db.getConnection();

        // 检查课程是否存在
        const [existing] = await connection.execute(
            'SELECT id FROM courses WHERE id = ?',
            [course_id]
        );

        if (existing.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: '课程不存在'
            });
        }

        // 更新课程信息
        await connection.execute(
            'UPDATE courses SET name = ?, description = ? WHERE id = ?',
            [course_name, description || '', course_id]
        );

        connection.release();

        console.log('课程信息修改成功: ID=%s, 新名称=%s, 新描述=%s', course_id, course_name, description);

        res.json({
            success: true,
            message: '课程信息修改成功'
        });
    } catch (error) {
        console.error(error);
        console.log('课程信息修改失败: %s', error.message);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// DELETE /courses/:course_id - 删除课程及其相关数据
router.delete('/courses/:course_id', async (req, res) => {
    try {
        const { course_id } = req.params;

        const connection = await db.getConnection();

        // 检查课程是否存在
        const [existing] = await connection.execute(
            'SELECT id FROM courses WHERE id = ?',
            [course_id]
        );

        if (existing.length === 0) {
            connection.release();
            return res.status(404).json({
                success: false,
                message: '课程不存在'
            });
        }

        // 开始事务
        await connection.beginTransaction();

        try {
            // 1. 删除该课程的点名记录
            await connection.execute(
                'DELETE FROM roll_calls WHERE course_id = ?',
                [course_id]
            );

            // 2. 获取该课程下的所有学生ID
            const [students] = await connection.execute(
                'SELECT student_id FROM students WHERE course_id = ?',
                [course_id]
            );

            const studentIds = students.map(s => s.student_id);

            if (studentIds.length > 0) {
                // 3. 删除这些学生的积分记录
                const placeholders = studentIds.map(() => '?').join(',');
                await connection.execute(
                    `DELETE FROM scores WHERE student_id IN (${placeholders})`,
                    studentIds
                );
            }

            // 4. 删除该课程下的所有学生
            await connection.execute(
                'DELETE FROM students WHERE course_id = ?',
                [course_id]
            );

            // 5. 删除课程
            await connection.execute(
                'DELETE FROM courses WHERE id = ?',
                [course_id]
            );

            // 提交事务
            await connection.commit();

            connection.release();

            console.log('课程删除成功: ID=%s, 级联删除了相关数据', course_id);

            res.json({
                success: true,
                message: '课程删除成功'
            });
        } catch (error) {
            // 回滚事务
            await connection.rollback();
            connection.release();
            throw error;
        }
    } catch (error) {
        console.error(error);
        console.log('课程删除失败: %s', error.message);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

module.exports = router;