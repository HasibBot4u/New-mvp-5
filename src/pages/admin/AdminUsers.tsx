import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { Search, MoreVertical, Shield, ShieldOff, Ban, CheckCircle, Clock, Activity, Trash2, Download, Eye, X } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

interface UserStats {
  videosWatched: number;
  watchTime: number;
  lastActive: string | null;
}

export const AdminUsers: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [stats, setStats] = useState<Record<string, UserStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'admins' | 'blocked' | 'active'>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  // Modals state
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [userToBlock, setUserToBlock] = useState<Profile | null>(null);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [userDetailsModal, setUserDetailsModal] = useState<Profile | null>(null);
  const [userWatchHistoryModal, setUserWatchHistoryModal] = useState<Profile | null>(null);
  const [userActivityLogsModal, setUserActivityLogsModal] = useState<Profile | null>(null);
  
  const [watchHistoryData, setWatchHistoryData] = useState<any[]>([]);
  const [activityLogsData, setActivityLogsData] = useState<any[]>([]);
  const [isModalLoading, setIsModalLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      setUsers(profiles || []);

      // Fetch watch history for stats
      const { data: watchHistory } = await supabase
        .from('watch_history')
        .select('user_id, progress_seconds, watched_at');
        
      const newStats: Record<string, UserStats> = {};
      profiles?.forEach(p => {
        newStats[p.id] = { videosWatched: 0, watchTime: 0, lastActive: null };
      });

      if (watchHistory) {
        watchHistory.forEach(record => {
          if (newStats[record.user_id]) {
            newStats[record.user_id].videosWatched += 1;
            newStats[record.user_id].watchTime += record.progress_seconds || 0;
            
            const currentLastActive = newStats[record.user_id].lastActive;
            if (!currentLastActive || new Date(record.watched_at) > new Date(currentLastActive)) {
              newStats[record.user_id].lastActive = record.watched_at;
            }
          }
        });
      }
      
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;
    
    switch (filter) {
      case 'admins': return user.role === 'admin';
      case 'blocked': return user.is_blocked;
      case 'active': return !user.is_blocked;
      default: return true;
    }
  });

  const toggleSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const selectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const updateUser = async (userId: string, updates: Partial<Profile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
      showToast('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      showToast('Failed to update user');
    }
    setActionMenuOpen(null);
  };

  const handleBulkAction = async (action: 'block' | 'unblock') => {
    const isBlocked = action === 'block';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: isBlocked })
        .in('id', Array.from(selectedUsers));

      if (error) throw error;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_logs').insert({ user_id: user.id, action: 'bulk_block', details: { affected_user_ids: Array.from(selectedUsers) } });
      }
      
      setUsers(users.map(u => selectedUsers.has(u.id) ? { ...u, is_blocked: isBlocked } : u));
      showToast(`Successfully ${action}ed ${selectedUsers.size} users`);
      setSelectedUsers(new Set());
    } catch (error) {
      console.error(`Error bulk ${action}ing users:`, error);
      showToast(`Failed to ${action} users`);
    }
  };

  const exportSelected = () => {
    const usersToExport = users.filter(u => selectedUsers.has(u.id));
    const csvContent = [
      ['ID', 'Email', 'Name', 'Role', 'Status', 'Joined'].join(','),
      ...usersToExport.map(u => [
        u.id,
        u.email,
        `"${u.display_name || ''}"`,
        u.role,
        u.is_blocked ? 'Blocked' : 'Active',
        new Date(u.created_at).toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchWatchHistory = async (userId: string) => {
    setIsModalLoading(true);
    try {
      const { data, error } = await supabase
        .from('watch_history')
        .select(`
          id,
          video_id,
          progress_seconds,
          watched_at,
          videos (title)
        `)
        .eq('user_id', userId)
        .order('watched_at', { ascending: false });
        
      if (error) throw error;
      setWatchHistoryData(data || []);
    } catch (error) {
      console.error('Error fetching watch history:', error);
      showToast('Failed to load watch history');
    } finally {
      setIsModalLoading(false);
    }
  };

  const fetchActivityLogs = async (userId: string) => {
    setIsModalLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setActivityLogsData(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      showToast('Failed to load activity logs');
    } finally {
      setIsModalLoading(false);
    }
  };

  const formatWatchTime = (seconds: number) => {
    if (!seconds) return '0ঘণ্টা 0মিনিট';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}ঘণ্টা ${m}মিনিট`;
  };

  const formatLastActive = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-text-secondary text-sm mb-1">Total Users</div>
          <div className="text-2xl font-bold text-text-primary">{users.length}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-text-secondary text-sm mb-1">Admins</div>
          <div className="text-2xl font-bold text-blue-500">{users.filter(u => u.role === 'admin').length}</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-text-secondary text-sm mb-1">Active (7d)</div>
          <div className="text-2xl font-bold text-green-500">
            {Object.values(stats).filter(s => {
              if (!s.lastActive) return false;
              const diff = new Date().getTime() - new Date(s.lastActive).getTime();
              return diff < 7 * 24 * 60 * 60 * 1000;
            }).length}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="text-text-secondary text-sm mb-1">Blocked</div>
          <div className="text-2xl font-bold text-red-500">{users.filter(u => u.is_blocked).length}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
          <p className="text-text-secondary text-sm">View and manage platform users</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="border-b border-border bg-surface px-4 py-3 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex bg-background border border-border rounded-md overflow-hidden">
              {(['all', 'admins', 'blocked', 'active'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 text-xs font-medium capitalize transition-colors ${
                    filter === f ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedUsers.size > 0 && (
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-medium text-primary">{selectedUsers.size} users selected</span>
            <div className="flex items-center gap-2">
              <button onClick={() => handleBulkAction('block')} className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors">
                Block Selected
              </button>
              <button onClick={() => handleBulkAction('unblock')} className="px-3 py-1.5 text-xs font-medium bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 transition-colors">
                Unblock Selected
              </button>
              <button onClick={exportSelected} className="px-3 py-1.5 text-xs font-medium bg-surface border border-border text-text-primary rounded hover:bg-background transition-colors flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              <button onClick={() => setSelectedUsers(new Set())} className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors">
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Main Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-text-secondary whitespace-nowrap">
            <thead className="bg-surface text-xs uppercase text-text-primary border-b border-border sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input 
                    type="checkbox" 
                    checked={filteredUsers.length > 0 && selectedUsers.size === filteredUsers.length}
                    onChange={selectAll}
                    className="rounded border-border bg-background text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role & Status</th>
                <th className="px-4 py-3">Engagement</th>
                <th className="px-4 py-3">Last Active</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-border">
                    <td className="px-4 py-4"><div className="w-4 h-4 bg-surface rounded"></div></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface shrink-0"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-surface rounded"></div>
                          <div className="h-3 w-32 bg-surface rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 space-y-2">
                      <div className="h-4 w-16 bg-surface rounded"></div>
                      <div className="h-4 w-16 bg-surface rounded"></div>
                    </td>
                    <td className="px-4 py-4 space-y-2">
                      <div className="h-4 w-16 bg-surface rounded"></div>
                      <div className="h-3 w-12 bg-surface rounded"></div>
                    </td>
                    <td className="px-4 py-4"><div className="h-4 w-20 bg-surface rounded"></div></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 bg-surface rounded"></div></td>
                    <td className="px-4 py-4"><div className="h-6 w-6 bg-surface rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-text-muted">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={`hover:bg-surface/50 transition-colors ${selectedUsers.has(user.id) ? 'bg-primary/5' : ''}`}>
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleSelection(user.id)}
                        className="rounded border-border bg-background text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {user.display_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">{user.display_name || 'Unknown User'}</div>
                          <div className="text-xs text-text-muted">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5 items-start">
                        <Badge variant={user.role === 'admin' ? 'primary' : 'default'} className="capitalize text-[10px] px-1.5 py-0">
                          {user.role}
                        </Badge>
                        {user.is_blocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                            <Ban className="w-3 h-3" /> Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        <div className="text-text-primary font-medium">{stats[user.id]?.videosWatched || 0} videos</div>
                        <div className="text-text-muted">{formatWatchTime(stats[user.id]?.watchTime || 0)}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">
                      {formatLastActive(stats[user.id]?.lastActive)}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right relative">
                      <button 
                        onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                        className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface rounded-md transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {actionMenuOpen === user.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActionMenuOpen(null)} />
                          <div className="absolute right-8 top-8 w-48 bg-surface border border-border rounded-lg shadow-xl z-20 py-1 overflow-hidden">
                            <button 
                              onClick={() => { setUserDetailsModal(user); setActionMenuOpen(null); }}
                              className="w-full text-left px-4 py-2 text-xs text-text-primary hover:bg-background flex items-center gap-2"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Full Details
                            </button>
                            <button 
                              onClick={() => { 
                                setUserWatchHistoryModal(user); 
                                fetchWatchHistory(user.id);
                                setActionMenuOpen(null); 
                              }}
                              className="w-full text-left px-4 py-2 text-xs text-text-primary hover:bg-background flex items-center gap-2"
                            >
                              <Clock className="w-3.5 h-3.5" /> View Watch History
                            </button>
                            <button 
                              onClick={() => { 
                                setUserActivityLogsModal(user); 
                                fetchActivityLogs(user.id);
                                setActionMenuOpen(null); 
                              }}
                              className="w-full text-left px-4 py-2 text-xs text-text-primary hover:bg-background flex items-center gap-2"
                            >
                              <Activity className="w-3.5 h-3.5" /> View All Activity Logs
                            </button>
                            <div className="h-px bg-border my-1" />
                            <button 
                              onClick={() => updateUser(user.id, { role: user.role === 'admin' ? 'user' : 'admin' })}
                              className="w-full text-left px-4 py-2 text-xs text-text-primary hover:bg-background flex items-center gap-2"
                            >
                              {user.role === 'admin' ? <ShieldOff className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                              {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </button>
                            <button 
                              onClick={() => {
                                if (user.is_blocked) {
                                  updateUser(user.id, { is_blocked: false });
                                } else {
                                  setUserToBlock(user);
                                  setActionMenuOpen(null);
                                }
                              }}
                              className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 ${user.is_blocked ? 'text-green-500 hover:bg-green-500/10' : 'text-red-500 hover:bg-red-500/10'}`}
                            >
                              {user.is_blocked ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                              {user.is_blocked ? 'Unblock User' : 'Block User'}
                            </button>
                            <div className="h-px bg-border my-1" />
                            <button 
                              onClick={() => {
                                setUserToDelete(user);
                                setActionMenuOpen(null);
                              }}
                              className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete Account
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block Confirmation Modal */}
      {userToBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <div className="p-2 bg-red-500/10 rounded-full">
                <Ban className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Block User</h3>
            </div>
            <p className="text-text-secondary mb-6">
              Are you sure you want to block <strong className="text-text-primary">{userToBlock.display_name || userToBlock.email}</strong>? 
              They will be immediately logged out and unable to access the platform.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setUserToBlock(null)}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  updateUser(userToBlock.id, { is_blocked: true });
                  setUserToBlock(null);
                }}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Block User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <div className="p-2 bg-red-500/10 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Delete Account</h3>
            </div>
            <p className="text-text-secondary mb-4">
              This action is <strong className="text-red-500">permanent and cannot be undone</strong>. 
              All user data, watch history, and activity logs will be permanently deleted.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Type <span className="font-mono text-red-500 bg-red-500/10 px-1 rounded">{userToDelete.email}</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmEmail}
                onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                placeholder="user@example.com"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setUserToDelete(null);
                  setDeleteConfirmEmail('');
                }}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={deleteConfirmEmail !== userToDelete.email}
                onClick={async () => {
                  try {
                    const { error } = await supabase.rpc('delete_user_account', { target_user_id: userToDelete.id });
                    if (error) throw error;
                    
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      await supabase.from('activity_logs').insert({ user_id: user.id, action: 'delete_user', details: { deleted_user: userToDelete.email } });
                    }
                    
                    setUsers(users.filter(u => u.id !== userToDelete.id));
                    showToast('User deleted successfully. নোট: সম্পূর্ণ ডিলিট করতে Supabase Dashboard → Authentication → Users থেকে ম্যানুয়ালি ডিলিট করুন');
                  } catch {
                    showToast('Failed to delete user');
                  }
                  setUserToDelete(null);
                  setDeleteConfirmEmail('');
                }}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Drawer/Modal */}
      {userDetailsModal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80">
          <div className="bg-surface w-full max-w-md h-full flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-bold text-text-primary">User Details</h3>
              <button 
                onClick={() => setUserDetailsModal(null)}
                className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-background"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-2xl shrink-0">
                  {userDetailsModal.display_name?.charAt(0).toUpperCase() || userDetailsModal.email?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary">{userDetailsModal.display_name || 'Unknown User'}</h2>
                  <p className="text-text-secondary">{userDetailsModal.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={userDetailsModal.role === 'admin' ? 'primary' : 'default'} className="capitalize">
                      {userDetailsModal.role}
                    </Badge>
                    {userDetailsModal.is_blocked && (
                      <Badge variant="default" className="bg-red-500/10 text-red-500">Blocked</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="text-text-secondary text-xs mb-1">Joined</div>
                  <div className="font-medium text-text-primary">{new Date(userDetailsModal.created_at).toLocaleDateString()}</div>
                </div>
                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="text-text-secondary text-xs mb-1">Last Active</div>
                  <div className="font-medium text-text-primary">{formatLastActive(stats[userDetailsModal.id]?.lastActive)}</div>
                </div>
                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="text-text-secondary text-xs mb-1">Videos Watched</div>
                  <div className="font-medium text-text-primary">{stats[userDetailsModal.id]?.videosWatched || 0}</div>
                </div>
                <div className="bg-background border border-border rounded-lg p-4">
                  <div className="text-text-secondary text-xs mb-1">Total Watch Time</div>
                  <div className="font-medium text-text-primary">{formatWatchTime(stats[userDetailsModal.id]?.watchTime || 0)}</div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-text-primary mb-3">System Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-text-secondary">User ID</span>
                    <span className="font-mono text-text-primary text-xs">{userDetailsModal.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Watch History Modal */}
      {userWatchHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-text-primary">Watch History</h2>
                <p className="text-text-secondary text-sm">For {userWatchHistoryModal.display_name || userWatchHistoryModal.email}</p>
              </div>
              <button onClick={() => setUserWatchHistoryModal(null)} className="p-2 text-text-muted hover:text-text-primary hover:bg-background rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              {isModalLoading ? (
                <div className="p-8 text-center text-text-secondary">Loading watch history...</div>
              ) : watchHistoryData.length === 0 ? (
                <div className="p-8 text-center text-text-secondary">No watch history found for this user.</div>
              ) : (
                <table className="w-full text-left text-sm text-text-secondary">
                  <thead className="bg-background text-xs uppercase text-text-primary border-b border-border sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3">Video Title</th>
                      <th className="px-6 py-3">Watch Time</th>
                      <th className="px-6 py-3">Last Watched</th>
                    </tr>
                  </thead>
                  <tbody>
                    {watchHistoryData.map((record) => (
                      <tr key={record.id} className="border-b border-border hover:bg-surface/50">
                        <td className="px-6 py-4 font-medium text-text-primary">{record.videos?.title || 'Unknown Video'}</td>
                        <td className="px-6 py-4">{formatWatchTime(record.progress_seconds)}</td>
                        <td className="px-6 py-4">{new Date(record.watched_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity Logs Modal */}
      {userActivityLogsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-surface border border-border rounded-xl w-full max-w-5xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-text-primary">Activity Logs</h2>
                <p className="text-text-secondary text-sm">For {userActivityLogsModal.display_name || userActivityLogsModal.email}</p>
              </div>
              <button onClick={() => setUserActivityLogsModal(null)} className="p-2 text-text-muted hover:text-text-primary hover:bg-background rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              {isModalLoading ? (
                <div className="p-8 text-center text-text-secondary">Loading activity logs...</div>
              ) : activityLogsData.length === 0 ? (
                <div className="p-8 text-center text-text-secondary">No activity logs found for this user.</div>
              ) : (
                <table className="w-full text-left text-sm text-text-secondary">
                  <thead className="bg-background text-xs uppercase text-text-primary border-b border-border sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3">Time</th>
                      <th className="px-6 py-3">Action</th>
                      <th className="px-6 py-3">Details</th>
                      <th className="px-6 py-3">IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogsData.map((log) => (
                      <tr key={log.id} className="border-b border-border hover:bg-surface/50">
                        <td className="px-6 py-4 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="font-mono text-[10px] uppercase">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs truncate max-w-xs" title={JSON.stringify(log.details)}>
                          {JSON.stringify(log.details)}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">N/A</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
