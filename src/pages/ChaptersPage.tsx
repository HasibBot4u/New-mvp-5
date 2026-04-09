import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, PlayCircle, ChevronRight, FileText } from 'lucide-react';
import { useCatalog } from '../contexts/CatalogContext';
import { Skeleton } from '../components/ui/Skeleton';
import { supabase } from '../lib/supabase';
import { StudentLayout } from '../components/layout/StudentLayout';
import { SEO } from '../components/SEO';
import { motion } from 'framer-motion';

export function ChaptersPage() {
  const { cycleId } = useParams<{ cycleId: string }>();
  const navigate = useNavigate();
  const { catalog, isLoading } = useCatalog();
  const [quizCounts, setQuizCounts] = useState<Record<string, number>>({});

  const data = useMemo(() => {
    if (!catalog || !cycleId) return null;

    for (const subject of catalog.subjects) {
      const cycle = subject.cycles.find((c: any) => c.id === cycleId);
      if (cycle) {
        return { subject, cycle };
      }
    }
    return null;
  }, [catalog, cycleId]);

  useEffect(() => {
    if (data?.cycle?.chapters) {
      const fetchQuizCounts = async () => {
        try {
          const chapterIds = data.cycle.chapters.map((c: any) => c.id);
          const { data: quizzes, error } = await supabase
            .from('quizzes')
            .select('chapter_id')
            .in('chapter_id', chapterIds)
            .eq('is_published', true);
            
          if (error) throw error;
          
          const counts: Record<string, number> = {};
          quizzes?.forEach(q => {
            counts[q.chapter_id] = (counts[q.chapter_id] || 0) + 1;
          });
          setQuizCounts(counts);
        } catch (error: any) {
          if (error.code !== 'PGRST205') {
            console.error('Error fetching quiz counts:', error);
          }
        }
      };
      fetchQuizCounts();
    }
  }, [data]);

  if (isLoading) {
    return (
      <StudentLayout>
        <SEO title="লোড হচ্ছে... | NexusEdu" />
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!data) {
    return (
      <StudentLayout>
        <SEO title="সাইকেল পাওয়া যায়নি | NexusEdu" />
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <h2 className="bangla text-2xl font-bold text-gray-900 mb-2">সাইকেল পাওয়া যায়নি</h2>
          <p className="bangla text-gray-600 mb-6">আপনি যে সাইকেলটি খুঁজছেন তা পাওয়া যায়নি।</p>
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

  const { cycle, subject } = data;

  return (
    <StudentLayout>
      <SEO title={`${cycle.name} | NexusEdu`} />
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
            <div className="flex items-center gap-2 mb-1">
              <span className="bangla text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {subject.name}
              </span>
            </div>
            <h1 className="bangla text-3xl font-bold text-gray-900 mb-1">{cycle.name}</h1>
            <p className="bangla text-gray-600">সকল চ্যাপ্টারসমূহ</p>
          </div>
        </div>

        {cycle.chapters.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
            <p className="bangla text-gray-500 font-medium">এখনো কোনো চ্যাপ্টার যোগ করা হয়নি। 📚</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cycle.chapters.map((chapter: any, index: number) => (
              <Link
                key={chapter.id}
                to={`/chapter/${chapter.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-1 group flex flex-col"
              >
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <h3 className="bangla text-xl font-bold text-gray-900 line-clamp-2">{chapter.name}</h3>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-6 text-sm font-medium text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <PlayCircle className="w-4 h-4 text-indigo-500" />
                      <span className="bangla">{chapter.videos?.length || 0} ভিডিও</span>
                    </div>
                    {quizCounts[chapter.id] > 0 && (
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-500" />
                        <span className="bangla">{quizCounts[chapter.id]} কুইজ</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-indigo-600 font-medium bangla group-hover:text-indigo-700">
                    <span>চ্যাপ্টার দেখুন</span>
                    <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </StudentLayout>
  );
}
