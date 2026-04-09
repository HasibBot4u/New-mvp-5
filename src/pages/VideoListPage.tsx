import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, PlayCircle, FileText, Clock } from 'lucide-react';
import { useCatalog } from '../contexts/CatalogContext';
import { Skeleton } from '../components/ui/Skeleton';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { StudentLayout } from '../components/layout/StudentLayout';
import { SEO } from '../components/SEO';
import { motion } from 'framer-motion';

export function VideoListPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const { catalog, isLoading } = useCatalog();
  const [, setQuizzes] = useState<any[]>([]);
  const [, setIsLoadingQuizzes] = useState(true);

  const data = useMemo(() => {
    if (!catalog || !chapterId) return null;

    for (const subject of catalog.subjects) {
      for (const cycle of subject.cycles) {
        const chapter = cycle.chapters.find((c: any) => c.id === chapterId);
        if (chapter) {
          return { subject, cycle, chapter };
        }
      }
    }
    return null;
  }, [catalog, chapterId]);

  const videos = useMemo(() => {
    if (!data) return [];
    return data.chapter.videos || [];
  }, [data]);

  useEffect(() => {
    if (!videos || videos.length === 0) return;
    
    // Fire prefetch for all videos in this chapter
    // Stagger by 200ms each to avoid hammering the backend
    videos.forEach((video: any, index: number) => {
      setTimeout(() => {
        api.prefetchVideo(video.id);
      }, index * 200);
    });
  }, [videos]);

  useEffect(() => {
    if (chapterId) {
      fetchQuizzes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId]);

  const fetchQuizzes = async () => {
    setIsLoadingQuizzes(true);
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('chapter_id', chapterId)
        .eq('is_published', true)
        .order('created_at', { ascending: true });
        
      if (error) {
        // Ignore missing table error gracefully
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
          setQuizzes([]);
          return;
        }
        throw error;
      }
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setQuizzes([]);
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  if (isLoading) {
    return (
      <StudentLayout>
        <SEO title="লোড হচ্ছে... | NexusEdu" />
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!data) {
    return (
      <StudentLayout>
        <SEO title="চ্যাপ্টার পাওয়া যায়নি | NexusEdu" />
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <h2 className="bangla text-2xl font-bold text-gray-900 mb-2">চ্যাপ্টার পাওয়া যায়নি</h2>
          <p className="bangla text-gray-600 mb-6">আপনি যে চ্যাপ্টারটি খুঁজছেন তা পাওয়া যায়নি।</p>
          <button 
            onClick={() => navigate('/courses')}
            className="bangla px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            কোর্সে ফিরে যান
          </button>
        </div>
      </StudentLayout>
    );
  }

  const { chapter, cycle, subject } = data;

  return (
    <StudentLayout>
      <SEO title={`${chapter.name} | NexusEdu`} />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto"
      >
        <div className="mb-8 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="bangla text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {subject.name}
              </span>
              <span className="text-gray-400 text-sm">/</span>
              <span className="bangla text-sm font-medium text-gray-600">
                {cycle.name}
              </span>
            </div>
            <h1 className="bangla text-3xl font-bold text-gray-900 mb-1">{chapter.name}</h1>
            <p className="bangla text-gray-600">সকল ক্লাসসমূহ</p>
          </div>
        </div>
        
        {videos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
            <p className="bangla text-gray-500 font-medium">এখনো কোনো ক্লাস যোগ করা হয়নি। 🎥</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video: any, index: number) => (
              <div 
                key={video.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-1 flex flex-col group"
              >
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img 
                    src={`https://picsum.photos/seed/${video.id}/600/400`}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 bg-indigo-600/90 rounded-full flex items-center justify-center text-white shadow-lg backdrop-blur-sm">
                      <PlayCircle className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="mt-1 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {index + 1}
                    </div>
                    <h3 className="bangla text-lg font-bold text-gray-900 line-clamp-2 leading-tight">
                      {video.title}
                    </h3>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50">
                    <p className="bangla text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">স্টাডি ম্যাটেরিয়ালস</p>
                    <div className="flex flex-wrap gap-2 mb-5">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium bangla">
                        <FileText className="w-3.5 h-3.5" /> লেকচার শিট
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium bangla">
                        <FileText className="w-3.5 h-3.5" /> প্র্যাকটিস শিট
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => navigate(`/watch/${video.id}`)}
                      className="bangla w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <PlayCircle className="w-4 h-4" /> ক্লাস শুরু করুন
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </StudentLayout>
  );
}
