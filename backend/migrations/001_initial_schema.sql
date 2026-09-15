-- Newton Platform Database Schema for Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK(role IN ('student','teacher','admin')) DEFAULT 'student',
  stage TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  energy INTEGER DEFAULT 0,
  avatar TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  stage TEXT NOT NULL,
  price INTEGER DEFAULT 0,
  teacher_id INTEGER REFERENCES users(id),
  thumbnail TEXT DEFAULT '',
  is_published INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lectures table
CREATE TABLE IF NOT EXISTS lectures (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  duration INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_free INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id),
  course_id INTEGER REFERENCES courses(id),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  UNIQUE(student_id, course_id)
);

-- Lecture progress table
CREATE TABLE IF NOT EXISTS lecture_progress (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id),
  lecture_id INTEGER REFERENCES lectures(id),
  completed INTEGER DEFAULT 0,
  watched_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, lecture_id)
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  time_limit INTEGER DEFAULT 15,
  passing_score INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT DEFAULT '',
  correct_answer TEXT NOT NULL,
  points INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  image_url TEXT DEFAULT ''
);

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id),
  quiz_id INTEGER REFERENCES quizzes(id),
  score INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  answers TEXT DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Sheets table
CREATE TABLE IF NOT EXISTS sheets (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homework table
CREATE TABLE IF NOT EXISTS homework (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id),
  sheet_id INTEGER REFERENCES sheets(id),
  file_url TEXT DEFAULT '',
  grade INTEGER DEFAULT NULL,
  feedback TEXT DEFAULT '',
  status TEXT CHECK(status IN ('submitted','graded','returned')) DEFAULT 'submitted',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id),
  course_id INTEGER REFERENCES courses(id),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  certificate_code TEXT UNIQUE NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lectures_course ON lectures(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_homework_student ON homework(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
