ALTER TABLE forum_answers ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN DEFAULT false;

CREATE OR REPLACE FUNCTION mark_answer_accepted(p_question_id UUID, p_answer_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_question_owner UUID;
BEGIN
  -- Check if the user owns the question or is an admin
  SELECT user_id INTO v_question_owner FROM questions_forum WHERE id = p_question_id;
  
  IF v_question_owner != p_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized to mark answer as accepted';
  END IF;

  -- Reset any previously accepted answers for this question
  UPDATE forum_answers SET is_accepted = false WHERE question_id = p_question_id;
  
  -- Mark the new answer as accepted
  UPDATE forum_answers SET is_accepted = true WHERE id = p_answer_id;
  
  -- Mark the question as resolved
  UPDATE questions_forum SET is_resolved = true WHERE id = p_question_id;
END;
$$;
