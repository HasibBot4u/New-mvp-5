import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlayCircle, BookOpen, ChevronRight, CheckCircle2, Bell, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { useCatalog } from '../contexts/CatalogContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserStats } from '../hooks/useUserStats';
import { Skeleton } from '../components/ui/Skeleton';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { StudentLayout } from '../components/layout/StudentLayout';
import { StatCard } from '../components/shared/StatCard';
import { VideoCard } from '../components/shared/VideoCard';
import { SEO } from '../components/SEO';

export function DashboardPage() {
  const navigate = useNavigate();
  const { catalog, isLoading, error, refreshCatalog } = useCatalog();
  const { profile } = useAuth();
  const { stats } = useUserStats();
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        
        if (data && !error) {
          setAnnouncements(data);
        }
      } catch (e) {
        console.error('Error fetching announcements:', e);
      }
    };

    fetchAnnouncements();
  }, []);

  const continueWatching = useMemo(() => {
    if (!catalog) return [];
    const inProgress = stats.inProgressVideos.sort((a, b) => b.lastWatched - a.lastWatched).slice(0, 5);
    
    return inProgress.map(p => {
      for (const subject of catalog.subjects) {
        for (const cycle of subject.cycles) {
          for (const chapter of cycle.chapters) {
            const video = chapter.videos.find((v: any) => v.id === p.videoId);
            if (video) {
              return { video, subject, chapter, progress: p.progress };
            }
          }
        }
      }
      return null;
    }).filter(Boolean) as any[];
  }, [catalog, stats.inProgressVideos]);

  if (error) {
    return (
      <StudentLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="bangla text-2xl font-bold text-gray-900 mb-2">কন্টেন্ট লোড করতে সমস্যা হচ্ছে</h2>
          <p className="bangla text-gray-600 mb-6">আপনার ইন্টারনেট সংযোগ চেক করুন এবং আবার চেষ্টা করুন।</p>
          <button 
            onClick={refreshCatalog}
            className="bangla px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      </StudentLayout>
    );
  }

  // Calculate total watch time in hours
  const totalWatchHours = stats.hoursWatched;

  return (
    <StudentLayout>
      <SEO title="ড্যাশবোর্ড | NexusEdu" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto"
      >
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="bangla text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            স্বাগতম, <span className="text-indigo-600">{profile?.display_name?.split(' ')[0] || 'শিক্ষার্থী'}</span> 👋
          </h1>
          <p className="bangla text-gray-600">আজকের পড়াশোনা শুরু করতে প্রস্তুত?</p>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard
            label="মোট সময়"
            value={`${totalWatchHours} ঘণ্টা`}
            icon={<Clock className="w-6 h-6 text-indigo-600" />}
            color="bg-indigo-50 text-indigo-600"
          />
          <StatCard
            label="সম্পন্ন ভিডিও"
            value={stats.completedCount.toString()}
            icon={<CheckCircle className="w-6 h-6 text-emerald-600" />}
            color="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            label="চলমান ভিডিও"
            value={stats.inProgressVideos.length.toString()}
            icon={<PlayCircle className="w-6 h-6 text-amber-600" />}
            color="bg-amber-50 text-amber-600"
          />
        </div>

        {/* Announcements Section */}
        {announcements.length > 0 && (
          <section className="mb-10">
            <div className="space-y-4">
              {announcements.map((announcement) => {
                let icon = <Bell className="w-5 h-5" />;
                let bgClass = 'bg-blue-50 border-blue-200';
                let textClass = 'text-blue-800';
                let iconClass = 'text-blue-600 bg-blue-100';

                if (announcement.type === 'warning') {
                  icon = <AlertTriangle className="w-5 h-5" />;
                  bgClass = 'bg-amber-50 border-amber-200';
                  textClass = 'text-amber-800';
                  iconClass = 'text-amber-600 bg-amber-100';
                } else if (announcement.type === 'success') {
                  icon = <CheckCircle2 className="w-5 h-5" />;
                  bgClass = 'bg-emerald-50 border-emerald-200';
                  textClass = 'text-emerald-800';
                  iconClass = 'text-emerald-600 bg-emerald-100';
                }

                return (
                  <div key={announcement.id} className={`flex items-start gap-4 p-4 rounded-xl border ${bgClass} shadow-sm relative`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                      {icon}
                    </div>
                    <div className="flex-1 pr-6">
                      <h3 className={`font-medium ${textClass} mb-1 bangla`}>{announcement.title_bn || announcement.title}</h3>
                      <p className={`text-sm ${textClass} opacity-90 bangla`}>{announcement.body_bn || announcement.body}</p>
                    </div>
                    <button 
                      onClick={() => setAnnouncements(prev => prev.filter(a => a.id !== announcement.id))}
                      className={`absolute top-4 right-4 p-1 rounded-full hover:bg-black/5 transition-colors ${textClass}`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="bangla text-2xl font-bold text-gray-900 flex items-center gap-2">
                এগিয়ে যাও <span className="text-amber-500">🔥</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {continueWatching.slice(0, 3).map((item) => {
                const durationStr = item.video.duration || '00:00:00';
                const timeParts = durationStr.split(':').map(Number);
                let durationSecs = 0;
                if (timeParts.length === 3) durationSecs = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
                else if (timeParts.length === 2) durationSecs = timeParts[0] * 60 + timeParts[1];
                
                const percent = durationSecs > 0 ? Math.min(100, Math.round((item.progress / durationSecs) * 100)) : 0;

                return (
                  <VideoCard
                    key={item.video.id}
                    video={item.video}
                    watchPercent={percent}
                    isWatched={percent >= 90}
                    onClick={() => navigate(`/watch/${item.video.id}`)}
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Subjects Section */}
        <section id="courses" className="mb-12">
          <h2 className="bangla text-2xl font-bold text-gray-900 mb-6">আমার কোর্সসমূহ</h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {catalog?.subjects.map((subject: any) => {
                // Count total videos
                const totalVideos = subject.cycles.reduce((acc: number, cycle: any) => {
                  return acc + cycle.chapters.reduce((chAcc: number, chapter: any) => chAcc + chapter.videos.length, 0);
                }, 0);

                return (
                  <Link 
                    key={subject.id} 
                    to={`/subject/${subject.slug}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-1 group flex flex-col"
                  >
                    <div className="p-6 flex items-center gap-4 border-b border-gray-50 bg-slate-50">
                      <div className="w-14 h-14 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center text-3xl">
                        {subject.icon || '📚'}
                      </div>
                      <div>
                        <h3 className="bangla text-xl font-bold text-gray-900">{subject.name}</h3>
                        <p className="bangla text-sm text-gray-500">HSC সম্পূর্ণ সিলেবাস</p>
                      </div>
                    </div>
                    
                    <div className="p-6 flex-grow flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-gray-600">
                          <BookOpen className="w-5 h-5" />
                          <span className="bangla font-medium">{subject.cycles.length} সাইকেল</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <PlayCircle className="w-5 h-5" />
                          <span className="bangla font-medium">{totalVideos}+ ক্লাস</span>
                        </div>
                      </div>
                      
                      <div className="w-full py-2.5 bg-indigo-50 text-indigo-600 font-medium rounded-lg flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors bangla">
                        কোর্স দেখুন <ChevronRight className="w-5 h-5 ml-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

      </motion.div>
    </StudentLayout>
  );
}
