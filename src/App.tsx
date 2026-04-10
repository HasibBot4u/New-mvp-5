import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CatalogProvider } from './contexts/CatalogContext';
import { ToastProvider } from './components/ui/Toast';
import { SystemSettingsProvider, useSystemSettings } from './contexts/SystemSettingsContext';
import BottomNav from './components/layout/BottomNav';
import { LoadingSpinner } from './components/LoadingSpinner';
import MaintenancePage from './pages/MaintenancePage';
import { AdminLayout } from './pages/admin/AdminLayout';

// Lazy load pages
const LandingPage = React.lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const CoursesPage = React.lazy(() => import('./pages/CoursesPage').then(m => ({ default: m.CoursesPage })));
const SubjectPage = React.lazy(() => import('./pages/SubjectPage').then(m => ({ default: m.SubjectPage })));
const ChaptersPage = React.lazy(() => import('./pages/ChaptersPage').then(m => ({ default: m.ChaptersPage })));
const VideoListPage = React.lazy(() => import('./pages/VideoListPage').then(m => ({ default: m.VideoListPage })));
const PlayerPage = React.lazy(() => import('./pages/PlayerPage').then(m => ({ default: m.PlayerPage })));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const NotesPage = React.lazy(() => import('./pages/NotesPage').then(m => ({ default: m.NotesPage })));
const SearchPage = React.lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage'));
const LiveClassPage = React.lazy(() => import('./pages/LiveClassPage').then(m => ({ default: m.LiveClassPage })));

const ProgressPage = React.lazy(() => import('./pages/ProgressPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const ContactPage = React.lazy(() => import('./pages/ContactPage'));
const PrivacyPage = React.lazy(() => import('./pages/PrivacyPage'));
const TermsPage = React.lazy(() => import('./pages/TermsPage'));

// Admin Pages
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminContent = React.lazy(() => import('./pages/admin/AdminContent').then(m => ({ default: m.AdminContent })));
const AdminSystem = React.lazy(() => import('./pages/admin/AdminSystem').then(m => ({ default: m.AdminSystem })));
const AdminLogs = React.lazy(() => import('./pages/admin/AdminLogs').then(m => ({ default: m.AdminLogs })));
const AdminEnrollment = React.lazy(() => import('./pages/admin/AdminEnrollment').then(m => ({ default: m.AdminEnrollment })));

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { settings, isLoading: settingsLoading } = useSystemSettings();

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" />;
  }

  if (settings?.maintenance_mode && profile.role !== 'admin') {
    return <MaintenancePage />;
  }

  if (profile.is_blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 bangla">অ্যাকাউন্ট স্থগিত</h2>
          <p className="text-gray-600 bangla">
            আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে। বিস্তারিত জানতে অ্যাডমিনের সাথে যোগাযোগ করুন।
          </p>
        </div>
      </div>
    );
  }

  if (requireAdmin && profile.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
}

function AppLayout() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Outlet />
      {user && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <SystemSettingsProvider>
      <AuthProvider>
        <CatalogProvider>
          <ToastProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Suspense fallback={
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                  <LoadingSpinner />
                  <p className="mt-4 text-gray-500 bangla">লোড হচ্ছে...</p>
                </div>
              }>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />

                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />

                  <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/courses" element={<CoursesPage />} />
                    <Route path="/subject/:slug" element={<SubjectPage />} />
                    <Route path="/cycle/:cycleId" element={<ChaptersPage />} />
                    <Route path="/chapter/:chapterId" element={<VideoListPage />} />
                    <Route path="/watch/:videoId" element={<PlayerPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/notes" element={<NotesPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/live" element={<LiveClassPage />} />
                    <Route path="/progress" element={<ProgressPage />} />
                  </Route>

                  <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="content" element={<AdminContent />} />
                    <Route path="enrollment" element={<AdminEnrollment />} />
                    <Route path="system" element={<AdminSystem />} />
                    <Route path="logs" element={<AdminLogs />} />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </ToastProvider>
        </CatalogProvider>
      </AuthProvider>
    </SystemSettingsProvider>
  );
}

export default App;
