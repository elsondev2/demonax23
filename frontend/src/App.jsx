import { Navigate, Route, Routes, useLocation } from "react-router";
import ChatPage from "./pages/ChatPage";
import LoginPageNew from "./pages/LoginPageNew";
import SignUpPageNew from "./pages/SignUpPageNew";
import JoinGroupPage from "./pages/JoinGroupPage";
import AdminPage from "./pages/AdminPage";
import AdminLoginPageNew from "./pages/AdminLoginPageNew";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import LandingPage from "./pages/LandingPage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import PageLoader from "./components/PageLoader";
import ThemeProvider from "./components/ThemeProvider";
import AppearanceModal from "./components/AppearanceModal";
import ThemeLoadingBar from "./components/ThemeLoadingBar";
import ProtectedRoute from "./components/ProtectedRoute";

import { Toaster } from "react-hot-toast";

function AppContent() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  // Don't apply overflow-hidden to landing page
  // Fix mobile scrolling: remove overflow-hidden on mobile, keep on desktop
  const containerClass = isLandingPage
    ? ""
    : "w-screen min-h-screen md:h-screen md:overflow-hidden bg-base-100 text-base-content";

  // Debug logging for mobile scroll issue
  useEffect(() => {
    if (!isLandingPage) {
      console.log('🔍 App.jsx Debug - Container classes:', containerClass);
      console.log('🔍 App.jsx Debug - Is mobile:', window.innerWidth < 768);
      console.log('🔍 App.jsx Debug - Viewport height:', window.innerHeight);
      console.log('🔍 App.jsx Debug - overflow-hidden applied:', containerClass.includes('overflow-hidden'));
    }
  }, [containerClass, isLandingPage]);

  return (
    <div className={containerClass}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } />
        <Route path="/logintowoof" element={<LoginPageNew />} />
        <Route path="/login" element={<LoginPageNew />} />
        <Route path="/signin" element={<LoginPageNew />} />
        <Route path="/signup" element={<SignUpPageNew />} />
        <Route path="/register" element={<SignUpPageNew />} />
        <Route path="/join/:token" element={
          <ProtectedRoute>
            <JoinGroupPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/login" element={<AdminLoginPageNew />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="/posts" element={
          <ProtectedRoute redirectTo="/login">
            <ChatPage />
          </ProtectedRoute>
        } />
        <Route path="/posts/public" element={
          <ProtectedRoute redirectTo="/login">
            <ChatPage />
          </ProtectedRoute>
        } />
        <Route path="/posts/mine" element={
          <ProtectedRoute redirectTo="/login">
            <ChatPage />
          </ProtectedRoute>
        } />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
      </Routes>

      {!isLandingPage && (
        <>
          <Toaster />
          <AppearanceModal />
        </>
      )}
    </div>
  );
}

function App() {
  const { checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <ThemeProvider>
      <ThemeLoadingBar />
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
