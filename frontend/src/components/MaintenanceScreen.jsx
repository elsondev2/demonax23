// Updated: 2026-01-11 - App is back on monax2.site
import { Sparkles, ExternalLink, LogOut, Gamepad2, Music, Gift, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function MaintenanceScreen() {
  const { logout, authUser } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  // Get user's first name for personalized greeting
  const userName = authUser?.fullName?.split(' ')[0] || authUser?.username || 'Friend';

  return (
    <div className="fixed inset-0 z-[9999] bg-base-100 overflow-auto scrollbar-hide scroll-smooth">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Celebration particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/40 rounded-full animate-bounce"
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
                    <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-primary-content animate-pulse" strokeWidth={2} />
                  </div>

                  {/* Gift badge */}
                  <div className="absolute -top-2 -right-2 w-10 h-10 sm:w-12 sm:h-12 bg-success rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-success-content" />
                  </div>
                </div>

                {/* Personalized greeting */}
                <div className="space-y-3">
                  <p className="text-lg sm:text-xl text-primary font-semibold">
                    Hey {userName}! 🎉
                  </p>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-base-content">
                    We're Back & Better Than Ever!
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg text-base-content/60 font-medium">
                    Demonax has a brand new refined look and is now <span className="text-success font-bold">FREE to use!</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Body content */}
            <div className="p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8">
              {/* Main announcement */}
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-full text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  Now Live on monax2.site
                </div>
                <p className="text-base sm:text-lg text-base-content/80 leading-relaxed">
                  Check out the new Demonax experience with a beautiful redesign,
                  improved performance, and exciting new features!
                </p>
              </div>

              {/* New site CTA */}
              <div className="relative bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-6 sm:p-8 rounded-xl border border-primary/30">
                <div className="flex flex-col items-center gap-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-base-content flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Visit the New Demonax
                    <Sparkles className="w-5 h-5 text-primary" />
                  </h3>
                  <a
                    href="https://monax2.site"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-lg gap-2 shadow-lg hover:scale-105 transition-transform"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Go to monax2.site
                    <ArrowRight className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Games section */}
              <div className="bg-base-200/50 p-5 sm:p-6 rounded-xl">
                <h4 className="font-bold text-base-content mb-4 flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-primary" />
                  Check Out These Easter Eggs!
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Checkers Game */}
                  <a
                    href="https://www.monax2.space/easter-eggs/checkers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-base-100 rounded-lg border border-base-300 hover:border-primary/50 hover:shadow-lg transition-all group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Gamepad2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-base-content group-hover:text-primary transition-colors">Checkers Game</h5>
                      <p className="text-sm text-base-content/60">Play classic checkers online!</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-base-content/40 group-hover:text-primary transition-colors" />
                  </a>

                  {/* Virtual Piano */}
                  <a
                    href="https://www.monax2.space/easter-eggs/piano"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-base-100 rounded-lg border border-base-300 hover:border-primary/50 hover:shadow-lg transition-all group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-base-content group-hover:text-primary transition-colors">Virtual Piano</h5>
                      <p className="text-sm text-base-content/60">Play music on a virtual piano!</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-base-content/40 group-hover:text-primary transition-colors" />
                  </a>
                </div>
              </div>

              {/* Thank you message */}
              <div className="text-center py-4">
                <p className="text-base-content/60 text-sm sm:text-base">
                  Thank you for being part of Demonax, <span className="font-semibold text-primary">{userName}</span>!
                  We can't wait for you to explore the new experience. 💜
                </p>
              </div>

              {/* Sign out button - only show if logged in */}
              {authUser && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={handleLogout}
                    className="btn btn-ghost gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
