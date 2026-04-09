-- Create enrollment_codes table
CREATE TABLE IF NOT EXISTS enrollment_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  max_uses INTEGER DEFAULT 1,
  uses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Update profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS enrollment_code TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_enrolled BOOLEAN DEFAULT true;

-- Enable RLS and create policy
ALTER TABLE enrollment_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_codes"
  ON enrollment_codes FOR ALL USING (public.is_admin());

-- Allow public read access to active codes for validation during signup
CREATE POLICY "public_read_active_codes"
  ON enrollment_codes FOR SELECT USING (is_active = true);

-- Allow public update to uses_count during signup (we might need a secure RPC for this to prevent abuse, but for now we'll allow update if they know the code)
-- Actually, it's better to use a security definer function for the signup process to update the code and profile, or just allow update to uses_count.
-- Let's create an RPC for validating and using a code.
CREATE OR REPLACE FUNCTION use_enrollment_code(p_code TEXT, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code_id UUID;
  v_uses_count INTEGER;
  v_max_uses INTEGER;
BEGIN
  -- Find active code
  SELECT id, uses_count, max_uses INTO v_code_id, v_uses_count, v_max_uses
  FROM enrollment_codes
  WHERE code = p_code 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
  FOR UPDATE; -- Lock the row

  IF v_code_id IS NULL THEN
    RETURN FALSE; -- Code not found or inactive
  END IF;

  IF v_uses_count >= v_max_uses THEN
    RETURN FALSE; -- Code fully used
  END IF;

  -- Update code uses
  UPDATE enrollment_codes
  SET uses_count = uses_count + 1
  WHERE id = v_code_id;

  -- Update user profile
  UPDATE profiles
  SET enrollment_code = p_code, is_enrolled = true
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;
