import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Badge } from '../../components/ui/Badge';
import { Search, Filter, Download, Calendar, Monitor, Globe } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  profiles?: { display_name: string; email: string };
}

export const AdminLogs: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    end: new Date().toISOString().split('T')[0] // today
  });

  const [uniqueActions, setUniqueActions] = useState<string[]>([]);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Add 1 day to end date to include the whole day
      const endDate = new Date(dateRange.end);
      endDate.setDate(endDate.getDate() + 1);

      const { data, error } = await supabase
        .from('activity_logs')
        .select(`
          *,
          profiles:user_id (display_name, email)
        `)
        .gte('created_at', dateRange.start)
        .lt('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      
      const fetchedLogs = data || [];
      setLogs(fetchedLogs);
      
      // Extract unique actions for the filter dropdown
      const actions = Array.from(new Set(fetchedLogs.map(log => log.action))).sort();
      setUniqueActions(actions);
      
    } catch (error) {
      console.error('Error fetching logs:', error);
      showToast('Failed to load activity logs');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('login') || action.includes('auth')) return 'success';
    if (action.includes('watch') || action.includes('video')) return 'primary';
    if (action.includes('delete') || action.includes('remove') || action.includes('block')) return 'danger';
    if (action.includes('update') || action.includes('edit')) return 'warning';
    return 'default';
  };

  const filteredLogs = logs.filter(log => {
    // Action filter
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        log.action.toLowerCase().includes(searchLower) ||
        log.profiles?.display_name?.toLowerCase().includes(searchLower) ||
        log.profiles?.email?.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.details).toLowerCase().includes(searchLower) ||
        log.ip_address?.toLowerCase().includes(searchLower);
        
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'User', 'Email', 'Action', 'IP Address', 'User Agent', 'Details'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toISOString(),
        `"${log.profiles?.display_name || 'Unknown'}"`,
        log.profiles?.email || '',
        log.action,
        log.ip_address || log.details?.ip_address || '',
        `"${log.user_agent || log.details?.user_agent || ''}"`,
        `"${JSON.stringify(log.details).replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `activity_logs_${dateRange.start}_to_${dateRange.end}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Activity Logs</h1>
          <p className="text-text-secondary text-sm">Monitor platform usage and security events</p>
        </div>
        <button 
          onClick={exportLogs}
          disabled={filteredLogs.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text-primary rounded-lg hover:bg-background transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export Logs
        </button>
      </div>

      <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden flex flex-col">
        {/* Filters Toolbar */}
        <div className="border-b border-border bg-surface p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by user, email, action, or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            
            {/* Action Filter */}
            <div className="relative w-full md:w-48 shrink-0">
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-10 pr-8 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            
            {/* Date Range */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <div className="relative flex-1 md:w-36">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background pl-10 pr-2 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <span className="text-text-muted">to</span>
              <div className="relative flex-1 md:w-36">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background pl-10 pr-2 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>Showing <strong className="text-text-primary">{filteredLogs.length}</strong> of <strong className="text-text-primary">{logs.length}</strong> logs in selected date range</span>
          </div>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-text-secondary whitespace-nowrap">
            <thead className="bg-surface text-xs uppercase text-text-primary border-b border-border sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Network & Device</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-border">
                    <td className="px-4 py-4 space-y-2">
                      <div className="h-4 w-20 bg-surface rounded"></div>
                      <div className="h-3 w-16 bg-surface rounded"></div>
                    </td>
                    <td className="px-4 py-4 space-y-2">
                      <div className="h-4 w-24 bg-surface rounded"></div>
                      <div className="h-3 w-32 bg-surface rounded"></div>
                    </td>
                    <td className="px-4 py-4"><div className="h-5 w-16 bg-surface rounded-full"></div></td>
                    <td className="px-4 py-4 space-y-2">
                      <div className="h-4 w-24 bg-surface rounded"></div>
                      <div className="h-3 w-32 bg-surface rounded"></div>
                    </td>
                    <td className="px-4 py-4"><div className="h-4 w-48 bg-surface rounded"></div></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-text-muted">No activity found matching filters</td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const ip = log.ip_address || log.details?.ip_address;
                  const ua = log.user_agent || log.details?.user_agent;
                  
                  return (
                    <tr key={log.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-text-primary">{new Date(log.created_at).toLocaleDateString()}</div>
                        <div className="text-xs text-text-muted">{new Date(log.created_at).toLocaleTimeString()}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-text-primary">{log.profiles?.display_name || 'System / Unknown'}</div>
                        <div className="text-xs text-text-muted">{log.profiles?.email || log.user_id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getActionColor(log.action) as any} className="text-[10px] px-1.5 py-0.5">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {ip && (
                            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                              <Globe className="w-3 h-3" />
                              <span className="font-mono">{ip}</span>
                            </div>
                          )}
                          {ua && (
                            <div className="flex items-center gap-1.5 text-xs text-text-secondary group relative">
                              <Monitor className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[150px] cursor-help" title={ua}>
                                {truncateText(ua, 25)}
                              </span>
                            </div>
                          )}
                          {!ip && !ua && <span className="text-xs text-text-muted italic">Not recorded</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-mono text-text-muted truncate max-w-xs bg-surface p-1.5 rounded border border-border" title={JSON.stringify(log.details)}>
                          {truncateText(JSON.stringify(log.details), 50)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
