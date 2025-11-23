const xlsx = require('xlsx');

// 生成随机中文姓名
const surnames = ['张', '李', '王', '赵', '孙', '周', '吴', '郑', '陈', '林', '黄', '徐', '朱', '马', '胡', '郭', '何', '高', '梁', '罗'];
const givenNames = ['三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十', '一', '二'];

function generateRandomName() {
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const givenName = givenNames[Math.floor(Math.random() * givenNames.length)];
    return surname + givenName;
}

// 专业列表
const majors = ['计算机科学', '信息工程', '软件工程'];

// 生成50个学生记录
const students = [];
for (let i = 0; i < 50; i++) {
    students.push({
        student_id: '2021' + String(1 + i).padStart(3, '0'),
        name: generateRandomName(),
        major: majors[i % 3]
    });
}

// 创建工作簿
const workbook = xlsx.utils.book_new();

// 将数据转换为工作表
const worksheet = xlsx.utils.json_to_sheet(students);

// 添加工作表到工作簿
xlsx.utils.book_append_sheet(workbook, worksheet, '学生名单');

// 写入文件
xlsx.writeFile(workbook, 'test-stus.xlsx');

console.log('test-stus.xlsx 文件已创建');