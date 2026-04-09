import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getDeviceFingerprint } from './useDeviceFingerprint';

export function useChapterAccess() {
  const [accessMap, setAccessMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const checkAccess = useCallback(async (chapterId: string) => {
    try {
      const fingerprint = await getDeviceFingerprint();
      const { data, error } = await supabase.rpc('check_chapter_access', {
        p_chapter_id: chapterId,
        p_device_fingerprint: fingerprint
      });

      if (error) throw error;

      setAccessMap(prev => ({ ...prev, [chapterId]: !!data }));
      return !!data;
    } catch (error) {
      console.error('Error checking chapter access:', error);
      return false;
    }
  }, []);

  const checkBatchAccess = useCallback(async (chapterIds: string[]) => {
    setIsLoading(true);
    try {
      const results = await Promise.all(chapterIds.map(id => checkAccess(id)));
      return results;
    } finally {
      setIsLoading(false);
    }
  }, [checkAccess]);

  const submitCode = useCallback(async (chapterId: string, code: string) => {
    try {
      const fingerprint = await getDeviceFingerprint();
      const userAgent = navigator.userAgent;
      let ip = '';
      
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          ip = ipData.ip;
        }
      } catch (e) {
        console.warn('Could not fetch IP address', e);
      }

      const deviceInfo = {
        userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screen: `${window.screen.width}x${window.screen.height}`
      };

      const normalizedCode = code.trim().replace(/-/g, '').replace(/(.{4})/g, '$1-').replace(/-$/, '').toUpperCase();

      const { data, error } = await supabase.rpc('use_chapter_enrollment_code', {
        p_code: normalizedCode,
        p_chapter_id: chapterId,
        p_device_fingerprint: fingerprint,
        p_device_ip: ip,
        p_device_user_agent: userAgent,
        p_device_info: deviceInfo
      });

      if (error) throw error;

      if (data && data.success) {
        setAccessMap(prev => ({ ...prev, [chapterId]: true }));
      }

      return {
        success: data?.success || false,
        message_bn: data?.message_bn || 'অজানা ত্রুটি হয়েছে'
      };
    } catch (error: any) {
      console.error('Error submitting enrollment code:', error);
      return {
        success: false,
        message_bn: error.message || 'সার্ভার ত্রুটি হয়েছে। আবার চেষ্টা করুন।'
      };
    }
  }, []);

  const hasAccess = useCallback((chapterId: string) => {
    return accessMap[chapterId] ?? false;
  }, [accessMap]);

  return {
    accessMap,
    isLoading,
    checkAccess,
    checkBatchAccess,
    submitCode,
    hasAccess
  };
}
