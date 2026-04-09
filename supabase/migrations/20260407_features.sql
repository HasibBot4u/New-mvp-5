-- QUIZ SYSTEM
CREATE TABLE IF NOT EXISTS quiz_questions (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE,
subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
question_text text NOT NULL,
question_text_bn text,
option_a text NOT NULL,
option_b text NOT NULL,
option_c text NOT NULL,
option_d text NOT NULL,
correct_answer char(1) NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
explanation text,
difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
is_daily boolean DEFAULT false,
is_active boolean DEFAULT true,
created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
quiz_type text NOT NULL, -- 'daily', 'chapter', 'model_test'
subject_id uuid REFERENCES subjects(id),
chapter_id uuid REFERENCES chapters(id),
score integer DEFAULT 0,
total_questions integer DEFAULT 0,
time_taken_seconds integer DEFAULT 0,
completed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_answers (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
attempt_id uuid REFERENCES quiz_attempts(id) ON DELETE CASCADE,
question_id uuid REFERENCES quiz_questions(id),
selected_answer char(1),
is_correct boolean DEFAULT false
);

-- Q&A FORUM
CREATE TABLE IF NOT EXISTS qa_questions (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
video_id uuid REFERENCES videos(id) ON DELETE SET NULL,
subject_id uuid REFERENCES subjects(id),
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

-- USER STREAKS
CREATE TABLE IF NOT EXISTS user_streaks (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
current_streak integer DEFAULT 0,
longest_streak integer DEFAULT 0,
last_activity_date date,
total_study_days integer DEFAULT 0,
updated_at timestamptz DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
title text NOT NULL,
title_bn text,
body text,
body_bn text,
type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'quiz', 'streak')),
is_read boolean DEFAULT false,
created_at timestamptz DEFAULT now()
);

-- RLS for new tables
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_quiz_questions" ON quiz_questions FOR SELECT USING (is_active = true);
CREATE POLICY "own_quiz_attempts" ON quiz_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_quiz_answers" ON quiz_answers FOR ALL USING (
EXISTS (SELECT 1 FROM quiz_attempts WHERE id = attempt_id AND user_id = auth.uid())
);
CREATE POLICY "read_qa_questions" ON qa_questions FOR SELECT USING (is_active = true);
CREATE POLICY "own_qa_question" ON qa_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "read_qa_answers" ON qa_answers FOR SELECT USING (true);
CREATE POLICY "own_qa_answer" ON qa_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_streak" ON user_streaks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Function to update streak on video watch
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id uuid)
RETURNS void AS $$
DECLARE
last_date date;
today date := CURRENT_DATE;
BEGIN
SELECT last_activity_date INTO last_date FROM user_streaks WHERE user_id = p_user_id;
IF last_date IS NULL THEN
INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_study_days)
VALUES (p_user_id, 1, 1, today, 1)
ON CONFLICT (user_id) DO UPDATE SET current_streak = 1, last_activity_date = today, total_study_days = user_streaks.total_study_days + 1;
ELSIF last_date = today THEN
NULL; -- already studied today
ELSIF last_date = today - 1 THEN
UPDATE user_streaks SET current_streak = current_streak + 1,
longest_streak = GREATEST(longest_streak, current_streak + 1),
last_activity_date = today, total_study_days = total_study_days + 1
WHERE user_id = p_user_id;
ELSE
UPDATE user_streaks SET current_streak = 1, last_activity_date = today, total_study_days = total_study_days + 1
WHERE user_id = p_user_id;
END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
