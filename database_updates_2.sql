CREATE TABLE IF NOT EXISTS video_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) 
           ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) 
           ON DELETE CASCADE,
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, video_id)
);
ALTER TABLE video_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_notes"
  ON video_notes FOR ALL USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS live_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  meeting_url TEXT DEFAULT '',
  is_cancelled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_live"
  ON live_classes FOR SELECT USING (true);
CREATE POLICY "admin_all_live" ON live_classes FOR ALL 
  USING (public.is_admin());
