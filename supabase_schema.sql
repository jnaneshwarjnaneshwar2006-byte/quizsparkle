-- ========================================================
-- KAHOOT-STYLE QUIZ PLATFORM - DATABASE SCHEMA
-- Execute this SQL in your Supabase SQL Editor
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES / USERS
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. QUIZZES
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    code TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    cover_image TEXT,
    default_timer INT DEFAULT 20,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. QUESTIONS
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'image', 'audio', 'video')),
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'audio', 'video', 'none')),
    timer_seconds INT DEFAULT 20,
    explanation TEXT,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. OPTIONS
CREATE TABLE IF NOT EXISTS public.options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    option_color TEXT DEFAULT 'red' CHECK (option_color IN ('red', 'blue', 'yellow', 'green')),
    is_correct BOOLEAN NOT NULL DEFAULT false,
    order_index INT NOT NULL DEFAULT 0
);

-- 5. QUIZ ATTEMPTS
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_score INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    total_questions INT DEFAULT 0,
    accuracy_percentage NUMERIC(5,2) DEFAULT 0,
    time_taken_seconds INT DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. STUDENT ANSWERS
CREATE TABLE IF NOT EXISTS public.student_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES public.options(id) ON DELETE SET NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    points_earned INT DEFAULT 0,
    response_time_ms INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. LEADERBOARD
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    score INT NOT NULL DEFAULT 0,
    rank INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INDEXES FOR SPEED AND REALTIME UPDATES
CREATE INDEX IF NOT EXISTS idx_quizzes_code ON public.quizzes(code);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_options_question_id ON public.options(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_quiz ON public.leaderboard(quiz_id, score DESC);

-- ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC READ ACCESS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow public access for game participation
CREATE POLICY "Public quizzes read" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Public quizzes write" ON public.quizzes FOR ALL USING (true);
CREATE POLICY "Public questions read" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Public questions write" ON public.questions FOR ALL USING (true);
CREATE POLICY "Public options read" ON public.options FOR SELECT USING (true);
CREATE POLICY "Public options write" ON public.options FOR ALL USING (true);
CREATE POLICY "Public attempts read" ON public.quiz_attempts FOR SELECT USING (true);
CREATE POLICY "Public attempts write" ON public.quiz_attempts FOR ALL USING (true);
CREATE POLICY "Public student answers write" ON public.student_answers FOR ALL USING (true);
CREATE POLICY "Public leaderboard read" ON public.leaderboard FOR SELECT USING (true);
CREATE POLICY "Public leaderboard write" ON public.leaderboard FOR ALL USING (true);

-- STORAGE BUCKETS FOR MEDIA UPLOAD
INSERT INTO storage.buckets (id, name, public) 
VALUES ('quiz-media', 'quiz-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access Media Bucket" ON storage.objects FOR ALL USING (bucket_id = 'quiz-media');
