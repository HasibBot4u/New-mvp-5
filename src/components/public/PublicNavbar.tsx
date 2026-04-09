import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { NexusLogo } from '../shared/NexusLogo';
import { Menu, X } from 'lucide-react';

export const PublicNavbar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-border-light py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex-shrink-0 flex items-center">
            <NexusLogo withSubtitle={false} />
          </div>
          
          <div className="hidden md:flex space-x-8 items-center">
            <a href="/#courses" className={`bangla font-medium transition-colors ${scrolled ? 'text-text-secondary hover:text-primary' : 'text-white/90 hover:text-white'}`}>কোর্সসমূহ</a>
            <Link to="/success-stories" className={`bangla font-medium transition-colors ${scrolled ? 'text-text-secondary hover:text-primary' : 'text-white/90 hover:text-white'}`}>সাফল্য গাথা</Link>
            <Link to="/about" className={`bangla font-medium transition-colors ${scrolled ? 'text-text-secondary hover:text-primary' : 'text-white/90 hover:text-white'}`}>আমাদের সম্পর্কে</Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="bangla bg-primary hover:bg-primary-hover text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                ড্যাশবোর্ড
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className={`bangla font-semibold px-4 py-2 transition-colors ${scrolled ? 'text-text-primary hover:text-primary' : 'text-white hover:text-white/80'}`}
                >
                  লগইন
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="bangla bg-accent hover:bg-amber-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  ফ্রি শুরু করুন
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`focus:outline-none ${scrolled ? 'text-text-primary' : 'text-white'}`}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-border-light shadow-lg py-4 px-4 flex flex-col space-y-4">
          <a href="/#courses" onClick={() => setMobileMenuOpen(false)} className="bangla text-text-secondary hover:text-primary font-medium">কোর্সসমূহ</a>
          <Link to="/success-stories" onClick={() => setMobileMenuOpen(false)} className="bangla text-text-secondary hover:text-primary font-medium">সাফল্য গাথা</Link>
          <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="bangla text-text-secondary hover:text-primary font-medium">আমাদের সম্পর্কে</Link>
          <hr className="border-border-light" />
          {user ? (
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}
              className="bangla bg-primary text-white font-semibold px-4 py-2 rounded-lg text-center"
            >
              ড্যাশবোর্ড
            </button>
          ) : (
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                className="bangla border border-border-light text-text-primary font-semibold px-4 py-2 rounded-lg text-center"
              >
                লগইন
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }}
                className="bangla bg-accent text-white font-semibold px-4 py-2 rounded-lg text-center"
              >
                ফ্রি শুরু করুন
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
