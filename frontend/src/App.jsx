import { Navigate, Route, Routes, useLocation } from "react-router";
import ChatPage from "./pages/ChatPage";
import LoginPageNew from "./pages/LoginPageNew";
import SignUpPageNew from "./pages/SignUpPageNew";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import JoinGroupPage from "./pages/JoinGroupPage";
import AdminPage from "./pages/admin/AdminPage";
import AdminLoginPageNew from "./pages/AdminLoginPageNew";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import Eulapage from "./pages/Eulapage";
import LandingPage from "./pages/LandingPage";
import AuthChoicePage from "./pages/AuthChoicePage";
import CheckersGamePage from "./pages/CheckersGamePage";
import PianoPage from "./pages/PianoPage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import PageLoader from "./components/PageLoader";
import "./styles/formatted-message.css";
import "./styles/link-embeds.css";
import "./styles/piano.css";
import ThemeProvider from "./components/ThemeProvider";
import AppearanceModal from "./components/AppearanceModal";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AnnouncementBanner from "./components/AnnouncementBanner";
import BannedAccountScreen from "./components/BannedAccountScreen";
import PaymentNotificationModal from "./components/PaymentNotificationModal";
import PaymentBlockScreen from "./components/PaymentBlockScreen";
import PaymentInstructionsPage from "./pages/PaymentInstructionsPage";
import VotingPage from "./pages/VotingPage";
import MaintenanceScreen from "./components/MaintenanceScreen";

import { Toaster } from "react-hot-toast";
import { SocketProvider } from "./contexts/SocketContext.jsx";
import CallScreen from "./components/CallScreen";
import IncomingCall from "./components/IncomingCall";

function AppContent() {
  const location = useLocation();
  const { authUser } = useAuthStore();
  const isLandingPage = location.pathname === '/';
  const isPaymentPage = location.pathname === '/payment-instructions';
  
  // Check if user is banned (but allow admins to bypass)
  const isBanned = authUser?.isBanned === true && authUser?.role !== 'admin';
  
  // Check if trial has ended (Dec 25, 2025 - Extended to Christmas!)
  const TRIAL_END_DATE = new Date("2025-12-25T23:59:59");
  const hasTrialEnded = new Date() > TRIAL_END_DATE;
  
  // Check if user has active subscription
  const hasActiveSubscription = authUser?.isPremium === true && 
    authUser?.paymentStatus === 'active' &&
    (authUser?.premiumEndDate ? new Date(authUser.premiumEndDate) > new Date() : true);

  // Debug logging for banned status
  useEffect(() => {
    if (authUser) {
      console.log('🔍 User Ban Status Check:', {
        email: authUser.email,
        isBanned: authUser.isBanned,
        role: authUser.role,
        willShowBanScreen: isBanned
      });
    }
  }, [authUser, isBanned]);

  // Don't apply overflow-hidden to landing page
  // Fix mobile scrolling: remove overflow-hidden on mobile, keep on desktop
  // Use dvh for mobile to account for browser UI
  const containerClass = isLandingPage
    ? ""
    : "w-screen h-[100dvh] md:h-screen md:overflow-hidden bg-base-100 text-base-content";

  // Debug logging for mobile scroll issue
  useEffect(() => {
    if (!isLandingPage) {
      console.log('🔍 App.jsx Debug - Container classes:', containerClass);
      console.log('🔍 App.jsx Debug - Is mobile:', window.innerWidth < 768);
      console.log('🔍 App.jsx Debug - Viewport height:', window.innerHeight);
      console.log('🔍 App.jsx Debug - overflow-hidden applied:', containerClass.includes('overflow-hidden'));
    }
  }, [containerClass, isLandingPage]);

  // Show banned screen if user is banned
  if (isBanned) {
    return <BannedAccountScreen />;
  }

  // Show maintenance screen for all logged-in users (except admins)
  const isMaintenanceMode = true; // Set to false when maintenance is complete
  if (authUser && isMaintenanceMode && authUser?.role !== 'admin') {
    return <MaintenanceScreen />;
  }

  // Show payment block screen if trial ended and no subscription (except on payment page)
  if (authUser && hasTrialEnded && !hasActiveSubscription && !isPaymentPage) {
    return <PaymentBlockScreen />;
  }

  return (
    <SocketProvider>
      <div className={containerClass}>
        {!isLandingPage && authUser && <AnnouncementBanner />}
        <Routes>
          <Route path="/" element={authUser ? <Navigate to="/chats" replace /> : <LandingPage />} />
          <Route path="/chat" element={<Navigate to="/chats" replace />} />
          <Route path="/chats/*" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/apps" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/donate" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/posts" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/notices" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/chat/user/:userId" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/chat/group/:groupId" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/login" element={authUser ? <Navigate to="/chats" replace /> : <AuthChoicePage />} />
          <Route path="/signin" element={authUser ? <Navigate to="/chats" replace /> : <LoginPageNew />} />
          <Route path="/signup" element={authUser ? <Navigate to="/chats" replace /> : <SignUpPageNew />} />
          <Route path="/register" element={authUser ? <Navigate to="/chats" replace /> : <SignUpPageNew />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route path="/join/:token" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/login" element={<AdminLoginPageNew />} />
          <Route path="/admin/*" element={
            <AdminProtectedRoute>
              <AdminPage />
            </AdminProtectedRoute>
          } />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/eula" element={<Eulapage />} />
          <Route path="/games/checkers" element={
            <ProtectedRoute>
              <CheckersGamePage />
            </ProtectedRoute>
          } />
          <Route path="/games/checkers/:gameId" element={
            <ProtectedRoute>
              <CheckersGamePage />
            </ProtectedRoute>
          } />
          <Route path="/piano" element={
            <ProtectedRoute>
              <PianoPage />
            </ProtectedRoute>
          } />
          <Route path="/payment-instructions" element={
            <ProtectedRoute>
              <PaymentInstructionsPage />
            </ProtectedRoute>
          } />
          <Route path="/vote" element={
            <ProtectedRoute>
              <VotingPage />
            </ProtectedRoute>
          } />
        </Routes>

        {!isLandingPage && (
          <>
            <Toaster />
            <AppearanceModal />
            {authUser && !hasTrialEnded && !hasActiveSubscription && <PaymentNotificationModal />}
          </>
        )}

        {/* Call UI - Global overlays */}
        {authUser && (
          <>
            <IncomingCall />
            <CallScreen />
          </>
        )}
      </div>
    </SocketProvider>
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
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
