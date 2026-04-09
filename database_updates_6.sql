-- Create page_views table
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  page TEXT NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "anyone_insert_views"
  ON page_views FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_read_views"
  ON page_views FOR SELECT USING (public.is_admin());
