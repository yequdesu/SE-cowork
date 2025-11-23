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
app.use('/api', require('./routes/courses'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const https = require("https");
const fs = require("fs");

https.createServer({
    key: fs.readFileSync("./key.pem"),
    cert: fs.readFileSync("./cert.pem")
}, app).listen(3000, () => {
    console.log("HTTPS server running at https://localhost:3000");
});

module.exports = app;