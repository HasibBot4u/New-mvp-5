import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, PlayCircle, ChevronDown, ChevronUp, Lock, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useChapterAccess } from '../hooks/useChapterAccess';
import { Skeleton } from '../components/ui/Skeleton';
import { StudentLayout } from '../components/layout/StudentLayout';
import { VideoCard } from '../components/shared/VideoCard';
import { EnrollmentCodeModal } from '../components/shared/EnrollmentCodeModal';
import { SEO } from '../components/SEO';

export function SubjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [subject, setSubject] = useState<any>(null);
  const [cycles, setCycles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCycles, setExpandedCycles] = useState<Record<string, boolean>>({});
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChapterForModal, setSelectedChapterForModal] = useState<any>(null);

  const { hasAccess, checkBatchAccess } = useChapterAccess();

  useEffect(() => {
    const fetchSubjectData = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        // Fetch subject by slug
        const { data: subjectData, error: subjectError } = await supabase
          .from('subjects')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .maybeSingle();

        if (subjectError || !subjectData) {
          setSubject(null);
          setIsLoading(false);
          return;
        }

        setSubject(subjectData);

        // Fetch cycles with chapters and videos
        const { data: cyclesData, error: cyclesError } = await supabase
          .from('cycles')
          .select('*, chapters(*, videos(id, title, title_bn, duration, display_order))')
          .eq('subject_id', subjectData.id)
          .eq('is_active', true)
          .order('display_order');

        if (cyclesError) throw cyclesError;

        // Sort chapters and videos
        const sortedCycles = (cyclesData || []).map(cycle => ({
          ...cycle,
          chapters: (cycle.chapters || [])
            .sort((a: any, b: any) => a.display_order - b.display_order)
            .map((chapter: any) => ({
              ...chapter,
              videos: (chapter.videos || []).sort((a: any, b: any) => a.display_order - b.display_order)
            }))
        }));

        setCycles(sortedCycles);

        // Expand first cycle by default
        if (sortedCycles.length > 0) {
          setExpandedCycles({ [sortedCycles[0].id]: true });
        }

        // Check access for all chapters
        const allChapterIds = sortedCycles.flatMap(c => c.chapters.map((ch: any) => ch.id));
        if (allChapterIds.length > 0) {
          await checkBatchAccess(allChapterIds);
        }

      } catch (error) {
        console.error('Error fetching subject data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjectData();
  }, [slug, checkBatchAccess]);

  const toggleCycle = (cycleId: string) => {
    setExpandedCycles(prev => ({
      ...prev,
      [cycleId]: !prev[cycleId]
    }));
  };

  const handleChapterClick = (chapter: any) => {
    if (chapter.requires_enrollment && !hasAccess(chapter.id)) {
      setSelectedChapterForModal(chapter);
      setModalOpen(true);
    } else {
      setSelectedChapter(chapter);
    }
  };

  const handleModalSuccess = () => {
    setModalOpen(false);
    if (selectedChapterForModal) {
      setSelectedChapter(selectedChapterForModal);
    }
  };

  if (isLoading) {
    return (
      <StudentLayout>
        <SEO title="লোড হচ্ছে... | NexusEdu" />
        <div className="max-w-7xl mx-auto h-[calc(100vh-8rem)]">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            <div className="lg:col-span-3"><Skeleton className="h-full w-full rounded-xl" /></div>
            <div className="lg:col-span-9"><Skeleton className="h-full w-full rounded-xl" /></div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (!subject) {
    return (
      <StudentLayout>
        <SEO title="বিষয় পাওয়া যায়নি | NexusEdu" />
        <div className="text-center p-12 min-h-[60vh] flex flex-col items-center justify-center">
          <p className="text-2xl bangla text-gray-600">বিষয়টি পাওয়া যায়নি</p>
          <button 
            onClick={() => navigate('/courses')} 
            className="mt-4 bangla px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            বিষয়সমূহে ফিরে যান
          </button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <SEO title={`${subject.name_bn || subject.name} | NexusEdu`} />
      <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
        <div className="mb-4 flex items-center gap-4 shrink-0">
          <button 
            onClick={() => navigate('/courses')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="bangla text-2xl font-bold text-gray-900">{subject.name_bn || subject.name}</h1>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          {/* Left Panel: Cycles & Chapters */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-slate-50 shrink-0">
              <h2 className="font-bold text-gray-900 bangla flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                সাইকেলসমূহ
              </h2>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2 space-y-2">
              {cycles.map(cycle => (
                <div key={cycle.id} className="border border-gray-100 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleCycle(cycle.id)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium text-gray-900 bangla text-sm text-left">{cycle.name_bn || cycle.name}</span>
                    {expandedCycles[cycle.id] ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  
                  {expandedCycles[cycle.id] && (
                    <div className="bg-white divide-y divide-gray-50">
                      {cycle.chapters.map((chapter: any) => {
                        const isLocked = chapter.requires_enrollment && !hasAccess(chapter.id);
                        const isSelected = selectedChapter?.id === chapter.id;
                        
                        return (
                          <button
                            key={chapter.id}
                            onClick={() => handleChapterClick(chapter)}
                            className={`w-full flex items-center justify-between p-3 text-left transition-colors ${
                              isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              {isLocked ? (
                                <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                              )}
                              <span className={`text-sm bangla truncate ${isSelected ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>
                                {chapter.name_bn || chapter.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              {isLocked && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded font-medium bangla">
                                  কোড দিন
                                </span>
                              )}
                              <span className="text-xs text-gray-400 font-medium">
                                {chapter.videos.length}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                      {cycle.chapters.length === 0 && (
                        <div className="p-3 text-sm text-gray-500 bangla text-center">
                          কোনো চ্যাপ্টার নেই
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {cycles.length === 0 && (
                <div className="p-4 text-center text-gray-500 bangla">
                  কোনো সাইকেল পাওয়া যায়নি
                </div>
              )}
            </div>
          </div>

          {/* Main Panel: Videos */}
          <div className="lg:col-span-9 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            {selectedChapter ? (
              <>
                <div className="p-4 border-b border-gray-100 bg-slate-50 shrink-0 flex justify-between items-center">
                  <h2 className="font-bold text-gray-900 bangla flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-indigo-600" />
                    {selectedChapter.name_bn || selectedChapter.name}
                  </h2>
                  <span className="text-sm text-gray-500 bangla">
                    {selectedChapter.videos.length} টি ক্লাস
                  </span>
                </div>
                <div className="overflow-y-auto flex-1 p-6">
                  {selectedChapter.videos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {selectedChapter.videos.map((video: any) => (
                        <VideoCard 
                          key={video.id} 
                          video={video} 
                          onClick={() => navigate(`/watch/${video.id}`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                      <PlayCircle className="w-12 h-12 mb-2 opacity-20" />
                      <p className="bangla">এই চ্যাপ্টারে কোনো ভিডিও নেই</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                <p className="bangla text-lg">বাম থেকে একটি চ্যাপ্টার বেছে নিন</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <EnrollmentCodeModal
        isOpen={modalOpen}
        chapterId={selectedChapterForModal?.id || ''}
        chapterName={selectedChapterForModal?.name_bn || selectedChapterForModal?.name || ''}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </StudentLayout>
  );
}
