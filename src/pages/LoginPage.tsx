import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, useLocation, Link } from 'react-router-dom';
import { supabase, logActivity } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { setPageTitle } from '../utils/setPageTitle';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { NexusLogo } from '../components/shared/NexusLogo';

export const LoginPage: React.FC = () => {
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(location.pathname === '/signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [enrollmentCode, setEnrollmentCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  useEffect(() => { 
    setPageTitle(isSignUp ? 'রেজিস্ট্রেশন - NexusEdu' : 'লগইন - NexusEdu'); 
  }, [isSignUp]);

  useEffect(() => {
    setIsSignUp(location.pathname === '/signup');
    setError(null);
    setSuccess(null);
  }, [location.pathname]);

  const wasBlocked = location.state?.blocked === true;

  useEffect(() => {
    if (wasBlocked && user) {
      signOut();
    }
  }, [wasBlocked, user, signOut]);

  if (user && !wasBlocked) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignUp = async () => {
    try {
      if (!fullName.trim()) {
        setError('পুরো নাম আবশ্যক');
        return;
      }

      if (enrollmentCode.trim()) {
        const { data: codeData, error: fetchError } = await supabase
          .from('enrollment_codes')
          .select('*')
          .eq('code', enrollmentCode.trim())
          .eq('is_active', true)
          .maybeSingle();

        if (fetchError || !codeData) {
          setError('এনরোলমেন্ট কোড সঠিক নয়');
          return;
        }

        if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
          setError('এনরোলমেন্ট কোডের মেয়াদ শেষ');
          return;
        }

        if (codeData.uses_count >= codeData.max_uses) {
          setError('কোডটি ইতিমধ্যে ব্যবহৃত হয়েছে');
          return;
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            display_name: fullName.split(' ')[0]
          }
        }
      });
      
      if (error) {
        setError(error.message);
        return;
      }
      
      if (data.user) {
        if (enrollmentCode.trim()) {
          await supabase.rpc('use_enrollment_code', {
            p_code: enrollmentCode.trim(),
            p_user_id: data.user.id
          });
        }

        await logActivity(data.user.id, 'signup', { email });
        setSuccess('অ্যাকাউন্ট তৈরি হয়েছে! এখন লগইন করতে পারেন।');
        setIsSignUp(false);
        navigate('/login');
      }
    } catch (err: any) {
      setError('সংযোগ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      console.error('SignUp error:', err);
    }
  };

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      
      if (error) {
        setError('ইমেইল বা পাসওয়ার্ড ভুল');
        return;
      }
      
      if (data.session) {
        await logActivity(data.user.id, 'login', { email });
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .maybeSingle();
        
        if (!profile && (!profileError || profileError.code === 'PGRST116')) {
          await supabase.from('profiles').upsert(
            {
              id: data.user.id,
              email: data.user.email,
              display_name: data.user.email?.split('@')[0] || 'User',
              role: 'user',
            },
            { onConflict: 'id', ignoreDuplicates: true }
          );
        }
        
        if (profile?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError('সংযোগ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      console.error('Login error:', err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isSignUp) {
        await handleSignUp();
      } else {
        await handleLogin();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Side - Branding */}
      <div className="hidden md:flex md:w-1/2 bg-indigo-800 p-12 flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-indigo-800 opacity-90" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
        
        <div className="relative z-10 max-w-md mx-auto">
          <NexusLogo className="mb-8 scale-125 origin-left" />
          <h1 className="text-4xl font-bold text-white bangla mb-8 leading-tight">
            তোমার শিক্ষার নতুন দিগন্ত
          </h1>
          <ul className="space-y-6">
            {[
              'দেশের সেরা শিক্ষকদের গোছানো ভিডিও লেকচার',
              'যেকোনো সময়, যেকোনো জায়গা থেকে শেখার সুযোগ',
              'কুইজ ও মডেল টেস্ট দিয়ে নিজের প্রস্তুতি যাচাই'
            ].map((feature, i) => (
              <li key={i} className="flex items-start gap-4 text-indigo-100 bangla text-lg">
                <CheckCircle2 className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50 md:bg-white">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 md:border-none md:shadow-none md:p-0">
          
          {/* Mobile Logo */}
          <div className="md:hidden flex justify-center mb-8">
            <NexusLogo />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 bangla mb-2">
              {isSignUp ? 'রেজিস্ট্রেশন করুন' : 'লগইন করুন'}
            </h2>
            <p className="text-gray-600 bangla">
              {isSignUp ? 'নতুন একাউন্ট খুলতে তথ্য দিন' : 'আপনার একাউন্টে প্রবেশ করুন'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 bangla mb-1.5">
                  পুরো নাম
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all bangla"
                  placeholder="আপনার পুরো নাম"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 bangla mb-1.5">
                ইমেইল ঠিকানা
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all bangla"
                placeholder="example@email.com"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700 bangla">
                  পাসওয়ার্ড
                </label>
                {!isSignUp && (
                  <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium bangla">
                    পাসওয়ার্ড ভুলে গেছেন?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all bangla"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 bangla mb-1.5">
                  এনরোলমেন্ট কোড (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={enrollmentCode}
                  onChange={(e) => setEnrollmentCode(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all bangla"
                  placeholder="কোড লিখুন"
                />
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed bangla mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isSignUp ? 'রেজিস্ট্রেশন করুন' : 'লগইন করুন'
              )}
            </button>
            
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm bangla">{error}</p>
              </div>
            )}

            {success && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm bangla">{success}</p>
              </div>
            )}

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500 bangla">অথবা</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link
                  to={isSignUp ? '/login' : '/signup'}
                  className="text-indigo-600 hover:text-indigo-700 font-medium bangla"
                >
                  {isSignUp ? 'একাউন্ট আছে? লগইন করুন' : 'একাউন্ট নেই? রেজিস্ট্রেশন করুন'}
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

