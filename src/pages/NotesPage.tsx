import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, Trash2, Video, Edit2, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCatalog } from '../contexts/CatalogContext';
import { supabase } from '../lib/supabase';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

interface Note {
  id: string;
  video_id: string;
  content: string;
  updated_at: string;
}

export function NotesPage() {
  const { user } = useAuth();
  const { catalog } = useCatalog();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNotes() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('video_notes')
          .select('*')
          .eq('user_id', user.id)
          .neq('content', '')
          .order('updated_at', { ascending: false });
          
        if (error) throw error;
        setNotes(data || []);
      } catch (err) {
        console.error('Error fetching notes:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchNotes();
  }, [user]);

  const confirmDelete = (id: string) => {
    setNoteToDelete(id);
    setDeleteModalOpen(true);
  };

  const deleteNote = async () => {
    if (!noteToDelete) return;
    
    try {
      const { error } = await supabase
        .from('video_notes')
        .delete()
        .eq('id', noteToDelete);
        
      if (error) throw error;
      setNotes(notes.filter(n => n.id !== noteToDelete));
    } catch (err) {
      console.error('Error deleting note:', err);
    } finally {
      setDeleteModalOpen(false);
      setNoteToDelete(null);
    }
  };

  const getVideoDetails = (videoId: string) => {
    if (!catalog) return null;
    for (const subject of catalog.subjects) {
      for (const cycle of subject.cycles) {
        for (const chapter of cycle.chapters) {
          const video = chapter.videos.find((v: any) => v.id === videoId);
          if (video) {
            return { subject, cycle, chapter, video };
          }
        }
      }
    }
    return null;
  };

  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const details = getVideoDetails(note.video_id);
    const searchLower = searchQuery.toLowerCase();
    
    return (
      note.content.toLowerCase().includes(searchLower) ||
      (details && details.video.title.toLowerCase().includes(searchLower)) ||
      (details && details.chapter.name.toLowerCase().includes(searchLower))
    );
  });

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
              <FileText className="w-6 h-6 text-primary" />
              আমার নোটস
            </h1>
            <p className="text-text-secondary mt-1" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
              ভিডিও ক্লাস থেকে নেওয়া তোমার সব নোটস
            </p>
          </div>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="নোটস খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              style={{ fontFamily: 'Hind Siliguri, sans-serif' }}
            />
          </div>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-border">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>কোনো নোট পাওয়া যায়নি</h3>
            <p className="text-text-secondary" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
              {searchQuery ? 'তোমার খোঁজার সাথে মিল রেখে কোনো নোট পাওয়া যায়নি।' : 'তুমি এখনো কোনো ভিডিওতে নোট নাওনি।'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotes.map(note => {
              const details = getVideoDetails(note.video_id);
              if (!details) return null;
              
              return (
                <div key={note.id} className="bg-white rounded-2xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-text-primary mb-1">{details.video.title}</h3>
                      <p className="text-sm text-text-secondary mb-2" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                        {details.subject.name} • {details.chapter.name}
                      </p>
                      <div className="flex items-center text-xs text-text-secondary gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(note.updated_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => confirmDelete(note.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                      {note.content}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link 
                      to={`/watch/${note.video_id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors"
                      style={{ fontFamily: 'Hind Siliguri, sans-serif' }}
                    >
                      <Video className="w-4 h-4" />
                      Video দেখুন
                    </Link>
                    <Link 
                      to={`/watch/${note.video_id}?tab=notes`}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                      style={{ fontFamily: 'Hind Siliguri, sans-serif' }}
                    >
                      <Edit2 className="w-4 h-4" />
                      সম্পাদনা করুন
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="নোট মুছবেন?"
      >
        <div className="space-y-4">
          <p className="text-text-secondary bangla">
            আপনি কি নিশ্চিত যে আপনি এই নোটটি মুছে ফেলতে চান? এই কাজটি বাতিল করা যাবে না।
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              বাতিল
            </Button>
            <Button variant="danger" onClick={deleteNote}>
              মুছে ফেলুন
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
