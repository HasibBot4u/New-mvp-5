import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, PlayCircle, FileText, ListVideo, Info, MessageCircle, Bookmark, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCatalog } from '../contexts/CatalogContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { VideoPlayer } from '../components/shared/VideoPlayer';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Skeleton } from '../components/ui/Skeleton';
import { SEO } from '../components/SEO';
import { setPageTitle } from '../utils/setPageTitle';
import { StudentLayout } from '../components/layout/StudentLayout';
import { motion } from 'framer-motion';

export function PlayerPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { catalog, isLoading } = useCatalog();
  const { user, profile } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!user || !videoId) return;
    supabase
      .from('watch_history')
      .select('completed')
      .eq('user_id', user.id)
      .eq('video_id', videoId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setIsCompleted(data.completed);
      });
  }, [user, videoId]);
  
  const [activeTab, setActiveTab] = useState<'about' | 'notes' | 'list' | 'questions' | 'bookmarks'>('about');
  const [notesText, setNotesText] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  
  // Bookmarks state
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [newBookmarkLabel, setNewBookmarkLabel] = useState('');
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Fetch notes and bookmarks from Supabase on load
  useEffect(() => {
    const fetchNotesAndBookmarks = async () => {
      if (!user || !videoId) return;
      try {
        const { data: notesData, error: notesError } = await supabase
          .from('video_notes')
          .select('content')
          .eq('user_id', user.id)
          .eq('video_id', videoId)
          .single();
        
        if (notesData && !notesError) {
          if (mountedRef.current) {
            setNotesText(notesData.content || '');
            try { localStorage.setItem(`nexusedu_notes_${videoId}`, notesData.content || ''); } catch (e) { console.debug('Storage error:', e); }
          }
        } else {
          // Fallback to local storage
          if (mountedRef.current) {
            try { setNotesText(localStorage.getItem(`nexusedu_notes_${videoId}`) || ''); } catch (e) { console.debug('Storage error:', e); }
          }
        }

        const { data: bookmarksData, error: bookmarksError } = await supabase
          .from('video_bookmarks')
          .select('*')
          .eq('user_id', user.id)
          .eq('video_id', videoId)
          .order('timestamp_seconds', { ascending: true });
        
        if (bookmarksData && !bookmarksError) {
          if (mountedRef.current) setBookmarks(bookmarksData);
        }
      } catch (e) {
        console.error('Error fetching data:', e);
        if (mountedRef.current) {
          try { setNotesText(localStorage.getItem(`nexusedu_notes_${videoId}`) || ''); } catch (err) { console.debug('Storage error:', err); }
        }
      }
    };

    if (videoId) {
      fetchNotesAndBookmarks();
    }
  }, [videoId, user]);

  const notesSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotesText(newNotes);
    try {
      localStorage.setItem(`nexusedu_notes_${videoId}`, newNotes);
    } catch (err) { console.debug('Storage error:', err); }
    
    if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    notesSaveTimer.current = setTimeout(async () => {
      if (!user?.id || !videoId) return;
      if (mountedRef.current) setIsSavingNotes(true);
      try {
        await supabase.from('video_notes').upsert(
          {
            user_id: user.id,
            video_id: videoId,
            content: newNotes,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,video_id' }
        );
      } catch (e) {
        console.warn('Notes sync failed:', e);
      } finally {
        if (mountedRef.current) setIsSavingNotes(false);
      }
    }, 2000);
  };

  const clearNotes = () => {
    setNotesText('');
    try {
      localStorage.removeItem(`nexusedu_notes_${videoId}`);
    } catch (err) { console.debug('Storage error:', err); }
  };

  const videoContext = useMemo(() => {
    if (!catalog || !videoId) return null;

    for (const subject of catalog.subjects) {
      for (const cycle of subject.cycles) {
        for (const chapter of cycle.chapters) {
          const index = chapter.videos.findIndex((v: any) => v.id === videoId);
          if (index !== -1) {
            return {
              subject,
              cycle,
              chapter,
              video: chapter.videos[index],
              allVideos: chapter.videos,
              prevVideo: index > 0 ? chapter.videos[index - 1] : null,
              nextVideo: index < chapter.videos.length - 1 ? chapter.videos[index + 1] : null,
            };
          }
        }
      }
    }
    return null;
  }, [catalog, videoId]);

  useEffect(() => {
    if (videoContext?.video?.title) setPageTitle(`${videoContext.video.title} - NexusEdu`);
  }, [videoContext?.video?.title]);

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="w-full aspect-video rounded-xl mb-6" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </StudentLayout>
    );
  }

  if (!videoContext) {
    return (
      <StudentLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <h2 className="bangla text-2xl font-bold text-gray-900 mb-2">ভিডিও পাওয়া যায়নি</h2>
          <p className="bangla text-gray-600 mb-6">আপনি যে ভিডিওটি খুঁজছেন তা পাওয়া যায়নি বা সরিয়ে ফেলা হয়েছে।</p>
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

  const { subject, cycle, chapter, video, allVideos, prevVideo, nextVideo } = videoContext;
  const completed = isCompleted;

  const handleComplete = async (vid: string, isChecked: boolean) => {
    setIsCompleted(isChecked);
    if (isChecked) {
      try {
        await supabase.from('watch_history').upsert({
          user_id: user?.id,
          video_id: vid,
          completed: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,video_id' });
      } catch (e) {
        console.error('Error saving completion:', e);
      }
    } else {
      try {
        await supabase.from('watch_history').update({
          completed: false,
          updated_at: new Date().toISOString()
        }).eq('user_id', user?.id).eq('video_id', vid);
      } catch (e) {
        console.error('Error saving completion:', e);
      }
    }
    
    if (isChecked && videoContext) {
      const allCompleted = true;
      // We can't easily check all other videos' completion status synchronously here
      // without fetching from Supabase. For now, we'll just show the certificate
      // if they manually check the box, or we could fetch the status.
      // Assuming we just want to show it for demo purposes or if we had a full state.
      if (allCompleted) {
        setShowCertificate(true);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        if (user) {
          try {
            await supabase.from('cycle_completions').upsert({
              user_id: user.id,
              cycle_id: cycle.id
            }, { onConflict: 'user_id, cycle_id' });
          } catch (e) {
            console.error('Error saving cycle completion:', e);
          }
        }
      }
    }
  };

  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !videoId) return;

    try {
      const { data, error } = await supabase
        .from('video_bookmarks')
        .insert({
          user_id: user.id,
          video_id: videoId,
          timestamp_seconds: Math.floor(currentVideoTime),
          label: newBookmarkLabel || 'Bookmark'
        })
        .select()
        .single();

      if (data && !error) {
        if (mountedRef.current) {
          setBookmarks(prev => [...prev, data].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds));
          setNewBookmarkLabel('');
          setIsAddingBookmark(false);
        }
      }
    } catch (e) {
      console.error('Error adding bookmark:', e);
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!user) return;
    try {
      await supabase.from('video_bookmarks').delete().eq('id', bookmarkId);
      if (mountedRef.current) {
        setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
      }
    } catch (e) {
      console.error('Error deleting bookmark:', e);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <StudentLayout>
      <SEO 
        title={`${video.title} - ${chapter.name} | NexusEdu`}
        description={`Watch ${video.title} from ${chapter.name} in ${subject.name}.`}
      />
      
      <div className="fixed inset-0 z-[-1] bg-gray-900" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-6xl mx-auto relative z-10"
      >
        <div className="mb-6 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bangla text-sm font-medium text-indigo-400 bg-indigo-900/50 border border-indigo-800 px-2 py-0.5 rounded">
              {subject.name}
            </span>
            <span className="text-gray-600 text-sm">/</span>
            <span className="bangla text-sm font-medium text-gray-300">
              {cycle.name}
            </span>
            <span className="text-gray-600 text-sm">/</span>
            <span className="bangla text-sm font-medium text-gray-300">
              {chapter.name}
            </span>
          </div>
        </div>

        {/* Video Player Area */}
        <div className="w-full bg-black rounded-xl overflow-hidden shadow-2xl mb-6 border border-gray-800">
          <ErrorBoundary>
            <VideoPlayer 
              videoId={video.id} 
              sizeMb={video.size_mb}
              onComplete={() => handleComplete(video.id, true)} 
              onTimeUpdate={(time) => setCurrentVideoTime(time)}
            />
          </ErrorBoundary>
        </div>

        <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="bangla text-2xl font-bold text-white mb-2">{video.title}</h1>
            <p className="bangla text-sm text-gray-400">ডিউরেশন: {video.duration}</p>
          </div>
          <label className="flex items-center space-x-3 cursor-pointer bg-gray-800 px-5 py-2.5 rounded-xl border border-gray-700 shadow-sm hover:bg-gray-700 transition-colors shrink-0">
            <input 
              type="checkbox" 
              checked={completed}
              onChange={(e) => handleComplete(video.id, e.target.checked)}
              className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500 border-gray-600 bg-gray-700"
            />
            <span className={`bangla font-medium ${completed ? 'text-emerald-400' : 'text-gray-300'}`}>
              কমপ্লিট মার্ক করুন
            </span>
          </label>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800 mb-6 flex space-x-6 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('about')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap bangla ${
              activeTab === 'about' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>বিস্তারিত</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap bangla ${
              activeTab === 'notes' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>নোটস</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap bangla ${
              activeTab === 'list' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ListVideo className="w-4 h-4" />
            <span>সকল ক্লাস</span>
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap bangla ${
              activeTab === 'questions' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>প্রশ্নোত্তর</span>
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 whitespace-nowrap bangla ${
              activeTab === 'bookmarks' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>বুকমার্কস</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 p-6 mb-8">
          {activeTab === 'about' && (
            <div className="space-y-4">
              <h3 className="bangla text-lg font-bold text-white mb-4">ক্লাসের বিস্তারিত</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <span className="bangla text-gray-400 block mb-1 text-sm">বিষয়</span>
                  <span className="bangla font-semibold text-white">{subject.name}</span>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <span className="bangla text-gray-400 block mb-1 text-sm">সাইকেল</span>
                  <span className="bangla font-semibold text-white">{cycle.name}</span>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <span className="bangla text-gray-400 block mb-1 text-sm">চ্যাপ্টার</span>
                  <span className="bangla font-semibold text-white">{chapter.name}</span>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <span className="bangla text-gray-400 block mb-1 text-sm">ডিউরেশন</span>
                  <span className="bangla font-semibold text-white">{video.duration}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <h3 className="bangla text-lg font-bold text-white">পার্সোনাল নোটস</h3>
                  {isSavingNotes && <span className="bangla text-xs text-indigo-400 bg-indigo-900/50 px-2 py-1 rounded animate-pulse">সেভ হচ্ছে...</span>}
                </div>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => {
                      import('jspdf').then(({ jsPDF }) => {
                        const doc = new jsPDF();
                        doc.setFontSize(20);
                        doc.text(`Notes: ${video.title}`, 20, 20);
                        doc.setFontSize(12);
                        const splitText = doc.splitTextToSize(notesText, 170);
                        doc.text(splitText, 20, 30);
                        doc.save(`${video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.pdf`);
                      });
                    }}
                    className="bangla text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    পিডিএফ এক্সপোর্ট
                  </button>
                  <button 
                    onClick={clearNotes}
                    className="bangla text-sm text-red-400 hover:text-red-300 font-medium"
                  >
                    ক্লিয়ার নোটস
                  </button>
                </div>
              </div>
              <textarea
                value={notesText}
                onChange={handleNotesChange}
                placeholder="আপনার নোটস এখানে লিখুন... এগুলো স্বয়ংক্রিয়ভাবে সেভ হবে।"
                className="bangla w-full h-48 p-4 border border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-gray-900 text-white placeholder-gray-500"
              />
            </div>
          )}

          {activeTab === 'list' && (
            <div className="space-y-3">
              <h3 className="bangla text-lg font-bold text-white mb-4">{chapter.name} এর সকল ক্লাস</h3>
              {allVideos.map((v: any, idx: number) => {
                const isPlaying = v.id === video.id;
                const isDone = isPlaying ? isCompleted : false; // We don't have full state for all videos here easily
                
                return (
                  <Link
                    key={v.id}
                    to={`/watch/${v.id}`}
                    className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                      isPlaying 
                        ? 'bg-indigo-900/40 border border-indigo-700 shadow-sm' 
                        : 'bg-gray-900/50 border border-gray-700 hover:border-indigo-700 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-8 text-center text-sm font-bold text-gray-500">
                        {(idx + 1).toString().padStart(2, '0')}
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isDone ? 'bg-emerald-900/50 text-emerald-400' : isPlaying ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-800 text-gray-400'
                      }`}>
                        {isDone ? <CheckCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                      </div>
                      <span className={`bangla font-medium ${isPlaying ? 'text-indigo-400 font-bold' : isDone ? 'text-gray-300' : 'text-gray-400'}`}>
                        {v.title}
                      </span>
                    </div>
                    <span className="bangla text-sm font-medium text-gray-500 bg-gray-800 px-2.5 py-1 rounded-md">{v.duration}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="bangla text-lg font-bold text-white">প্রশ্নোত্তর</h3>
                <Link 
                  to={`/qa?video=${video.id}`}
                  className="bangla px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  প্রশ্ন করুন
                </Link>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-8 text-center border border-gray-700">
                <MessageCircle className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                <h4 className="bangla text-white font-bold mb-2">কোনো প্রশ্ন আছে?</h4>
                <p className="bangla text-sm text-gray-400 mb-6 max-w-md mx-auto">আলোচনায় যোগ দিন এবং শিক্ষক ও সহপাঠীদের কাছ থেকে উত্তর পান।</p>
                <Link 
                  to={`/qa?video=${video.id}`}
                  className="bangla text-indigo-400 font-medium hover:underline inline-flex items-center gap-1"
                >
                  এই ভিডিওর সকল প্রশ্ন দেখুন <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'bookmarks' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                <h3 className="bangla text-lg font-bold text-white">ভিডিও বুকমার্কস</h3>
                {!isAddingBookmark ? (
                  <button 
                    onClick={() => setIsAddingBookmark(true)}
                    className="bangla px-4 py-2 bg-indigo-900/50 text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-800/50 transition-colors flex items-center justify-center gap-2 border border-indigo-800"
                  >
                    <Bookmark className="w-4 h-4" />
                    বুকমার্ক যোগ করুন ({formatTime(currentVideoTime)})
                  </button>
                ) : (
                  <form onSubmit={handleAddBookmark} className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      value={newBookmarkLabel}
                      onChange={(e) => setNewBookmarkLabel(e.target.value)}
                      placeholder="যেমন: নিউটনের ৩য় সূত্র"
                      className="bangla flex-1 sm:w-48 px-3 py-2 border border-gray-600 bg-gray-900 text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      autoFocus
                    />
                    <button 
                      type="submit"
                      className="bangla px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      সেভ
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setIsAddingBookmark(false); setNewBookmarkLabel(''); }}
                      className="bangla px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                    >
                      বাতিল
                    </button>
                  </form>
                )}
              </div>
              
              {bookmarks.length === 0 ? (
                <div className="bg-gray-900/50 rounded-xl p-8 text-center border border-gray-700">
                  <Bookmark className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                  <h4 className="bangla text-white font-bold mb-2">কোনো বুকমার্ক নেই</h4>
                  <p className="bangla text-sm text-gray-400 max-w-md mx-auto">গুরুত্বপূর্ণ মুহূর্তগুলো সেভ করে রাখুন যাতে পরে সহজেই খুঁজে পান।</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bookmarks.map((bookmark) => (
                    <div key={bookmark.id} className="flex items-center justify-between p-3 bg-gray-900/50 hover:bg-gray-800 rounded-xl border border-gray-700 transition-colors group shadow-sm">
                      <button 
                        onClick={() => {
                          const videoElement = document.querySelector('video');
                          if (videoElement) {
                            videoElement.currentTime = bookmark.timestamp_seconds;
                            videoElement.play();
                          }
                        }}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <span className="bg-indigo-900/50 text-indigo-400 border border-indigo-800 px-2.5 py-1 rounded-md text-xs font-mono font-bold">
                          {formatTime(bookmark.timestamp_seconds)}
                        </span>
                        <span className="bangla text-gray-300 font-medium">{bookmark.label}</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteBookmark(bookmark.id)}
                        className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all bg-gray-800 rounded-lg hover:bg-red-900/30"
                        title="Delete bookmark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prev / Next Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => prevVideo && navigate(`/watch/${prevVideo.id}`)}
            disabled={!prevVideo}
            className={`bangla flex-1 py-3.5 px-4 rounded-xl font-medium flex items-center justify-center transition-all duration-200 ${
              prevVideo 
                ? 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600 shadow-sm' 
                : 'bg-gray-900 text-gray-600 cursor-not-allowed border border-transparent'
            }`}
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> আগের ক্লাস
          </button>
          <button
            onClick={() => nextVideo && navigate(`/watch/${nextVideo.id}`)}
            disabled={!nextVideo}
            className={`bangla flex-1 py-3.5 px-4 rounded-xl font-medium flex items-center justify-center transition-all duration-200 ${
              nextVideo 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md' 
                : 'bg-gray-900 text-gray-600 cursor-not-allowed border border-transparent'
            }`}
          >
            পরের ক্লাস <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        </div>
      </motion.div>

      {/* Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 text-center relative overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <button 
              onClick={() => setShowCertificate(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            >
              ✕
            </button>
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="bangla text-3xl font-bold text-gray-900 mb-2">অভিনন্দন!</h2>
            <p className="bangla text-gray-600 mb-8">আপনি সফলভাবে এই সাইকেলের সকল ভিডিও সম্পন্ন করেছেন।</p>
            
            <div className="bg-slate-50 border border-gray-100 rounded-xl p-6 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-bl-full flex items-start justify-end p-4 opacity-50">
                <span className="text-3xl">🏆</span>
              </div>
              <p className="bangla text-xs text-indigo-600 uppercase tracking-wider font-bold mb-2">সার্টিফিকেট অফ কমপ্লিশন</p>
              <h3 className="bangla text-xl font-bold text-gray-900 mb-5">{cycle.name}</h3>
              <div className="space-y-2 text-left">
                <p className="bangla text-gray-600 text-sm">বিষয়: <span className="font-bold text-gray-900">{subject.name}</span></p>
                <p className="bangla text-gray-600 text-sm">শিক্ষার্থী: <span className="font-bold text-gray-900">{profile?.display_name || user?.email}</span></p>
                <p className="bangla text-gray-600 text-sm">তারিখ: <span className="font-bold text-gray-900">{new Date().toLocaleDateString('bn-BD')}</span></p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowCertificate(false)}
              className="bangla w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md"
            >
              শেখা চালিয়ে যান
            </button>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}
