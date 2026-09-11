CREATE DATABASE IF NOT EXISTS quizspark;
USE quizspark;

CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('teacher', 'student') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quizzes (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  code VARCHAR(50) NOT NULL UNIQUE,
  status ENUM('draft', 'published') DEFAULT 'draft',
  cover_image TEXT,
  default_timer INT DEFAULT 20,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE questions (
  id CHAR(36) PRIMARY KEY,
  quiz_id CHAR(36) NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  media_url TEXT,
  media_type VARCHAR(20),
  timer_seconds INT DEFAULT 20,
  explanation TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE options (
  id CHAR(36) PRIMARY KEY,
  question_id CHAR(36) NOT NULL,
  option_text TEXT NOT NULL,
  option_color VARCHAR(20) DEFAULT 'red',
  is_correct BOOLEAN DEFAULT FALSE,
  order_index INT DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE quiz_attempts (
  id CHAR(36) PRIMARY KEY,
  quiz_id CHAR(36) NOT NULL,
  student_id CHAR(36) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  total_score INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) DEFAULT 0,
  time_taken_seconds INT DEFAULT 0,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE leaderboard (
  id CHAR(36) PRIMARY KEY,
  quiz_id CHAR(36) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  score INT DEFAULT 0,
  `rank` INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE live_sessions (
  id CHAR(36) PRIMARY KEY,
  quiz_id CHAR(36) NOT NULL,
  session_code VARCHAR(20) NOT NULL UNIQUE,
  teacher_id CHAR(36) NOT NULL,
  status ENUM('waiting', 'started', 'ended') DEFAULT 'waiting',
  current_question INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP NULL,
  ended_at TIMESTAMP NULL,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE live_participants (
  id CHAR(36) PRIMARY KEY,
  session_id CHAR(36) NOT NULL,
  student_id CHAR(36),
  student_name VARCHAR(255) NOT NULL,
  avatar VARCHAR(20),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(30) DEFAULT 'joined',
  score INT DEFAULT 0,
  UNIQUE KEY unique_session_student (session_id, student_id),
  FOREIGN KEY (session_id) REFERENCES live_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT
);