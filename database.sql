-- QUIZ TABLES
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_bn text,
  chapter_id uuid REFERENCES chapters(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  quiz_type text DEFAULT 'chapter' CHECK (quiz_type IN ('chapter', 'model_test', 'daily')),
  time_limit_seconds integer DEFAULT 600,
  max_attempts integer DEFAULT 3,
  negative_per_wrong numeric(3,2) DEFAULT 0.25,
  passing_score integer DEFAULT 50,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_text_bn text,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer char(1) NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
  explanation text,
  explanation_bn text,
  marks_correct integer DEFAULT 1,
  difficulty text DEFAULT 'medium',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  score numeric DEFAULT 0,
  total_questions integer DEFAULT 0,
  time_taken_seconds integer DEFAULT 0,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  answers jsonb DEFAULT '{}',
  completed_at timestamptz
);

-- Q&A TABLES
CREATE TABLE IF NOT EXISTS qa_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id uuid REFERENCES videos(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text,
  upvotes integer DEFAULT 0,
  is_answered boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS qa_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES qa_questions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  upvotes integer DEFAULT 0,
  is_accepted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  title_bn text,
  body text,
  body_bn text,
  type text DEFAULT 'info' CHECK (type IN ('info','success','warning','quiz')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- LIVE CLASSES (for BottomNav indicator)
CREATE TABLE IF NOT EXISTS live_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_bn text,
  subject_id uuid REFERENCES subjects(id),
  scheduled_at timestamptz NOT NULL,
  stream_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_active_quizzes" ON quizzes FOR SELECT USING (is_active = true);
CREATE POLICY "read_quiz_questions" ON quiz_questions FOR SELECT USING (is_active = true);
CREATE POLICY "own_quiz_attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_attempt" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_attempt" ON quiz_attempts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "read_qa" ON qa_questions FOR SELECT USING (is_active = true);
CREATE POLICY "insert_qa" ON qa_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "read_qa_answers" ON qa_answers FOR SELECT USING (true);
CREATE POLICY "insert_qa_answer" ON qa_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "update_own_notif" ON notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "read_live_classes" ON live_classes FOR SELECT USING (true);

-- Admin policies (use existing is_admin() SECURITY DEFINER function)
CREATE POLICY "admin_quizzes" ON quizzes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_quiz_q" ON quiz_questions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_qa" ON qa_questions FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_qa_ans" ON qa_answers FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_notif" ON notifications FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "admin_live" ON live_classes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
