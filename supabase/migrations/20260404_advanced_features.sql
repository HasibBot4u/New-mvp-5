-- Feature 2: Smart Streak & Achievement System
CREATE TABLE IF NOT EXISTS study_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  streak_count INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_study_date DATE,
  total_videos_watched INTEGER DEFAULT 0,
  total_minutes_watched INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_name_bn TEXT NOT NULL,
  badge_emoji TEXT DEFAULT '🏆',
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_key)
);

ALTER TABLE study_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_streaks" ON study_streaks;
CREATE POLICY "users_own_streaks" ON study_streaks 
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_own_achievements" ON achievements;
CREATE POLICY "users_own_achievements" ON achievements 
  FOR ALL USING (user_id = auth.uid());

-- Feature 3: Video Bookmarks System
CREATE TABLE IF NOT EXISTS video_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER NOT NULL,
  label TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE video_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_bookmarks" ON video_bookmarks;
CREATE POLICY "users_own_bookmarks" ON video_bookmarks
  FOR ALL USING (user_id = auth.uid());

-- Feature 5: Admin: Announcement System
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  title_bn TEXT NOT NULL,
  body TEXT NOT NULL,
  body_bn TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info' | 'warning' | 'success' | 'urgent'
  is_active BOOLEAN DEFAULT true,
  show_to TEXT DEFAULT 'all', -- 'all' | 'admin'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_announcements" ON announcements;
CREATE POLICY "public_read_active_announcements"
  ON announcements FOR SELECT USING (
    is_active = true AND 
    (expires_at IS NULL OR expires_at > now())
  );

DROP POLICY IF EXISTS "admin_all_announcements" ON announcements;
CREATE POLICY "admin_all_announcements" ON announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
