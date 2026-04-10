import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, PlayCircle, TrendingUp, CheckCircle } from 'lucide-react';
import { useCatalog } from '../contexts/CatalogContext';
import { useUserStats } from '../hooks/useUserStats';
import { Skeleton } from '../components/ui/Skeleton';

export default function ProgressPage() {
  const { catalog, isLoading } = useCatalog();
  const { stats } = useUserStats();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Calculate overall progress
  const { totalVideos, completedVideos, subjectProgress, recentlyCompleted } = useMemo(() => {
    if (!catalog) return { totalVideos: 0, completedVideos: 0, subjectProgress: [], recentlyCompleted: [] };

    let total = 0;
    let completed = 0;
    const subjProg: any[] = [];
    const completedList: any[] = [];

    for (const subject of catalog.subjects) {
      let subjTotal = 0;
      let subjCompleted = 0;
      const cyclesProg: any[] = [];

      for (const cycle of subject.cycles) {
        let cycleTotal = 0;
        let cycleCompleted = 0;

        for (const chapter of cycle.chapters) {
          for (const video of chapter.videos) {
            total++;
            subjTotal++;
            cycleTotal++;
            
            const completedStatus = stats.completedVideoIds.includes(video.id);
            if (completedStatus) {
              completed++;
              subjCompleted++;
              cycleCompleted++;
              
              const lastWatchedStr = localStorage.getItem(`nexusedu_last_watched_${video.id}`);
              const lastWatched = lastWatchedStr ? parseInt(lastWatchedStr, 10) : 0;
              
              completedList.push({
                video,
                subject,
                chapter,
                lastWatched
              });
            }
          }
        }
        
        if (cycleTotal > 0) {
          cyclesProg.push({
            id: cycle.id,
            name: cycle.name,
            total: cycleTotal,
            completed: cycleCompleted,
            percent: Math.round((cycleCompleted / cycleTotal) * 100)
          });
        }
      }

      if (subjTotal > 0) {
        subjProg.push({
          id: subject.id,
          name: subject.name,
          total: subjTotal,
          completed: subjCompleted,
          percent: Math.round((subjCompleted / subjTotal) * 100),
          cycles: cyclesProg
        });
      }
    }

    const recent = completedList.sort((a, b) => b.lastWatched - a.lastWatched).slice(0, 5);

    return {
      totalVideos: total,
      completedVideos: completed,
      subjectProgress: subjProg,
      recentlyCompleted: recent
    };
  }, [catalog, stats.completedVideoIds]);

  const overallPercent = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

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

  return (
    <div className={`min-h-screen bg-gray-50 pb-24 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <header className="bg-primary text-white pt-12 pb-6 px-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto">
          <h1 className="bangla text-2xl font-bold flex items-center">
            <TrendingUp className="w-6 h-6 mr-2" />
            আপনার অগ্রগতি
          </h1>
          <div className="mt-4">
            <div className="flex justify-between items-end mb-2">
              <span className="bangla text-sm font-medium text-white/80">সামগ্রিক সম্পন্ন</span>
              <span className="text-2xl font-bold">{overallPercent}%</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${overallPercent}%` }} 
              />
            </div>
            <p className="bangla text-xs text-white/60 mt-2">
              {totalVideos} টি ভিডিওর মধ্যে {completedVideos} টি সম্পন্ন হয়েছে
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <BookOpen className="w-6 h-6 text-primary mb-2" />
            <span className="text-2xl font-bold text-gray-900">{stats.completedCount}</span>
            <span className="bangla text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">সম্পন্ন ভিডিও</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <Clock className="w-6 h-6 text-secondary mb-2" />
            <span className="text-2xl font-bold text-gray-900">{stats.hoursWatched}</span>
            <span className="bangla text-xs text-gray-500 font-medium uppercase tracking-wider mt-1">ঘণ্টা দেখা হয়েছে</span>
          </div>
        </div>

        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <section>
            <h2 className="bangla text-xl font-bold text-gray-900 mb-4 flex items-center">
              <PlayCircle className="w-5 h-5 mr-2 text-primary" />
              দেখা চালিয়ে যান
            </h2>
            <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide snap-x">
              {continueWatching.map((item) => {
                const durationStr = item.video.duration || '00:00:00';
                const timeParts = durationStr.split(':').map(Number);
                let durationSecs = 0;
                if (timeParts.length === 3) durationSecs = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
                else if (timeParts.length === 2) durationSecs = timeParts[0] * 60 + timeParts[1];
                
                const percent = durationSecs > 0 ? Math.min(100, Math.round((item.progress / durationSecs) * 100)) : 0;

                return (
                  <Link 
                    key={item.video.id} 
                    to={`/watch/${item.video.id}`}
                    className="flex-none w-72 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden snap-start hover:-translate-y-1 hover:shadow-md transition-all duration-200"
                  >
                    <div className="h-2 bg-primary" />
                    <div className="p-5">
                      <p className="bangla text-xs font-semibold text-primary mb-1 uppercase tracking-wider">{item.subject.name_bn || item.subject.name}</p>
                      <h4 className="bangla font-bold text-gray-900 mb-1 line-clamp-2 h-10">{item.video.title_bn || item.video.title}</h4>
                      <p className="bangla text-xs text-gray-500 mb-4 truncate">{item.chapter.name_bn || item.chapter.name}</p>
                      
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="flex justify-between items-center text-xs font-medium">
                        <span className="bangla text-gray-500">{percent}% দেখা হয়েছে</span>
                        <span className="bangla text-primary">চালিয়ে যান →</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Per-Subject Progress */}
        <section>
          <h2 className="bangla text-xl font-bold text-gray-900 mb-4">বিষয়ভিত্তিক অগ্রগতি</h2>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {subjectProgress.map(subject => (
                <div key={subject.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="bangla font-bold text-gray-900 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-primary" />
                      {subject.name}
                    </h3>
                    <span className="text-sm font-bold text-primary">{subject.percent}%</span>
                  </div>
                  
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${subject.percent}%` }} />
                  </div>
                  
                  <div className="space-y-3 mt-4 border-t border-gray-50 pt-4">
                    {subject.cycles.map((cycle: any) => (
                      <div key={cycle.id} className="flex flex-col">
                        <div className="flex justify-between items-center mb-1 text-sm">
                          <span className="bangla text-gray-700 font-medium">{cycle.name}</span>
                          <span className="bangla text-gray-500 text-xs">{cycle.completed}/{cycle.total} ভিডিও</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-secondary transition-all duration-1000" style={{ width: `${cycle.percent}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recently Completed */}
        {recentlyCompleted.length > 0 && (
          <section>
            <h2 className="bangla text-xl font-bold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              সম্প্রতি সম্পন্ন
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {recentlyCompleted.map((item, index) => (
                <Link 
                  key={item.video.id}
                  to={`/watch/${item.video.id}`}
                  className={`block p-4 hover:bg-gray-50 transition-colors ${
                    index !== recentlyCompleted.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1 mr-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="bangla font-bold text-gray-900 text-sm mb-1">{item.video.title_bn || item.video.title}</h4>
                      <p className="bangla text-xs text-gray-500">
                        {item.subject.name_bn || item.subject.name} • {item.chapter.name_bn || item.chapter.name}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
