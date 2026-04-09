import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useVideoProgress(videoId: string, duration: number) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const lastSavedTime = useRef(0);
  const saveTimeout = useRef<NodeJS.Timeout>();

  const loadProgressFromSupabase = useCallback(async () => {
    if (!user || !videoId) return 0;
    try {
      const { data, error } = await supabase
        .from('watch_history')
        .select('progress_seconds, completed')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading progress:', error);
        return 0;
      }
      
      if (data) {
        setIsCompleted(data.completed);
        return data.progress_seconds || 0;
      }
    } catch (e) {
      console.error('Exception loading progress:', e);
    }
    return 0;
  }, [user, videoId]);

  const saveProgressToSupabase = useCallback(async (currentTime: number, currentDuration: number) => {
    if (!user || !videoId || currentDuration <= 0) return;
    
    try {
      const progressPercent = Math.round((currentTime / currentDuration) * 100);
      const completed = (currentTime / currentDuration) >= 0.95;
      
      await supabase.from('watch_history').upsert({
        user_id: user.id,
        video_id: videoId,
        progress_percent: progressPercent,
        progress_seconds: Math.floor(currentTime),
        completed: completed,
        watch_count: 1,
        watched_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,video_id' });
      
      if (completed && !isCompleted) {
        setIsCompleted(true);
      }
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  }, [user, videoId, isCompleted]);

  const handleTimeUpdate = useCallback((currentTime: number) => {
    setProgress(currentTime);
    
    // Save every 10 seconds
    if (Math.abs(currentTime - lastSavedTime.current) >= 10) {
      lastSavedTime.current = currentTime;
      
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
      
      saveTimeout.current = setTimeout(() => {
        saveProgressToSupabase(currentTime, duration);
      }, 1000);
    }
  }, [duration, saveProgressToSupabase]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
      if (progress > 0 && duration > 0) {
        saveProgressToSupabase(progress, duration);
      }
    };
  }, [progress, duration, saveProgressToSupabase]);

  return {
    progress,
    isCompleted,
    handleTimeUpdate,
    loadProgressFromSupabase,
    saveProgressToSupabase
  };
}
