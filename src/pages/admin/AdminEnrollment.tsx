import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, Copy, CheckCircle2, XCircle, Loader2, ShieldAlert } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';

export const AdminEnrollment: React.FC = () => {
  const [codes, setCodes] = useState<any[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [maxUses, setMaxUses] = useState(1);
  
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [codeTimer, setCodeTimer] = useState(0);
  
  const { showToast } = useToast();

  const fetchCodesAndLogs = React.useCallback(async () => {
    try {
      // We assume chapter_access_codes and chapter_access_logs tables exist based on the spec
      const [codesRes, logsRes] = await Promise.all([
        supabase.from('chapter_access_codes').select('*, chapters(name)').order('created_at', { ascending: false }),
        supabase.from('chapter_access_logs').select('*, profiles(email), chapters(name)').order('accessed_at', { ascending: false }).limit(50)
      ]);

      if (codesRes.data) setCodes(codesRes.data);
      if (logsRes.data) setAccessLogs(logsRes.data);
    } catch (error) {
      console.error('Error fetching enrollment data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodesAndLogs();
  }, [fetchCodesAndLogs]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (codeTimer > 0) {
      interval = setInterval(() => setCodeTimer(t => t - 1), 1000);
    } else if (codeTimer === 0 && generatedCode) {
      setGeneratedCode(null);
    }
    return () => clearInterval(interval);
  }, [codeTimer, generatedCode]);

  const generateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChapter) {
      showToast('Please select a chapter');
      return;
    }
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.rpc('admin_generate_chapter_code', {
        p_chapter_id: selectedChapter,
        p_max_uses: maxUses
      });

      if (error) throw error;

      if (data) {
        setGeneratedCode(data);
        setCodeTimer(60);
        showToast('Code generated successfully');
        fetchCodesAndLogs();
      }
    } catch (error) {
      console.error('Error generating code:', error);
      showToast('Failed to generate code');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleCodeStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.rpc('admin_toggle_enrollment_code', {
        p_code_id: id,
        p_is_active: !currentStatus
      });

      if (error) throw error;
      fetchCodesAndLogs();
      showToast(`Code ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling code status:', error);
      showToast('Failed to update code status');
    }
  };

  const deleteCode = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this code?')) return;

    try {
      const { error } = await supabase.from('chapter_access_codes').delete().eq('id', id);
      if (error) throw error;
      fetchCodesAndLogs();
      showToast('Code deleted successfully');
    } catch (error) {
      console.error('Error deleting code:', error);
      showToast('Failed to delete code');
    }
  };

  const blockAccess = async (userId: string, chapterId: string) => {
    if (!window.confirm('Are you sure you want to block this user from this chapter?')) return;
    
    try {
      const { error } = await supabase.rpc('admin_block_chapter_access', {
        p_user_id: userId,
        p_chapter_id: chapterId
      });
      
      if (error) throw error;
      showToast('User access blocked');
      fetchCodesAndLogs();
    } catch (error) {
      console.error('Error blocking access:', error);
      showToast('Failed to block access');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Code copied to clipboard');
  };

  const [subjects, setSubjects] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('subjects')
      .select('id, name, name_bn, slug')
      .order('display_order')
      .then(({ data, error }) => {
        if (error) console.error('Subjects fetch error:', error);
        setSubjects(data || []);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubjectChange = async (subjectId: string) => {
    setSelectedSubject(subjectId);
    setSelectedCycle('');
    setSelectedChapter('');
    setCycles([]);
    setChapters([]);
    
    if (!subjectId) return;
    
    const { data } = await supabase.from('cycles')
      .select('id, name, name_bn')
      .eq('subject_id', subjectId)
      .order('display_order');
    setCycles(data || []);
  };

  const handleCycleChange = async (cycleId: string) => {
    setSelectedCycle(cycleId);
    setSelectedChapter('');
    setChapters([]);
    
    if (!cycleId) return;
    
    const { data } = await supabase.from('chapters')
      .select('id, name, name_bn')
      .eq('cycle_id', cycleId)
      .order('display_order');
    setChapters(data || []);
  };

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Chapter Enrollment Codes</h1>
        <p className="text-text-secondary">Generate and manage chapter-specific access codes.</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Generate New Code</h2>
        <form onSubmit={generateCode} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
            >
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Cycle</label>
            <select
              value={selectedCycle}
              onChange={(e) => handleCycleChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
              disabled={!selectedSubject}
            >
              <option value="">Select Cycle</option>
              {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Chapter</label>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              required
              disabled={!selectedCycle}
            >
              <option value="">Select Chapter</option>
              {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="w-24">
              <label className="block text-sm font-medium text-text-secondary mb-1">Max Uses</label>
              <input
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
            <Button type="submit" disabled={isGenerating || !selectedChapter} className="flex-1">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Generate
            </Button>
          </div>
        </form>

        {generatedCode && (
          <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary mb-1">Generated Code (Expires in {codeTimer}s)</p>
              <p className="text-2xl font-mono font-bold text-primary tracking-wider">{generatedCode}</p>
            </div>
            <Button onClick={() => copyToClipboard(generatedCode)} variant="outline" className="gap-2">
              <Copy className="h-4 w-4" /> Copy Code
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-background/50">
            <h2 className="font-semibold text-text-primary">Active Codes</h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-background/50 text-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Chapter</th>
                  <th className="px-4 py-3 font-medium">Uses</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {codes.map((code) => (
                  <tr key={code.id} className="hover:bg-background/50">
                    <td className="px-4 py-3 font-mono text-primary">{code.code.substring(0, 8)}...</td>
                    <td className="px-4 py-3 truncate max-w-[120px]">{code.chapters?.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${code.uses_count >= code.max_uses ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {code.uses_count}/{code.max_uses}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleCodeStatus(code.id, code.is_active)}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                          code.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {code.is_active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {code.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteCode(code.id)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border bg-background/50">
            <h2 className="font-semibold text-text-primary">Access Logs</h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-background/50 text-text-secondary">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Chapter</th>
                  <th className="px-4 py-3 font-medium">Device Info</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accessLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-background/50">
                    <td className="px-4 py-3 truncate max-w-[120px]" title={log.profiles?.email}>{log.profiles?.email}</td>
                    <td className="px-4 py-3 truncate max-w-[100px]">{log.chapters?.name}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-text-secondary truncate max-w-[150px]" title={log.user_agent}>
                        {log.ip_address}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => blockAccess(log.user_id, log.chapter_id)}
                        className="text-red-500 hover:text-red-700 p-1 inline-flex items-center gap-1 text-xs font-medium"
                      >
                        <ShieldAlert className="h-4 w-4" /> Block
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

