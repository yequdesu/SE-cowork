const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由挂载
app.use('/api', require('./routes/students'));
app.use('/api', require('./routes/scores'));
app.use('/api', require('./routes/importStudents'));
app.use('/api/rollCall', require('./routes/rollCall'));
app.use('/api', require('./routes/updateRollCall'));
app.use('/api', require('./routes/exportScores'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;