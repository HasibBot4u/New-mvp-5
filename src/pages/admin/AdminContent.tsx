import React, { useState } from 'react';
import { useCatalog } from '../../contexts/CatalogContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit2, Trash2, Search, Upload, PlayCircle, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { getWorkingBackend } from '../../lib/api';

export const AdminContent: React.FC = () => {
  const { catalog, isLoading, refreshCatalog } = useCatalog();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'subjects' | 'cycles' | 'chapters' | 'videos' | 'live_classes' | 'announcements'>('subjects');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Live Classes State
  const [liveClasses, setLiveClasses] = useState<any[]>([]);
  const [isLoadingLiveClasses, setIsLoadingLiveClasses] = useState(false);

  // Announcements State
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);

  React.useEffect(() => {
    fetchLiveClasses();
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoadingAnnouncements(true);
    try {
      const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setAnnouncements([]);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  };

  const fetchLiveClasses = async () => {
    setIsLoadingLiveClasses(true);
    try {
      const { data, error } = await supabase.from('live_classes').select('*').order('scheduled_at', { ascending: false });
      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
          setLiveClasses([]);
          return;
        }
        throw error;
      }
      setLiveClasses(data || []);
    } catch (err) {
      console.error('Error fetching live classes:', err);
      setLiveClasses([]);
    } finally {
      setIsLoadingLiveClasses(false);
    }
  };
  
  // Bulk Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  
  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ table: string; id: string; isBulk?: boolean } | null>(null);
  
  // Stream Test State
  const [streamTestResult, setStreamTestResult] = useState<{status: 'success' | 'error' | 'testing' | null, message: string}>({status: null, message: ''});
  const [prefetchStatus, setPrefetchStatus] = useState<Record<string, 'loading' | 'success' | 'error'>>({});
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-surface rounded w-1/4"></div>
          <div className="h-10 bg-surface rounded w-32"></div>
        </div>
        <div className="h-12 bg-surface rounded-xl"></div>
        <div className="h-96 bg-surface rounded-xl"></div>
      </div>
    );
  }

  const allCycles = catalog?.subjects.flatMap(s => s.cycles) || [];
  const allChapters = allCycles.flatMap(c => c.chapters) || [];
  const allVideos = allChapters.flatMap(c => c.videos) || [];

  const filteredSubjects = catalog?.subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredCycles = allCycles.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.telegram_channel_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChapters = allChapters.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredVideos = allVideos.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLiveClasses = liveClasses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAnnouncements = announcements.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.body?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'subjects', label: 'Subjects', count: filteredSubjects.length },
    { id: 'cycles', label: 'Cycles', count: filteredCycles.length },
    { id: 'chapters', label: 'Chapters', count: filteredChapters.length },
    { id: 'videos', label: 'Videos', count: filteredVideos.length },
    { id: 'live_classes', label: 'Live Classes', count: filteredLiveClasses.length },
    { id: 'announcements', label: 'Announcements', count: filteredAnnouncements.length },
  ];

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setStreamTestResult({status: null, message: ''});
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({});
    setStreamTestResult({status: null, message: ''});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const table = activeTab;
      const dataToSave = { ...formData };
      delete dataToSave.id;
      delete dataToSave.created_at;
      delete dataToSave.updated_at;
      delete dataToSave.cycles;
      delete dataToSave.chapters;
      delete dataToSave.videos;

      if (activeTab === 'videos') {
        const chapter = allChapters.find(c => c.id === dataToSave.chapter_id);
        const cycle = allCycles.find(c => c.id === chapter?.cycle_id);
        if (cycle) {
          dataToSave.telegram_channel_id = cycle.telegram_channel_id;
        }
      }

      if (activeTab === 'subjects' && !dataToSave.slug && dataToSave.name) {
        dataToSave.slug = dataToSave.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }

      let savedId = editingItem?.id;
      if (editingItem) {
        const { error } = await supabase.from(table).update(dataToSave).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from(table).insert(dataToSave).select('id').single();
        if (error) throw error;
        if (data) savedId = data.id;
      }
      
      // Log activity
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('activity_logs').insert({
            user_id: user.id,
            action: 'content_change',
            details: { entity: activeTab, action: editingItem ? 'update' : 'create', id: savedId }
          });
        }
      } catch (e) {
        console.error('Failed to log activity:', e);
      }

      setIsModalOpen(false);
      if (activeTab === 'live_classes') {
        await fetchLiveClasses();
      } else if (activeTab === 'announcements') {
        await fetchAnnouncements();
      } else {
        await refreshCatalog();
      }
      showToast(`${activeTab.slice(0, -1)} saved successfully`);
    } catch (error) {
      console.error(`Error saving ${activeTab}:`, error);
      showToast(`Failed to save ${activeTab.slice(0, -1)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (table: string, id: string) => {
    setItemToDelete({ table, id });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.isBulk) {
      try {
        const { error } = await supabase.from('videos').delete().in('id', Array.from(selectedVideos));
        if (error) throw error;
        await refreshCatalog();
        setSelectedVideos(new Set());
        showToast('Videos deleted successfully');
      } catch {
        showToast('Failed to delete videos');
      }
    } else {
      try {
        const { error } = await supabase.from(itemToDelete.table).delete().eq('id', itemToDelete.id);
        if (error) throw error;
        
        if (itemToDelete.table === 'live_classes') {
          await fetchLiveClasses();
        } else if (itemToDelete.table === 'announcements') {
          await fetchAnnouncements();
        } else {
          await refreshCatalog();
        }

        // Log activity
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('activity_logs').insert({
              user_id: user.id,
              action: 'content_change',
              details: { entity: itemToDelete.table, action: 'delete', id: itemToDelete.id }
            });
          }
        } catch (e) {
          console.error('Failed to log activity:', e);
        }

        showToast(`${itemToDelete.table.slice(0, -1)} deleted successfully`);
      } catch (error) {
        console.error(`Error deleting from ${itemToDelete.table}:`, error);
        showToast(`Failed to delete ${itemToDelete.table.slice(0, -1)}`);
      }
    }
    
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const toggleAnnouncementActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('announcements').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      await fetchAnnouncements();
      showToast(`Announcement ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling announcement status:', error);
      showToast('Failed to update announcement status');
    }
  };

  const toggleVideoActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('videos').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      await refreshCatalog();
      showToast(`Video ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling video status:', error);
      showToast('Failed to update video status');
    }
  };

  const testStream = async () => {
    if (!editingItem?.id) return;
    
    setStreamTestResult({ status: 'testing', message: 'Testing stream connection...' });
    
    try {
      const backend = await getWorkingBackend();
      const response = await fetch(`${backend}/api/test-stream?video_id=${editingItem.id}`);
      
      if (response.ok) {
        setStreamTestResult({ status: 'success', message: `Success! Backend can access video.` });
      } else {
        setStreamTestResult({ status: 'error', message: `Error: Received status ${response.status}` });
      }
    } catch (error: any) {
      setStreamTestResult({ status: 'error', message: `Network error: ${error.message}` });
    }
  };

  const prefetchVideo = async (videoId: string) => {
    setPrefetchStatus(prev => ({ ...prev, [videoId]: 'loading' }));
    try {
      const backend = await getWorkingBackend();
      const response = await fetch(`${backend}/api/prefetch/${videoId}`);
      if (response.ok) {
        setPrefetchStatus(prev => ({ ...prev, [videoId]: 'success' }));
        showToast('Video prefetched successfully');
      } else {
        setPrefetchStatus(prev => ({ ...prev, [videoId]: 'error' }));
        showToast('Failed to prefetch video');
      }
    } catch {
      setPrefetchStatus(prev => ({ ...prev, [videoId]: 'error' }));
      showToast('Network error while prefetching');
    }
  };

  const updateDisplayOrder = async (id: string, newOrder: number) => {
    try {
      const { error } = await supabase.from('videos').update({ display_order: newOrder }).eq('id', id);
      if (error) throw error;
      await refreshCatalog();
      showToast('Display order updated');
    } catch {
      showToast('Failed to update display order');
    }
  };

  const handleBulkDeleteVideos = async () => {
    if (selectedVideos.size === 0) return;
    setItemToDelete({ table: 'videos', id: '', isBulk: true });
    setDeleteModalOpen(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'subjects':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="bg-surface text-xs uppercase text-text-primary border-b border-border">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map((subject) => (
                  <tr key={subject.id} className="border-b border-border hover:bg-surface/50">
                    <td className="px-6 py-4 font-medium text-text-primary">{subject.name}</td>
                    <td className="px-6 py-4 truncate max-w-xs">{subject.description}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(subject)}><Edit2 size={14} /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={() => handleDelete('subjects', subject.id)}><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'cycles':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="bg-surface text-xs uppercase text-text-primary border-b border-border">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Channel ID</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCycles.map((cycle) => {
                  const subject = catalog?.subjects.find(s => s.cycles.some(c => c.id === cycle.id));
                  return (
                    <tr key={cycle.id} className="border-b border-border hover:bg-surface/50">
                      <td className="px-6 py-4 font-medium text-text-primary">{cycle.name}</td>
                      <td className="px-6 py-4"><Badge variant="outline">{subject?.name}</Badge></td>
                      <td className="px-6 py-4">{cycle.display_order}</td>
                      <td className="px-6 py-4 font-mono text-xs">{cycle.telegram_channel_id}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(cycle)}><Edit2 size={14} /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={() => handleDelete('cycles', cycle.id)}><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      case 'chapters':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="bg-surface text-xs uppercase text-text-primary border-b border-border">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Cycle</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Videos</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredChapters.map((chapter) => {
                  const cycle = allCycles.find(c => c.id === chapter.cycle_id);
                  const subject = catalog?.subjects.find(s => s.cycles.some(c => c.id === cycle?.id));
                  return (
                    <tr key={chapter.id} className="border-b border-border hover:bg-surface/50">
                      <td className="px-6 py-4 font-medium text-text-primary">{chapter.name}</td>
                      <td className="px-6 py-4"><Badge variant="outline">{cycle?.name}</Badge></td>
                      <td className="px-6 py-4"><Badge variant="outline">{subject?.name}</Badge></td>
                      <td className="px-6 py-4">{chapter.display_order}</td>
                      <td className="px-6 py-4 text-text-secondary">{chapter.videos.length}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(chapter)}><Edit2 size={14} /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={() => handleDelete('chapters', chapter.id)}><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      case 'videos':
        return (
          <div className="space-y-4">
            {selectedVideos.size > 0 && (
              <div className="flex items-center gap-4 bg-surface p-3 rounded-lg border border-border">
                <span className="text-sm font-medium">{selectedVideos.size} selected</span>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={handleBulkDeleteVideos}>
                  <Trash2 size={16} className="mr-2" />
                  Delete Selected
                </Button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-text-secondary whitespace-nowrap">
                <thead className="bg-surface text-xs uppercase text-text-primary border-b border-border">
                  <tr>
                    <th className="px-6 py-3">
                      <input 
                        type="checkbox" 
                        className="rounded border-border text-primary focus:ring-primary"
                        checked={selectedVideos.size === filteredVideos.length && filteredVideos.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVideos(new Set(filteredVideos.map(v => v.id)));
                          } else {
                            setSelectedVideos(new Set());
                          }
                        }}
                      />
                    </th>
                    <th className="px-6 py-3">Order</th>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Chapter</th>
                    <th className="px-6 py-3">Msg ID</th>
                    <th className="px-6 py-3">Active</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVideos.map((video) => {
                    const chapter = allChapters.find(c => c.id === video.chapter_id);
                    return (
                      <tr key={video.id} className="border-b border-border hover:bg-surface/50">
                        <td className="px-6 py-4">
                          <input 
                            type="checkbox" 
                            className="rounded border-border text-primary focus:ring-primary"
                            checked={selectedVideos.has(video.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedVideos);
                              if (e.target.checked) newSet.add(video.id);
                              else newSet.delete(video.id);
                              setSelectedVideos(newSet);
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="number" 
                            className="w-16 rounded border border-border bg-background px-2 py-1 text-sm focus:border-primary focus:outline-none"
                            defaultValue={video.display_order}
                            onBlur={(e) => updateDisplayOrder(video.id, parseInt(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-text-primary truncate max-w-[200px]" title={video.title}>{video.title}</td>
                        <td className="px-6 py-4"><Badge variant="outline">{chapter?.name}</Badge></td>
                        <td className="px-6 py-4 font-mono text-xs">{video.telegram_message_id}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleVideoActive(video.id, video.is_active !== false)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${video.is_active !== false ? 'bg-green-500' : 'bg-gray-600'}`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${video.is_active !== false ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-2" 
                              onClick={() => prefetchVideo(video.id)}
                              disabled={prefetchStatus[video.id] === 'loading'}
                            >
                              {prefetchStatus[video.id] === 'loading' ? (
                                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              ) : prefetchStatus[video.id] === 'success' ? (
                                <CheckCircle size={14} className="text-green-500" />
                              ) : (
                                <PlayCircle size={14} />
                              )}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(video)}><Edit2 size={14} /></Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={() => handleDelete('videos', video.id)}><Trash2 size={14} /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'live_classes':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary whitespace-nowrap">
              <thead className="bg-surface text-xs uppercase text-text-primary border-b border-border">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Scheduled At</th>
                  <th className="px-6 py-3">Duration</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingLiveClasses ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">Loading live classes...</td>
                  </tr>
                ) : filteredLiveClasses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">No live classes found</td>
                  </tr>
                ) : (
                  filteredLiveClasses.map((cls) => {
                    const subject = catalog?.subjects.find(s => s.id === cls.subject_id);
                    return (
                      <tr key={cls.id} className="border-b border-border hover:bg-surface/50">
                        <td className="px-6 py-4 font-medium text-text-primary truncate max-w-[200px]" title={cls.title}>{cls.title}</td>
                        <td className="px-6 py-4"><Badge variant="outline">{subject?.name || 'Unknown Subject'}</Badge></td>
                        <td className="px-6 py-4">{new Date(cls.scheduled_at).toLocaleString()}</td>
                        <td className="px-6 py-4">{cls.duration_minutes} mins</td>
                        <td className="px-6 py-4">
                          {cls.is_cancelled ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>
                          ) : new Date(cls.scheduled_at) > new Date() ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Upcoming</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Past</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(cls)}><Edit2 size={14} /></Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={() => handleDelete('live_classes', cls.id)}><Trash2 size={14} /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        );
      case 'announcements':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary whitespace-nowrap">
              <thead className="bg-surface text-xs uppercase text-text-primary border-b border-border">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Content</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Active</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingAnnouncements ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">Loading announcements...</td>
                  </tr>
                ) : filteredAnnouncements.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">No announcements found</td>
                  </tr>
                ) : (
                  filteredAnnouncements.map((announcement) => (
                    <tr key={announcement.id} className="border-b border-border hover:bg-surface/50">
                      <td className="px-6 py-4 font-medium text-text-primary truncate max-w-[200px]" title={announcement.title}>{announcement.title}</td>
                      <td className="px-6 py-4 truncate max-w-[300px]" title={announcement.body}>{announcement.body}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={
                          announcement.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          announcement.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }>
                          {announcement.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleAnnouncementActive(announcement.id, announcement.is_active)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${announcement.is_active ? 'bg-green-500' : 'bg-gray-600'}`}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${announcement.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(announcement)}><Edit2 size={14} /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={() => handleDelete('announcements', announcement.id)}><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      default:
        return <div className="p-8 text-center text-text-secondary">Select a tab to view content</div>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Content Management</h1>
          <p className="text-text-secondary text-sm">Manage subjects, cycles, chapters, and videos</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'videos' && (
            <Button variant="outline" className="flex items-center gap-2" onClick={() => setIsImportModalOpen(true)}>
              <Upload size={16} />
              Bulk Import
            </Button>
          )}
          <Button className="flex items-center gap-2" onClick={handleAdd}>
            <Plus size={16} />
            Add New {activeTab.slice(0, -1)}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background shadow-sm overflow-hidden">
        <div className="border-b border-border bg-surface px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-background hover:text-text-primary'
                }`}
              >
                {tab.label}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-border text-text-secondary'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-text-muted" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
        
        {renderContent()}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Add New ${activeTab.slice(0, -1)}`}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {activeTab === 'subjects' && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Display Order</label>
                <input
                  type="number"
                  required
                  value={formData.display_order || 0}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </>
          )}

          {activeTab === 'cycles' && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Subject</label>
                <select
                  required
                  value={formData.subject_id || ''}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select Subject</option>
                  {catalog?.subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Telegram Channel ID</label>
                <input
                  type="text"
                  required
                  value={formData.telegram_channel_id || ''}
                  onChange={(e) => setFormData({ ...formData, telegram_channel_id: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Display Order</label>
                <input
                  type="number"
                  required
                  value={formData.display_order || 0}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </>
          )}

          {activeTab === 'chapters' && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Cycle</label>
                <select
                  required
                  value={formData.cycle_id || ''}
                  onChange={(e) => setFormData({ ...formData, cycle_id: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select Cycle</option>
                  {allCycles.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Display Order</label>
                <input
                  type="number"
                  required
                  value={formData.display_order || 0}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </>
          )}

          {activeTab === 'videos' && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Chapter</label>
                <select
                  required
                  value={formData.chapter_id || ''}
                  onChange={(e) => setFormData({ ...formData, chapter_id: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select Chapter</option>
                  {allChapters.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Telegram Message ID</label>
                <input
                  type="number"
                  required
                  value={formData.telegram_message_id || ''}
                  onChange={(e) => setFormData({ ...formData, telegram_message_id: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Duration (e.g., 45:30)</label>
                  <input
                    type="text"
                    value={formData.duration || ''}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Size (MB)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.size_mb || ''}
                    onChange={(e) => setFormData({ ...formData, size_mb: parseFloat(e.target.value) })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Display Order</label>
                <input
                  type="number"
                  required
                  value={formData.display_order || 0}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              
              {editingItem && (
                <div className="pt-4 border-t border-border mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-text-primary">Stream Test</label>
                    <button
                      type="button"
                      onClick={testStream}
                      disabled={streamTestResult.status === 'testing'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-md text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Test Connection
                    </button>
                  </div>
                  
                  {streamTestResult.status && (
                    <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                      streamTestResult.status === 'success' ? 'bg-green-500/10 text-green-500' :
                      streamTestResult.status === 'error' ? 'bg-red-500/10 text-red-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {streamTestResult.status === 'success' && <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                      {streamTestResult.status === 'error' && <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                      {streamTestResult.status === 'testing' && <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0 mt-0.5" />}
                      <span>{streamTestResult.message}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'live_classes' && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Subject</label>
                <select
                  required
                  value={formData.subject_id || ''}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select Subject</option>
                  {catalog?.subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Scheduled At</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduled_at ? new Date(new Date(formData.scheduled_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: new Date(e.target.value).toISOString() })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    required
                    value={formData.duration_minutes || 60}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Meeting URL</label>
                <input
                  type="url"
                  value={formData.meeting_url || ''}
                  onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Stream URL (Optional)</label>
                <input
                  type="url"
                  value={formData.stream_url || ''}
                  onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="is_cancelled"
                  checked={formData.is_cancelled || false}
                  onChange={(e) => setFormData({ ...formData, is_cancelled: e.target.checked })}
                  className="rounded border-border text-red-500 focus:ring-red-500"
                />
                <label htmlFor="is_cancelled" className="text-sm font-medium text-text-primary">
                  Cancelled
                </label>
              </div>
            </>
          )}

          {activeTab === 'announcements' && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Content</label>
                <textarea
                  required
                  value={formData.body || ''}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Type</label>
                <select
                  required
                  value={formData.type || 'info'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active !== false}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-text-primary">
                  Active (visible to users)
                </label>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Import Section (Videos Tab Only) */}
      {activeTab === 'videos' && (
        <div className="mt-8 rounded-xl border border-border bg-background shadow-sm overflow-hidden">
          <div 
            className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setIsImportModalOpen(!isImportModalOpen)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Upload size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-text-primary">Bulk Import Videos</h2>
                <p className="text-sm text-text-secondary">Import multiple videos into a specific chapter via JSON</p>
              </div>
            </div>
            <div className={`transform transition-transform ${isImportModalOpen ? 'rotate-180' : ''}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
          
          {isImportModalOpen && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">Target Chapter</label>
                    <select
                      value={formData.bulk_chapter_id || ''}
                      onChange={(e) => setFormData({ ...formData, bulk_chapter_id: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select a chapter...</option>
                      {allChapters.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <CheckCircle size={16} /> Expected JSON Format
                    </h4>
                    <pre className="text-xs bg-white p-2 rounded border border-blue-100 overflow-x-auto">
{`[
  {
    "title": "Video Title",
    "telegram_file_id": "...",
    "telegram_message_id": 123,
    "display_order": 1
  }
]`}
                    </pre>
                  </div>
                </div>
                
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1">JSON Data</label>
                    <textarea
                      value={importJson}
                      onChange={(e) => {
                        setImportJson(e.target.value);
                        setImportProgress('');
                      }}
                      placeholder="Paste JSON array here..."
                      className="w-full h-48 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      disabled={isImporting}
                    />
                  </div>
                  
                  {importProgress && (
                    <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                      importProgress.includes('Error') || importProgress.includes('failed') 
                        ? 'bg-red-50 text-red-700 border border-red-100' 
                        : 'bg-green-50 text-green-700 border border-green-100'
                    }`}>
                      {importProgress.includes('Error') || importProgress.includes('failed') ? <XCircle size={16} /> : <CheckCircle size={16} />}
                      {importProgress}
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={async () => {
                        if (!formData.bulk_chapter_id) {
                          setImportProgress('Error: Please select a target chapter first.');
                          return;
                        }
                        
                        try {
                          setIsImporting(true);
                          setImportProgress('Validating JSON...');
                          
                          let items;
                          try {
                            items = JSON.parse(importJson);
                          } catch {
                            throw new Error('Invalid JSON format. Please check for syntax errors.');
                          }
                          
                          if (!Array.isArray(items)) {
                            throw new Error('JSON must be an array of objects.');
                          }
                          
                          if (items.length === 0) {
                            throw new Error('JSON array is empty.');
                          }
                          
                          // Validate required fields
                          for (let i = 0; i < items.length; i++) {
                            const item = items[i];
                            if (!item.title) throw new Error(`Item at index ${i} is missing 'title'`);
                            if (!item.telegram_message_id) throw new Error(`Item at index ${i} is missing 'telegram_message_id'`);
                          }
                          
                          setImportProgress(`Validation passed. Importing ${items.length} videos...`);
                          
                          // Get channel ID from chapter
                          const chapter = allChapters.find(c => c.id === formData.bulk_chapter_id);
                          const cycle = allCycles.find(c => c.id === chapter?.cycle_id);
                          const channelId = cycle?.telegram_channel_id || '';
                          
                          // Prepare data
                          const dataToInsert = items.map(item => ({
                            ...item,
                            chapter_id: formData.bulk_chapter_id,
                            telegram_channel_id: channelId,
                            is_active: true
                          }));
                          
                          const { error } = await supabase.from('videos').insert(dataToInsert);
                          
                          if (error) throw error;
                          
                          setImportProgress(`Successfully imported ${items.length} videos! Refreshing catalog...`);
                          await refreshCatalog();
                          
                          showToast(`Successfully imported ${items.length} videos`);
                          setImportJson('');
                          setTimeout(() => {
                            setImportProgress('');
                            setIsImportModalOpen(false);
                          }, 3000);
                          
                        } catch (error: any) {
                          console.error('Import error:', error);
                          setImportProgress(`Error: ${error.message}`);
                        } finally {
                          setIsImporting(false);
                        }
                      }} 
                      disabled={isImporting || !importJson.trim()}
                      className="flex items-center gap-2"
                    >
                      {isImporting ? 'Importing...' : (
                        <>
                          <Upload size={16} />
                          Validate & Import
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            {itemToDelete?.isBulk 
              ? `Are you sure you want to delete ${selectedVideos.size} videos? This action cannot be undone.`
              : `Are you sure you want to delete this ${itemToDelete?.table.slice(0, -1)}? This action cannot be undone.`}
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteModalOpen(false);
                setItemToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
