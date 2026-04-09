import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, BookOpen, PlayCircle, ArrowLeft, X, Mic, MicOff, Filter } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { StudentLayout } from '../components/layout/StudentLayout';
import { SEO } from '../components/SEO';

export function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'chapter' | 'subject'>('all');
  const { results: searchResults } = useSearch(searchQuery);
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [hasRecognition] = useState(() => {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  });
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (hasRecognition) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'bn-BD'; // Default to Bangla, can also understand English

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchQuery(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [hasRecognition]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Could not start speech recognition", e);
      }
    }
  };

  const filteredResults = searchResults.filter(result => 
    filterType === 'all' ? true : result.type === filterType
  );

  return (
    <StudentLayout>
      <SEO title="খুঁজুন | NexusEdu" />
      <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors bangla"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>ফিরে যান</span>
          </button>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <SearchIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 bangla">খুঁজুন</h1>
            <p className="text-sm text-gray-500 bangla">ভিডিও, চ্যাপ্টার বা বিষয় খুঁজুন</p>
          </div>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            autoFocus
            placeholder="ভিডিও, চ্যাপ্টার বা বিষয় খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-12 pr-20 py-4 border border-gray-200 rounded-2xl leading-5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm transition-shadow bangla text-lg"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
            {hasRecognition && (
              <button 
                onClick={toggleListening}
                className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
              >
                {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0 mr-1" />
          {[
            { id: 'all', label: 'সব' },
            { id: 'video', label: 'ভিডিও' },
            { id: 'chapter', label: 'চ্যাপ্টার' },
            { id: 'subject', label: 'বিষয়' }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setFilterType(filter.id as any)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors bangla ${
                filterType === filter.id 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {searchQuery && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {filteredResults.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {filteredResults.map((result) => (
                  <li key={`${result.type}-${result.id}`}>
                    <Link
                      to={result.url}
                      className="block p-5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 mr-4 w-12 h-12 rounded-xl flex items-center justify-center ${
                          result.type === 'video' ? 'bg-indigo-50 text-indigo-600' :
                          result.type === 'chapter' ? 'bg-amber-50 text-amber-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {result.type === 'video' && <PlayCircle className="w-6 h-6" />}
                          {result.type === 'chapter' && <BookOpen className="w-6 h-6" />}
                          {result.type === 'subject' && <BookOpen className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-900 bangla">{result.title}</p>
                          <p className="text-sm text-gray-500 bangla mt-0.5">{result.subtitle}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-16 text-center">
                <SearchIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1 bangla">কোনো ফলাফল পাওয়া যায়নি</h3>
                <p className="text-gray-500 bangla">
                  '{searchQuery}' এর জন্য {filterType !== 'all' ? filterType + ' ' : ''}কোনো ফলাফল পাওয়া যায়নি
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
