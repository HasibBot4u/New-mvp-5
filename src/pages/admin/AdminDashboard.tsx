import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useCatalog } from '../../contexts/CatalogContext';
import { useAuth } from '../../contexts/AuthContext';
import { Users, BookOpen, Layers, RefreshCw, CheckCircle, XCircle, Clock, Server, Download, PlayCircle, AlertTriangle, FileText, Zap, Bug, BarChart2, Key, Unlock, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatRelativeTime } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { getWorkingBackend, refreshCatalog as apiRefreshCatalog } from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { setPageTitle } from '../../utils/setPageTitle';

interface HealthStatus {
  status: string;
  telegram: string;
  videos_cached: number;
  messages_cached: number;
  channels_resolved: number;
  catalog_age_seconds: number;
}

export const AdminDashboard: React.FC = () => {
  const { refreshCatalog, isLoading: isCatalogLoading } = useCatalog();
  const { profile } = useAuth();
  const { showToast } = useToast();
  
  useEffect(() => { setPageTitle('Admin Dashboard'); }, []);
  
  const [stats, setStats] = useState({
    total_users: 0,
    total_videos: 0,
    total_subjects: 0,
    total_chapters: 0,
    active_codes: 0,
    total_access_grants: 0,
    total_watch_events: 0,
    announcements_count: 0
  });
  
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [isDebugLoading, setIsDebugLoading] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [recentSignups, setRecentSignups] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [watchChartData, setWatchChartData] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: adminStats, error } = await supabase.rpc('get_admin_stats');
      
      if (error) {
        console.error('Error fetching admin stats:', error);
      } else if (adminStats) {
        setStats({
          total_users: adminStats.total_users || 0,
          total_videos: adminStats.total_videos || 0,
          total_subjects: adminStats.total_subjects || 0,
          total_chapters: adminStats.total_chapters || 0,
          active_codes: adminStats.active_codes || 0,
          total_access_grants: adminStats.total_access_grants || 0,
          total_watch_events: adminStats.total_watch_events || 0,
          announcements_count: adminStats.announcements_count || 0
        });

        if (adminStats.recent_signups) {
          setRecentSignups(adminStats.recent_signups);
        }

        if (adminStats.recent_activity) {
          setRecentActivity(adminStats.recent_activity);
        }
      }

      // Fetch watch history chart data
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: watchData } = await supabase
        .from('watch_history')
        .select('watched_at')
        .gte('watched_at', sevenDaysAgo);

      const dayLabels = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'];
      const dayCounts = Array(7).fill(0);
      
      watchData?.forEach(w => {
        if (w.watched_at) {
          dayCounts[new Date(w.watched_at).getDay()]++;
        }
      });
      
      const chartData = dayLabels.map((label, i) => ({ day: label, count: dayCounts[i] }));
      setWatchChartData(chartData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchHealth = async () => {
    setIsHealthLoading(true);
    try {
      const backend = await getWorkingBackend();
      const response = await fetch(`${backend}/api/health`);
      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          setHealth(data);
        } catch {
          console.error('Invalid JSON from health endpoint:', text.substring(0, 100));
          setHealth({ status: 'error', telegram: 'error', videos_cached: 0, messages_cached: 0, channels_resolved: 0, catalog_age_seconds: 0 });
        }
      } else {
        setHealth({ status: 'error', telegram: 'error', videos_cached: 0, messages_cached: 0, channels_resolved: 0, catalog_age_seconds: 0 });
      }
    } catch (error) {
      console.warn('Health check failed:', error);
      setHealth({ status: 'error', telegram: 'error', videos_cached: 0, messages_cached: 0, channels_resolved: 0, catalog_age_seconds: 0 });
    } finally {
      setIsHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchHealth();
    
    const healthInterval = setInterval(fetchHealth, 30000);
    return () => clearInterval(healthInterval);
  }, []);

  const handleForceWarmup = async () => {
    setIsWarmingUp(true);
    try {
      const backend = await getWorkingBackend();
      const response = await fetch(`${backend}/api/warmup`, { method: 'POST' });
      if (response.ok) {
        showToast('Warmup initiated successfully');
        fetchHealth();
      } else {
        showToast('Warmup failed');
      }
    } catch {
      showToast('Connection error during warmup');
    } finally {
      setIsWarmingUp(false);
    }
  };

  const handleRefreshCatalog = async () => {
    await apiRefreshCatalog();
    refreshCatalog();
    showToast('ক্যাটালগ রিফ্রেশ করা হয়েছে');
  };

  const handleViewDebug = async () => {
    setIsDebugLoading(true);
    try {
      const backend = await getWorkingBackend();
      const res = await fetch(`${backend}/api/debug`, {
        headers: { 'X-Admin-Token': 'true' }
      });
      if (res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setDebugData(data);
          setShowDebugModal(true);
        } catch {
          showToast('Invalid JSON from debug endpoint');
          console.error('Invalid JSON from debug endpoint:', text.substring(0, 100));
        }
      } else {
        showToast('Failed to fetch debug info');
      }
    } catch {
      showToast('Error connecting to backend');
    } finally {
      setIsDebugLoading(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      
      const csvContent = [
        ['ID', 'Name', 'Email', 'Role', 'Blocked', 'Joined Date'].join(','),
        ...data.map(u => [
          u.id, 
          `"${u.display_name || ''}"`, 
          u.email, 
          u.role, 
          u.is_blocked, 
          u.created_at
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', `nexusedu_users_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Users exported successfully');
    } catch {
      showToast('Failed to export users');
    }
  };

  const statCards = [
    { label: 'মোট শিক্ষার্থী', value: stats.total_users, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'মোট ভিডিও', value: stats.total_videos, icon: PlayCircle, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'মোট বিষয়', value: stats.total_subjects, icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'মোট চ্যাপ্টার', value: stats.total_chapters, icon: Layers, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'সক্রিয় কোড', value: stats.active_codes, icon: Key, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'মোট অ্যাক্সেস', value: stats.total_access_grants, icon: Unlock, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'ওয়াচ ইভেন্ট', value: stats.total_watch_events, icon: Eye, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { label: 'অ্যানাউন্সমেন্ট', value: stats.announcements_count, icon: FileText, color: 'text-rose-500', bg: 'bg-rose-50' },
  ];

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'login': return 'bg-blue-100 text-blue-800';
      case 'signup': return 'bg-green-100 text-green-800';
      case 'watch_video': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTelegramStatus = () => {
    if (!health) return <><span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span><span className="font-medium text-gray-700 bangla">অজানা অবস্থা</span></>;
    
    switch (health.telegram) {
      case 'connected':
        return <><CheckCircle size={16} className="text-green-500 mr-2" /><span className="font-medium text-green-700 bangla">টেলিগ্রাম সংযুক্ত ✓</span></>;
      case 'reconnecting':
        return <><RefreshCw size={16} className="text-amber-500 mr-2 animate-spin" /><span className="font-medium text-amber-700 bangla">সংযোগ হচ্ছে ⟳</span></>;
      case 'error':
      case 'disconnected':
        return <><XCircle size={16} className="text-red-500 mr-2" /><span className="font-medium text-red-700 bangla">সার্ভার বন্ধ ✗</span></>;
      default:
        return <><span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span><span className="font-medium text-gray-700 bangla">অজানা অবস্থা</span></>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-text-primary bangla">স্বাগতম, {profile?.display_name}</h1>
          <p className="text-text-secondary mt-1 bangla">NexusEdu এর আজকের আপডেট নিচে দেওয়া হলো।</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-medium text-text-primary">
            {currentTime.toLocaleDateString('bn-BD', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div className="text-sm text-text-secondary">
            {currentTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-surface p-5 rounded-xl border border-border shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary bangla">{stat.label}</p>
              <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Backend Health */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold flex items-center gap-2 bangla">
            <Server size={20} className="text-primary" />
            সার্ভার স্ট্যাটাস
          </h2>
          <Button variant="outline" size="sm" onClick={fetchHealth} isLoading={isHealthLoading}>
            <RefreshCw size={14} className="mr-2" /> রিফ্রেশ
          </Button>
        </div>
        <div className="p-5">
          {health ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-xs text-text-secondary mb-1 bangla">স্ট্যাটাস</p>
                <div className="flex items-center gap-2">
                  {health.status === 'ok' ? (
                    <><CheckCircle size={16} className="text-green-500" /><span className="font-medium text-green-700 bangla">সক্রিয়</span></>
                  ) : (
                    <><AlertTriangle size={16} className="text-amber-500" /><span className="font-medium text-amber-700 bangla">সমস্যা</span></>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-xs text-text-secondary mb-1 bangla">টেলিগ্রাম</p>
                <div className="flex items-center">
                  {renderTelegramStatus()}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-xs text-text-secondary mb-1 bangla">ক্যাশেড ভিডিও</p>
                <p className="font-medium text-text-primary">{health.videos_cached || 0}</p>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                <p className="text-xs text-text-secondary mb-1 bangla">ক্যাটালগ বয়স</p>
                <p className="font-medium text-text-primary">{health.catalog_age_seconds ? (health.catalog_age_seconds / 60).toFixed(1) : '0.0'} মিনিট</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary bangla">
              {isHealthLoading ? 'লোড হচ্ছে...' : 'ডেটা পাওয়া যায়নি'}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-surface" 
          onClick={handleRefreshCatalog}
          isLoading={isCatalogLoading}
        >
          <RefreshCw size={24} className="text-blue-500" />
          <span className="bangla">ক্যাটালগ রিফ্রেশ করুন</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-surface" 
          onClick={handleForceWarmup} 
          isLoading={isWarmingUp}
        >
          <Zap size={24} className="text-amber-500" />
          <span className="bangla">ফোর্স ওয়ার্মআপ</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-surface" 
          onClick={handleViewDebug} 
          isLoading={isDebugLoading}
        >
          <Bug size={24} className="text-purple-500" />
          <span className="bangla">ডিবাগ ইনফো</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-surface" 
          onClick={handleExportUsers}
        >
          <Download size={24} className="text-green-500" />
          <span className="bangla">ইউজার এক্সপোর্ট (CSV)</span>
        </Button>
      </div>

      {/* Analytics Section */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-gray-50/50">
          <h2 className="text-lg font-bold flex items-center gap-2 bangla">
            <BarChart2 size={20} className="text-primary" />
            ওয়াচ হিস্ট্রি (গত ৭ দিন)
          </h2>
        </div>
        <div className="p-5">
          {watchChartData.some(d => d.count > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={watchChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontFamily: 'Inter, sans-serif' }}
                  />
                  <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500 bangla">
              গত ৭ দিনে কোনো ওয়াচ ইভেন্ট নেই
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity & Signups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold bangla">নতুন শিক্ষার্থী</h2>
            <Link to="/admin/users" className="text-sm text-primary hover:underline font-medium bangla">সব দেখুন</Link>
          </div>
          <div className="divide-y divide-border">
            {recentSignups.length > 0 ? recentSignups.map(user => (
              <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {user.display_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-medium text-text-primary bangla">{user.display_name || 'Unknown User'}</p>
                    <p className="text-xs text-text-secondary">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-secondary flex items-center gap-1">
                    <Clock size={12} />
                    {formatRelativeTime(user.created_at)}
                  </p>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-text-secondary bangla">কোনো নতুন শিক্ষার্থী নেই</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold bangla">সাম্প্রতিক অ্যাক্টিভিটি</h2>
            <Link to="/admin/logs" className="text-sm text-primary hover:underline font-medium bangla">সব দেখুন</Link>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.length > 0 ? recentActivity.map(log => (
              <div key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getActionBadgeColor(log.action)}`}>
                      {log.action.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-medium text-text-primary bangla">
                      {log.profiles?.display_name || 'Unknown'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary truncate max-w-[250px]">
                    {log.details ? JSON.stringify(log.details) : 'No details'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-text-secondary flex items-center gap-1">
                    <Clock size={12} />
                    {formatRelativeTime(log.created_at)}
                  </p>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-text-secondary bangla">কোনো অ্যাক্টিভিটি নেই</div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showDebugModal} onClose={() => setShowDebugModal(false)} title="Debug Information">
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-[60vh] font-mono text-xs">
          <pre>{JSON.stringify(debugData, null, 2)}</pre>
        </div>
      </Modal>
    </div>
  );
};
