import { useState, useEffect } from 'react';
import { Radio, Clock, Calendar, ExternalLink, Video } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Skeleton } from '../components/ui/Skeleton';
import { Breadcrumb } from '../components/ui/Breadcrumb';

interface LiveClass {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_url: string;
  is_cancelled: boolean;
  subjects?: {
    name: string;
  };
}

export function LiveClassPage() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveClasses() {
      try {
        const { data, error } = await supabase
          .from('live_classes')
          .select(`
            *,
            subjects (name)
          `)
          .gte('scheduled_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Show classes from last 24h and future
          .order('scheduled_at', { ascending: true });

        if (error) throw error;
        setClasses(data || []);
      } catch (err) {
        console.error('Error fetching live classes:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLiveClasses();
  }, []);

  const getSubjectStyle = (name: string = '') => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('physics') || lowerName.includes('পদার্থ')) {
      return { bg: 'bg-blue-500', color: 'text-blue-600', lightBg: 'bg-blue-50' };
    }
    if (lowerName.includes('chemistry') || lowerName.includes('রসায়ন')) {
      return { bg: 'bg-emerald-500', color: 'text-emerald-600', lightBg: 'bg-emerald-50' };
    }
    if (lowerName.includes('math') || lowerName.includes('গণিত')) {
      return { bg: 'bg-orange-500', color: 'text-orange-600', lightBg: 'bg-orange-50' };
    }
    return { bg: 'bg-primary', color: 'text-primary', lightBg: 'bg-primary/10' };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('bn-BD', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getDateGroup = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'আজ';
    if (date.toDateString() === tomorrow.toDateString()) return 'আগামীকাল';
    
    return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const groupedClasses = classes.reduce((acc, cls) => {
    const group = getDateGroup(cls.scheduled_at);
    if (!acc[group]) acc[group] = [];
    acc[group].push(cls);
    return acc;
  }, {} as Record<string, LiveClass[]>);

  const isLiveNow = (scheduledAt: string, durationMinutes: number) => {
    const now = new Date();
    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + durationMinutes * 60000);
    return now >= start && now <= end;
  };

  const isUpcoming = (scheduledAt: string) => {
    const now = new Date();
    const start = new Date(scheduledAt);
    // Consider it upcoming if it's more than 15 minutes in the future
    return start.getTime() - now.getTime() > 15 * 60000;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-dark pb-24 pt-20">
        <div className="max-w-4xl mx-auto px-4">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-dark pb-24 pt-20">
      <div className="max-w-4xl mx-auto px-4">
        <Breadcrumb items={[
          { label: 'Home', href: '/' },
          { label: 'Live Classes' },
        ]} />

        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
            <Radio className="w-8 h-8 text-red-500" />
            লাইভ ক্লাস
          </h1>
          <p className="text-text-secondary mt-2" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
            আগামী লাইভ ক্লাসগুলোর সময়সূচি
          </p>
        </div>

        {Object.keys(groupedClasses).length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-border">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>কোনো লাইভ ক্লাস নেই</h3>
            <p className="text-text-secondary" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
              আপাতত কোনো লাইভ ক্লাস শিডিউল করা নেই।
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedClasses).map(([group, groupClasses]) => (
              <div key={group}>
                <h2 className="text-xl font-bold text-text-primary mb-4 border-b border-border pb-2" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                  {group}
                </h2>
                <div className="space-y-4">
                  {groupClasses.map(cls => {
                    const style = getSubjectStyle(cls.subjects?.name);
                    const liveNow = isLiveNow(cls.scheduled_at, cls.duration_minutes);
                    const upcoming = isUpcoming(cls.scheduled_at);
                    const isPast = !liveNow && !upcoming && new Date() > new Date(cls.scheduled_at);

                    return (
                      <div key={cls.id} className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${liveNow ? 'border-red-200 shadow-red-100' : 'border-border'} flex flex-col md:flex-row relative`}>
                        <div className={`w-full md:w-2 ${style.bg}`}></div>
                        
                        <div className="p-6 flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs font-bold px-2 py-1 rounded-md ${style.lightBg} ${style.color} uppercase tracking-wider`}>
                                {cls.subjects?.name || 'Subject'}
                              </span>
                              {liveNow && (
                                <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md animate-pulse" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                                  চলছে
                                </span>
                              )}
                              {cls.is_cancelled && (
                                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                                  বাতিল
                                </span>
                              )}
                            </div>
                            
                            <h3 className="text-xl font-bold text-text-primary mb-2">{cls.title}</h3>
                            {cls.description && (
                              <p className="text-sm text-text-secondary mb-4 line-clamp-2">{cls.description}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-text-secondary font-medium" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatTime(cls.scheduled_at)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{cls.duration_minutes} মিনিট</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="w-full md:w-auto mt-4 md:mt-0">
                            {cls.is_cancelled ? (
                              <button disabled className="w-full md:w-auto px-6 py-3 bg-gray-100 text-gray-400 font-bold rounded-xl cursor-not-allowed" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                                বাতিল
                              </button>
                            ) : isPast ? (
                              <button disabled className="w-full md:w-auto px-6 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl cursor-not-allowed" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                                শেষ হয়েছে
                              </button>
                            ) : (
                              <a 
                                href={cls.meeting_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`w-full md:w-auto px-6 py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                                  upcoming 
                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                                    : 'bg-primary text-white hover:bg-primary-hover shadow-md hover:shadow-lg'
                                }`}
                                style={{ fontFamily: 'Hind Siliguri, sans-serif', pointerEvents: upcoming ? 'none' : 'auto' }}
                              >
                                Join <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
