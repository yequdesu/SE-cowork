# 课堂点名管理系统

## 项目简介

课堂点名管理系统是一个基于微信小程序和Node.js的后端服务开发的教学辅助工具。该系统旨在帮助教师高效地管理课堂点名、学生积分计算和成绩统计，提高教学管理的数字化水平。

## 功能特性

### 🎯 核心功能
- **课程管理**：支持创建、选择和删除课程，实现多课程并行管理
- **学生导入**：支持Excel文件批量导入学生信息，包含学号、姓名、专业等字段
- **智能点名**：提供随机点名和顺序点名两种模式，支持点名历史记录
- **积分系统**：基于学生课堂表现（到勤、复述正确性、回答质量）自动计算积分
- **排名统计**：实时显示学生积分排名，并提供可视化图表展示

### 📊 数据统计
- 学生积分实时更新和排名
- 点名次数统计
- 课程隔离的数据管理
- 历史记录追溯

## 技术栈

### 前端
- **框架**：微信小程序原生框架
- **语言**：JavaScript
- **UI组件**：微信小程序原生组件 + Canvas绘图

### 后端
- **运行环境**：Node.js
- **框架**：Express.js
- **数据库**：MySQL 8.0+
- **数据库连接**：mysql2 (Promise API)
- **文件上传**：multer
- **Excel处理**：xlsx
- **跨域处理**：cors

### 部署环境
- **数据库**：远程MySQL数据库 (freesqldatabase.com)
- **服务器**：本地开发服务器 (端口: 3001)

## 安装运行指南

### 环境要求
- Node.js 16.0+
- MySQL 8.0+
- 微信开发者工具

### 后端部署

1. **克隆项目**
```bash
git clone <repository-url>
cd student-management
```

2. **安装依赖**
```bash
npm install
```

3. **数据库配置**
   - 系统已配置远程MySQL数据库连接
   - 如需修改数据库配置，请编辑 `db.js` 文件

4. **初始化数据库**
```bash
node setup_db.js
```

5. **启动后端服务**
```bash
npm start
# 或
node server.js
```

服务器将在 `http://localhost:3001` 启动

### 前端部署

1. **打开微信开发者工具**

2. **导入项目**
   - 选择项目根目录
   - AppID：请使用自己的微信小程序AppID

3. **编译运行**
   - 点击"编译"按钮
   - 预览或真机调试

## API文档

### 基础信息
- **Base URL**: `http://localhost:3001/api`
- **数据格式**: JSON
- **认证方式**: 无需认证

### 课程管理 API

#### 获取课程列表
```http
GET /courses
```

**响应示例**:
```json
{
  "success": true,
  "courses": [
    {
      "id": 1,
      "name": "软件工程",
      "description": "软件工程课程"
    }
  ]
}
```

#### 创建课程
```http
POST /courses
```

**请求体**:
```json
{
  "course_name": "课程名称",
  "description": "课程描述"
}
```

#### 删除课程
```http
DELETE /courses/:course_id
```

### 学生管理 API

#### 获取学生列表
```http
GET /students?course_id=1
```

**响应示例**:
```json
{
  "success": true,
  "students": [
    {
      "student_id": "2021001",
      "name": "张三",
      "major": "计算机科学",
      "total_score": 15.5,
      "roll_call_count": 10
    }
  ]
}
```

#### 导入学生数据
```http
POST /importStudents
```

**请求类型**: multipart/form-data
**参数**: file (Excel文件), course_id

### 点名管理 API

#### 执行点名
```http
GET /rollCall/random?course_id=1
GET /rollCall/sequential?course_id=1
```

**响应示例**:
```json
{
  "student_id": "2021001"
}
```

#### 更新点名记录
```http
POST /updateRollCall
```

**请求体**:
```json
{
  "studentId": "2021001",
  "arrived": true,
  "recitationCorrect": true,
  "answerScore": 2.5,
  "totalScore": 3.5,
  "course_id": 1
}
```

### 积分排名 API

#### 获取积分排名
```http
GET /scores?course_id=1&limit=10
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "studentId": "2021001",
      "name": "张三",
      "major": "计算机科学",
      "score": 15.5,
      "rollCallCount": 10,
      "label": "张三",
      "value": 15.5
    }
  ],
  "count": 1
}
```

## 使用说明

### 1. 课程管理
1. 进入"课程"页面
2. 创建新课程：输入课程名称和描述
3. 选择当前要管理的课程
4. 可删除不需要的课程（会同时删除相关学生和积分数据）

### 2. 学生数据导入
1. 进入"导入"页面
2. 选择包含学生信息的Excel文件
3. 确保Excel文件格式正确：
   - 第一列：学号 (student_id)
   - 第二列：姓名 (name)
   - 第三列：专业 (major)
4. 点击上传导入

### 3. 课堂点名
1. 进入"点名"页面
2. 选择点名模式：
   - **随机模式**：随机选择学生
   - **顺序模式**：按顺序点名
3. 点击"执行点名"选择学生
4. 记录学生表现：
   - 到勤状态
   - 复述正确性
   - 回答分数 (0.5-3.0分)
5. 提交更新，系统自动计算积分

### 4. 积分计算规则
- **到勤积分**：1分
- **复述正确**：+0.5分
- **复述错误**：-1分
- **回答分数**：0.5-3.0分
- **总积分** = 到勤 + 复述 + 回答

### 5. 查看排名
1. 进入"排名"页面
2. 查看学生积分排名列表
3. 查看可视化柱形图
4. 数据实时更新

## 项目结构

```
student-management/
├── server.js                 # 后端服务入口
├── db.js                     # 数据库连接配置
├── package.json              # 项目依赖配置
├── setup_db.js              # 数据库初始化脚本
├── routes/                   # API路由
│   ├── students.js          # 学生管理路由
│   ├── courses.js           # 课程管理路由
│   ├── scores.js            # 积分排名路由
│   ├── rollCall.js          # 点名路由
│   ├── updateRollCall.js    # 点名更新路由
│   ├── importStudents.js    # 学生导入路由
│   └── exportScores.js      # 成绩导出路由
├── pages/                    # 微信小程序页面
│   ├── import/              # 学生导入页面
│   ├── course-select/       # 课程选择页面
│   ├── roll-call/           # 点名页面
│   ├── ranking/             # 排名页面
│   └── settings/            # 设置页面
├── uploads/                  # 文件上传目录
├── app.json                 # 小程序配置
├── project.config.json      # 项目配置
└── README.md                # 项目文档
```

## 数据库设计

### 核心数据表
- **courses**: 课程信息表
- **students**: 学生信息表
- **roll_calls**: 点名记录表
- **scores**: 积分记录表（已整合到students表）

### 表关系
- courses (1) -> students (n)
- students (1) -> roll_calls (n)

## 开发与部署

### 开发环境
1. 确保Node.js和MySQL已安装
2. 运行 `npm install` 安装依赖
3. 执行 `node setup_db.js` 初始化数据库
4. 启动后端：`npm start`
5. 使用微信开发者工具导入前端项目

### 生产部署
1. 配置生产环境数据库
2. 修改 `db.js` 中的数据库连接信息
3. 使用PM2等工具管理Node.js进程
4. 配置反向代理（如Nginx）
5. 部署微信小程序到微信平台

## 注意事项

1. **数据安全**：删除课程时会同时删除所有相关数据，请谨慎操作
2. **网络连接**：小程序需要连接到后端API，确保网络畅通
3. **文件格式**：学生导入的Excel文件格式必须符合要求
4. **积分计算**：系统会实时更新学生积分，点名记录不可修改
