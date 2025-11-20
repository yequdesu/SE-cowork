-- 创建students表
CREATE TABLE IF NOT EXISTS students (
    student_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    major VARCHAR(100),
    roll_call_count INT DEFAULT 0,
    total_score DECIMAL(10,2) DEFAULT 0.00
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建roll_calls表
CREATE TABLE IF NOT EXISTS roll_calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    roll_call_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;