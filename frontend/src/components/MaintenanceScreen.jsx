import { Wrench, Calendar, Gift, LogOut, Sparkles, Clock } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function MaintenanceScreen() {
  const { logout, authUser } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  // Get user's first name for personalized greeting
  const userName = authUser?.fullName?.split(' ')[0] || authUser?.username || 'User';

  return (
    <div className="fixed inset-0 z-[9999] bg-base-100 overflow-auto scrollbar-hide scroll-smooth">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Snowflakes / festive particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/30 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative min-h-full flex items-center justify-center p-4 sm:p-6 py-8">
        <div className="w-full max-w-3xl animate-in fade-in zoom-in duration-500">
          {/* Main card */}
          <div className="relative bg-base-100 shadow-2xl border-2 border-primary/30 overflow-hidden rounded-2xl">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 p-6 sm:p-8 md:p-10 border-b border-primary/20">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Animated icon container */}
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="absolute inset-0 bg-secondary/10 rounded-full blur-xl animate-pulse delay-300"></div>
                  
                  {/* Main icon */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg">
                    <Wrench className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-primary-content animate-spin-slow" strokeWidth={2} />
                  </div>
                  
                  {/* Gift badge */}
                  <div className="absolute -top-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-error rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-error-content" />
                  </div>
                </div>

                {/* Personalized greeting */}
                <div className="space-y-3">
                  <p className="text-lg sm:text-xl text-primary font-semibold">
                    Dear {userName} 👋
                  </p>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-base-content">
                    We're Making Things Better!
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg text-base-content/60 font-medium">
                    The app is currently down for maintenance and code improvements
                  </p>
                </div>
              </div>
            </div>

            {/* Body content */}
            <div className="p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8">
              {/* Main message */}
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-full text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Temporary Downtime
                </div>
                <p className="text-base sm:text-lg text-base-content/80 leading-relaxed">
                  We're working hard behind the scenes to fix bugs, improve performance, 
                  and add exciting new features you've been waiting for!
                </p>
              </div>

              {/* Christmas Eve announcement */}
              <div className="relative bg-gradient-to-r from-error/10 via-success/10 to-error/10 p-6 sm:p-8 rounded-xl border border-success/30">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-error to-success rounded-full flex items-center justify-center shadow-lg">
                      <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-base-content mb-2 flex items-center justify-center sm:justify-start gap-2">
                      <Sparkles className="w-5 h-5 text-warning" />
                      Coming Back Christmas Eve!
                      <Sparkles className="w-5 h-5 text-warning" />
                    </h3>
                    <p className="text-base-content/70 text-sm sm:text-base">
                      The app will be back online on <span className="font-bold text-success">December 24th, 2025</span> with 
                      all the features we promised and more! Consider it our Christmas gift to you 🎄
                    </p>
                  </div>
                </div>
              </div>

              {/* Features coming */}
              <div className="bg-base-200/50 p-5 sm:p-6 rounded-xl">
                <h4 className="font-bold text-base-content mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  What to Expect When We're Back:
                </h4>
                <ul className="space-y-2 text-sm sm:text-base text-base-content/70">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-success rounded-full"></span>
                    Bug fixes and performance improvements
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-success rounded-full"></span>
                    All previously promised features
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-success rounded-full"></span>
                    Better stability and user experience
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-success rounded-full"></span>
                    Some surprise additions! 🎁
                  </li>
                </ul>
              </div>

              {/* Thank you message */}
              <div className="text-center py-4">
                <p className="text-base-content/60 text-sm sm:text-base">
                  Thank you for your patience, <span className="font-semibold text-primary">{userName}</span>! 
                  We appreciate your support and can't wait to see you again soon. 💜
                </p>
              </div>

              {/* Sign out button */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleLogout}
                  className="btn btn-ghost gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animation for slow spin */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
