import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { LogOut, Settings, User as UserIcon } from 'lucide-react';

export const Topbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">
              N
            </div>
            <span className="text-xl font-bold text-text-primary hidden sm:inline-block">
              NexusEdu
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              {profile?.role === 'admin' && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2">
                    <Settings size={16} />
                    <span>Admin</span>
                  </Button>
                </Link>
              )}
              <div className="flex items-center gap-3 border-l border-border pl-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium text-text-primary">
                    {profile?.display_name || user.email}
                  </span>
                  <span className="text-xs text-text-secondary capitalize">
                    {profile?.role || 'User'}
                  </span>
                </div>
                <div className="h-8 w-8 rounded-full bg-surface flex items-center justify-center text-primary">
                  <UserIcon size={18} />
                </div>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="px-2">
                  <LogOut size={18} />
                </Button>
              </div>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm">Log in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
