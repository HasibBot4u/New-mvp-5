import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Atom, Beaker, Calculator, AlertTriangle, PlayCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Skeleton } from '../components/ui/Skeleton';
import { StudentLayout } from '../components/layout/StudentLayout';
import { SEO } from '../components/SEO';
import { motion } from 'framer-motion';

export function CoursesPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*, cycles(chapters(videos(id)))')
          .eq('is_active', true)
          .order('display_order');
        
        if (error) throw error;
        setSubjects(data || []);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const getSubjectStyle = (name: string, thumbnailColor: string) => {
    if (name.includes('Physics') || name.includes('পদার্থ')) {
      return { icon: Atom, gradient: 'from-blue-500 to-blue-700' };
    }
    if (name.includes('Chemistry') || name.includes('রসায়ন')) {
      return { icon: Beaker, gradient: 'from-purple-500 to-purple-700' };
    }
    if (name.includes('Math') || name.includes('গণিত')) {
      return { icon: Calculator, gradient: 'from-green-500 to-green-700' };
    }
    return { icon: Atom, gradient: thumbnailColor || 'from-indigo-500 to-indigo-700' };
  };

  return (
    <StudentLayout>
      <SEO title="বিষয়সমূহ | NexusEdu" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="bangla text-3xl font-bold text-gray-900 mb-2">বিষয়সমূহ</h1>
          <p className="bangla text-gray-600">আপনার প্রয়োজনীয় বিষয় নির্বাচন করুন</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 bangla mb-2">বিষয় লোড করতে সমস্যা হয়েছে</h3>
            <p className="text-gray-600 bangla mb-4">অনুগ্রহ করে পেজটি রিলোড করুন অথবা কিছুক্ষণ পর আবার চেষ্টা করুন।</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors bangla font-medium"
            >
              রিলোড করুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subjects.map((subject) => {
              const { icon: Icon, gradient } = getSubjectStyle(subject.name, subject.thumbnail_color);
              
              // Count videos from nested relation
              let videoCount = 0;
              if (subject.cycles) {
                subject.cycles.forEach((cycle: any) => {
                  if (cycle.chapters) {
                    cycle.chapters.forEach((chapter: any) => {
                      if (chapter.videos) {
                        videoCount += chapter.videos.length;
                      }
                    });
                  }
                });
              }

              return (
                <Link 
                  key={subject.id} 
                  to={`/subject/${subject.slug}`}
                  className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 group relative overflow-hidden flex flex-col h-48`}
                >
                  {/* Decorative background elements */}
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                  <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-black/10 rounded-full blur-xl" />
                  
                  <div className="relative z-10 flex justify-between items-start mb-auto">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10">
                      <PlayCircle className="w-3.5 h-3.5 text-white/90" />
                      <span className="text-white/90 text-xs font-medium bangla">{videoCount} ক্লাস</span>
                    </div>
                  </div>
                  
                  <div className="relative z-10 mt-4">
                    <h3 className="bangla text-2xl font-bold text-white mb-1">{subject.name_bn || subject.name}</h3>
                    <p className="text-white/70 text-sm font-medium">{subject.name}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </motion.div>
    </StudentLayout>
  );
}
