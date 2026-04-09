CREATE TABLE IF NOT EXISTS questions_forum (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  upvotes INTEGER DEFAULT 0,
  is_resolved BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions_forum(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  upvotes INTEGER DEFAULT 0,
  is_official BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_upvotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions_forum(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES forum_answers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, question_id),
  UNIQUE(user_id, answer_id)
);

ALTER TABLE questions_forum ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_questions" ON questions_forum FOR SELECT USING (true);
CREATE POLICY "users_insert_questions" ON questions_forum FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_update_own_questions" ON questions_forum FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "admin_delete_questions" ON questions_forum FOR DELETE USING (public.is_admin());

CREATE POLICY "public_read_answers" ON forum_answers FOR SELECT USING (true);
CREATE POLICY "users_insert_answers" ON forum_answers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin_delete_answers" ON forum_answers FOR DELETE USING (public.is_admin());

CREATE POLICY "users_manage_upvotes" ON forum_upvotes FOR ALL USING (user_id = auth.uid());
