const express = require('express');
const db = require('../db');

const router = express.Router();

// 获取随机事件详细信息
function getRandomEventInfo(eventName) {
    const events = {
        '免扣分': {
            name: '免扣分',
            description: '本次点名免除所有扣分，获得基础分数',
            icon: '🛡️',
            bonusScore: 0,
            multiplier: 1
        },
        '额外加分': {
            name: '额外加分',
            description: '本次点名额外获得1分奖励',
            icon: '⭐',
            bonusScore: 1,
            multiplier: 1
        },
        '幸运加倍': {
            name: '幸运加倍',
            description: '本次评分分数*2',
            icon: '🎯',
            bonusScore: 0,
            multiplier: 2
        }
    };
    return events[eventName] || null;
}

// 触发随机事件
function triggerRandomEvent() {
    const random = Math.random() * 100; // 0-100的随机数

    if (random < 20) {
        // 20%概率：免扣分
        return {
            event: '免扣分',
            bonusScore: 0,
            multiplier: 1,
            luckyStudent: false
        };
    } else if (random < 50) {
        // 30%概率：额外加分
        return {
            event: '额外加分',
            bonusScore: 1,
            multiplier: 1,
            luckyStudent: false
        };
    } else if (random < 60) {
        // 10%概率：幸运加倍
        return {
            event: '幸运加倍',
            bonusScore: 0,
            multiplier: 2,
            luckyStudent: false
        };
    } else {
        // 40%概率：无事件
        return {
            event: null,
            bonusScore: 0,
            multiplier: 1,
            luckyStudent: false
        };
    }
}

// 随机点名
router.get('/random', async (req, res) => {
    console.log('[DEBUG] /random: 开始随机点名');
    try {
        const { course_id } = req.query;
        const { randomEventEnabled } = req.query;
        console.log('[DEBUG] /random: 请求参数 course_id:', course_id, 'randomEventEnabled:', randomEventEnabled);
        const connection = await db.getConnection();

        // 获取所有学生
        let query = 'SELECT student_id, name, total_score FROM students';
        let params = [];

        if (course_id) {
            query += ' WHERE course_id = ?';
            params.push(course_id);
        }

        console.log('[DEBUG] /random: 执行查询:', query, '参数:', params);
        const [students] = await connection.execute(query, params);
        console.log('[DEBUG] /random: 获取到学生数量:', students.length);

        if (students.length === 0) {
            console.log('[DEBUG] /random: 没有学生');
            connection.release();
            return res.status(404).json({ error: '没有学生' });
        }

        // 计算权重
        const maxScore = Math.max(...students.map(s => s.total_score));
        const weights = students.map(s => maxScore - s.total_score + 1);
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        console.log('[DEBUG] /random: 计算权重，总权重:', totalWeight);

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
        console.log('[DEBUG] /random: 选择的学生索引:', selectedIndex, '学生:', selected.name, 'ID:', selected.student_id);

        // 记录点名
        console.log('[DEBUG] /random: 记录点名到数据库');
        await connection.execute('INSERT INTO roll_calls (student_id, course_id) VALUES (?, ?)', [selected.student_id, course_id]);

        connection.release();

        // 检查随机事件开关并触发随机事件
        let randomEvent = null;
        let randomEventInfo = null;
        let bonusScore = 0;
        let multiplier = 1;
        let luckyStudent = false;

        if (randomEventEnabled === 'true') {
            console.log('[DEBUG] /random: 随机事件开关开启，触发随机事件');
            const eventResult = triggerRandomEvent();
            randomEvent = eventResult.event;
            bonusScore = eventResult.bonusScore;
            multiplier = eventResult.multiplier;
            luckyStudent = eventResult.luckyStudent;

            // 获取随机事件详细信息
            if (randomEvent) {
                randomEventInfo = getRandomEventInfo(randomEvent);
            }
        } else {
            console.log('[DEBUG] /random: 随机事件开关关闭，不触发随机事件');
        }

        console.log('[DEBUG] /random: 随机点名完成');

        res.json({
            student_id: selected.student_id,
            name: selected.name,
            randomEvent: randomEvent,
            randomEventInfo: randomEventInfo,
            bonusScore: bonusScore,
            multiplier: multiplier,
            luckyStudent: luckyStudent
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 顺序点名
router.get('/sequential', async (req, res) => {
    console.log('[DEBUG] /sequential: 开始顺序点名');
    let connection;
    try {
        const { course_id } = req.query;
        console.log('[DEBUG] /sequential: 请求参数 course_id:', course_id);
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 获取所有学生，按学号升序
        let query = 'SELECT student_id, name FROM students';
        let params = [];

        if (course_id) {
            query += ' WHERE course_id = ?';
            params.push(course_id);
        }

        query += ' ORDER BY student_id ASC';
        console.log('[DEBUG] /sequential: 执行查询:', query, '参数:', params);

        const [students] = await connection.execute(query, params);
        console.log('[DEBUG] /sequential: 获取到学生数量:', students.length);

        if (students.length === 0) {
            console.log('[DEBUG] /sequential: 没有学生');
            await connection.rollback();
            connection.release();
            return res.status(404).json({ error: '没有学生' });
        }

        // 获取最近的点名
        let lastRollCallQuery = 'SELECT student_id FROM roll_calls';
        let lastParams = [];
        if (course_id) {
            lastRollCallQuery += ' WHERE course_id = ?';
            lastParams.push(course_id);
        }
        lastRollCallQuery += ' ORDER BY roll_call_time DESC LIMIT 1';
        console.log('[DEBUG] /sequential: 查询最近点名:', lastRollCallQuery, '参数:', lastParams);
        const [lastRollCall] = await connection.execute(lastRollCallQuery, lastParams);
        console.log('[DEBUG] /sequential: 最近点名结果:', lastRollCall);

        let nextIndex = 0;
        if (lastRollCall.length > 0) {
            const lastStudentId = lastRollCall[0].student_id;
            const lastIndex = students.findIndex(s => s.student_id === lastStudentId);
            if (lastIndex !== -1) {
                nextIndex = (lastIndex + 1) % students.length;
            }
            console.log('[DEBUG] /sequential: 上次点名学生索引:', lastIndex, '下次索引:', nextIndex);
        } else {
            console.log('[DEBUG] /sequential: 首次点名，从索引0开始');
        }

        const selected = students[nextIndex];
        console.log('[DEBUG] /sequential: 选择的学生:', selected.name, 'ID:', selected.student_id);

        // 在返回学生信息前先记录点名
        console.log('[DEBUG] /sequential: 记录点名到数据库');
        await connection.execute('INSERT INTO roll_calls (student_id, course_id) VALUES (?, ?)', [selected.student_id, course_id]);

        await connection.commit();
        connection.release();

        console.log('[DEBUG] /sequential: 顺序点名完成');

        res.json({ student_id: selected.student_id, name: selected.name });
    } catch (error) {
        console.error(error);
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;