import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড মিলছে না');
      return;
    }

    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: { full_name: fullName.trim(), display_name: fullName.trim() }
        }
      });

      if (error) {
        let errorMsg = error.message;
        if (errorMsg.includes('User already registered')) {
          errorMsg = 'এই ইমেইলে আগেই একাউন্ট আছে';
        } else if (errorMsg.includes('Password should be at least 6 characters')) {
          errorMsg = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে';
        } else if (errorMsg.includes('Invalid email') || errorMsg.includes('email address is invalid')) {
          errorMsg = 'ইমেইল ঠিকানা সঠিক নয়';
        }
        setError(errorMsg);
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || 'রেজিস্ট্রেশন করতে সমস্যা হচ্ছে');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
              <span className="text-3xl font-bold text-white">N</span>
            </div>
          </div>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 bangla">
            NexusEdu
          </h2>
          <p className="mt-2 text-sm text-gray-600 bangla">
            নতুন একাউন্ট তৈরি করুন
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm bangla text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl text-sm bangla text-center font-medium">
              রেজিস্ট্রেশন সফল! আপনার ইমেইল যাচাই করুন তারপর লগইন করুন।
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 bangla">
                পুরো নাম
              </label>
              <input
                type="text"
                required
                disabled={isLoading || success}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bangla"
                placeholder="আপনার পুরো নাম"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 bangla">
                ইমেইল ঠিকানা
              </label>
              <input
                type="email"
                required
                disabled={isLoading || success}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bangla"
                placeholder="আপনার ইমেইল"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 bangla">
                পাসওয়ার্ড
              </label>
              <input
                type="password"
                required
                disabled={isLoading || success}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bangla"
                placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 bangla">
                পাসওয়ার্ড নিশ্চিত করুন
              </label>
              <input
                type="password"
                required
                disabled={isLoading || success}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bangla"
                placeholder="পাসওয়ার্ড পুনরায় লিখুন"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || success}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed bangla"
            >
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                'রেজিস্ট্রেশন করুন'
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors bangla text-sm"
          >
            ইতিমধ্যে একাউন্ট আছে? লগইন করুন
          </Link>
        </div>
      </div>
    </div>
  );
}
