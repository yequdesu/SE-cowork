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
            bonusScore: 0
        },
        '额外加分': {
            name: '额外加分',
            description: '本次点名额外获得1分奖励',
            icon: '⭐',
            bonusScore: 1
        },
        '幸运加倍': {
            name: '幸运加倍',
            description: '本次评分分数*2',
            icon: '🎯',
            bonusScore: 0
        }
    };
    return events[eventName] || null;
}

// 更新点名积分
router.post('/updateRollCall', async (req, res) => {
    console.log('[DEBUG] /updateRollCall: 开始更新点名积分');
    try {
        const { studentId, arrived, recitationCorrect, answerScore, totalScore, course_id, combo, randomEvent, bonusScore } = req.body;
        console.log('[DEBUG] /updateRollCall: 请求参数 - studentId:', studentId, 'arrived:', arrived, 'recitationCorrect:', recitationCorrect, 'answerScore:', answerScore, 'totalScore:', totalScore, 'course_id:', course_id, 'combo:', combo, 'randomEvent:', randomEvent, 'bonusScore:', bonusScore);

        // 验证参数
        if (!studentId || typeof arrived !== 'boolean' || typeof recitationCorrect !== 'boolean' && recitationCorrect !== null || typeof answerScore !== 'number' || typeof totalScore !== 'number' || !course_id || typeof combo !== 'number') {
            console.log('[DEBUG] /updateRollCall: 参数无效');
            return res.status(400).json({ error: '参数无效' });
        }

        const connection = await db.getConnection();
        console.log('[DEBUG] /updateRollCall: 数据库连接成功');

        // 更新学生积分和点名次数
        const updateQuery = 'UPDATE students SET total_score = total_score + ?, roll_call_count = roll_call_count + 1 WHERE student_id = ? AND course_id = ?';
        console.log('[DEBUG] /updateRollCall: 执行更新查询:', updateQuery, '参数:', [totalScore, studentId, course_id]);
        const [result] = await connection.execute(updateQuery, [totalScore, studentId, course_id]);
        console.log('[DEBUG] /updateRollCall: 更新结果 affectedRows:', result.affectedRows);

        connection.release();

        if (result.affectedRows === 0) {
            console.log('[DEBUG] /updateRollCall: 学生不存在');
            return res.status(404).json({ error: '学生不存在' });
        }

        console.log('[DEBUG] /updateRollCall: 积分更新成功');

        // 获取随机事件详细信息
        const randomEventInfo = randomEvent ? getRandomEventInfo(randomEvent) : null;

        res.json({
            success: true,
            message: '积分更新成功',
            totalScore: totalScore,
            randomEvent: randomEvent,
            randomEventInfo: randomEventInfo,
            bonusScore: bonusScore
        });
    } catch (error) {
        console.error('[DEBUG] /updateRollCall: 服务器错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;