-- Phase A: Smart Resume
ALTER TABLE watch_history ADD COLUMN IF NOT EXISTS last_position_seconds INTEGER DEFAULT 0;

-- Phase A: Video Completion Certificates
CREATE TABLE IF NOT EXISTS cycle_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, cycle_id)
);

-- Phase B: Chapter Notes
CREATE TABLE IF NOT EXISTS video_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL,
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Phase C: Enrollment / Access Control
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS enrollment_code TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS enrollment_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  max_uses INTEGER DEFAULT 1,
  uses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase D: Quiz System
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL,
  title TEXT NOT NULL,
  time_limit_minutes INTEGER DEFAULT 15,
  total_marks INTEGER DEFAULT 100,
  pass_marks INTEGER DEFAULT 50,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  marks INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  explanation TEXT
);

CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  option_label TEXT
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'in_progress'
);

CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES question_options(id) ON DELETE CASCADE,
  UNIQUE(attempt_id, question_id)
);

-- Enable RLS
ALTER TABLE cycle_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

-- Policies for cycle_completions
CREATE POLICY "Users can view their own cycle completions" ON cycle_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cycle completions" ON cycle_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for video_notes
CREATE POLICY "Users can view their own notes" ON video_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notes" ON video_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON video_notes FOR UPDATE USING (auth.uid() = user_id);

-- Policies for enrollment_codes
CREATE POLICY "Admins can manage enrollment codes" ON enrollment_codes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Anyone can read active enrollment codes" ON enrollment_codes FOR SELECT USING (is_active = true);

-- Policies for quizzes
CREATE POLICY "Admins can manage quizzes" ON quizzes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can view published quizzes" ON quizzes FOR SELECT USING (is_published = true);

-- Policies for questions
CREATE POLICY "Admins can manage questions" ON questions FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can view questions for published quizzes" ON questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM quizzes WHERE id = questions.quiz_id AND is_published = true)
);

-- Policies for question_options
CREATE POLICY "Admins can manage question options" ON question_options FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can view question options for published quizzes" ON question_options FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM questions 
    JOIN quizzes ON questions.quiz_id = quizzes.id 
    WHERE questions.id = question_options.question_id AND quizzes.is_published = true
  )
);

-- Policies for quiz_attempts
CREATE POLICY "Users can manage their own attempts" ON quiz_attempts FOR ALL USING (auth.uid() = user_id);

-- Policies for quiz_answers
CREATE POLICY "Users can manage their own answers" ON quiz_answers FOR ALL USING (
  EXISTS (SELECT 1 FROM quiz_attempts WHERE id = quiz_answers.attempt_id AND user_id = auth.uid())
);

-- ==========================================
-- NEW MCQ QUIZ SYSTEM SCHEMA
-- ==========================================

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  time_limit_minutes INTEGER DEFAULT 30,
  total_marks INTEGER DEFAULT 0,
  pass_marks INTEGER DEFAULT 0,
  negative_per_wrong NUMERIC(3,2) DEFAULT 0.25,
  max_attempts INTEGER DEFAULT 3,
  is_published BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) 
           ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_image_url TEXT DEFAULT '',
  marks_correct NUMERIC(4,2) DEFAULT 1,
  marks_wrong NUMERIC(4,2) DEFAULT 0.25,
  explanation TEXT DEFAULT '',
  display_order INTEGER DEFAULT 0
);

-- Options table (4 options per question)
CREATE TABLE IF NOT EXISTS question_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) 
               ON DELETE CASCADE,
  option_label TEXT NOT NULL, -- 'A', 'B', 'C', 'D'
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false
);

-- Attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) 
           ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) 
          ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  score NUMERIC(6,2) DEFAULT 0,
  total_marks NUMERIC(6,2) DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  status TEXT DEFAULT 'in_progress',
  -- status: 'in_progress' | 'submitted' | 'timed_out'
  rank INTEGER DEFAULT 0
);

-- Answers table
CREATE TABLE IF NOT EXISTS quiz_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) 
             ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  selected_option_id UUID REFERENCES question_options(id),
  is_marked_for_review BOOLEAN DEFAULT false,
  answered_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_published_quizzes"
  ON quizzes FOR SELECT USING (is_published = true);
CREATE POLICY "admin_all_quizzes" ON quizzes FOR ALL 
  USING (public.is_admin());

CREATE POLICY "public_read_questions"
  ON questions FOR SELECT USING (true);
CREATE POLICY "admin_all_questions" ON questions FOR ALL 
  USING (public.is_admin());

CREATE POLICY "public_read_options"
  ON question_options FOR SELECT USING (true);
CREATE POLICY "admin_all_options" ON question_options FOR ALL 
  USING (public.is_admin());

CREATE POLICY "users_own_attempts"
  ON quiz_attempts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "admin_read_all_attempts"
  ON quiz_attempts FOR SELECT USING (public.is_admin());

CREATE POLICY "users_own_answers"
  ON quiz_answers FOR ALL USING (
    attempt_id IN (
      SELECT id FROM quiz_attempts WHERE user_id = auth.uid()
    )
  );
