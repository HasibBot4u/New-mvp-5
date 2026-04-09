import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { KeyRound, Loader2 } from 'lucide-react';

export const EnrollmentForm: React.FC = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { profile, refreshProfile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Verify code
      const { data: enrollmentCode, error: codeError } = await supabase
        .from('enrollment_codes')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (codeError || !enrollmentCode) {
        throw new Error('Invalid or inactive enrollment code.');
      }

      if (enrollmentCode.expires_at && new Date(enrollmentCode.expires_at) < new Date()) {
        throw new Error('This enrollment code has expired.');
      }

      if (enrollmentCode.max_uses > 0 && enrollmentCode.uses_count >= enrollmentCode.max_uses) {
        throw new Error('This enrollment code has reached its maximum uses.');
      }

      // 2. Update code uses
      const { error: updateCodeError } = await supabase
        .from('enrollment_codes')
        .update({ uses_count: enrollmentCode.uses_count + 1 })
        .eq('id', enrollmentCode.id);

      if (updateCodeError) throw updateCodeError;

      // 3. Update user profile
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ 
          is_enrolled: true,
          enrollment_code: enrollmentCode.code
        })
        .eq('id', profile?.id);

      if (updateProfileError) throw updateProfileError;

      // 4. Refresh profile
      await refreshProfile();
      
    } catch (err: any) {
      setError(err.message || 'Failed to enroll. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 flex-col bg-background">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-surface p-8 shadow-sm text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <KeyRound className="h-8 w-8" />
        </div>
        <div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-text-primary">
            Enrollment Required
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Please enter your enrollment code to access NexusEdu content.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="code" className="sr-only">Enrollment Code</label>
            <input
              id="code"
              name="code"
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="relative block w-full appearance-none rounded-lg border border-border bg-background px-3 py-3 text-text-primary placeholder-text-secondary focus:z-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm text-center font-mono uppercase tracking-widest"
              placeholder="ENTER CODE"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="group relative flex w-full justify-center rounded-lg border border-transparent bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Verify Code'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
