-- 创建courses表
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建students表
CREATE TABLE IF NOT EXISTS students (
    student_id VARCHAR(20) NOT NULL,
    course_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    major VARCHAR(100),
    roll_call_count INT DEFAULT 0,
    total_score DECIMAL(10,2) DEFAULT 0.00,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建scores表
CREATE TABLE IF NOT EXISTS scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    course_id INT NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id, course_id) REFERENCES students(student_id, course_id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建roll_calls表
CREATE TABLE IF NOT EXISTS roll_calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    course_id INT NOT NULL,
    roll_call_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id, course_id) REFERENCES students(student_id, course_id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;