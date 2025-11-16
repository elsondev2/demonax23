import { Ban, Mail, LogOut, AlertTriangle, MessageCircle, Shield } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function BannedAccountScreen() {
  const { logout, authUser } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-base-100 overflow-auto scrollbar-hide scroll-smooth">
      {/* Animated background elements - FIXED */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-error/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-error/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-error/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* App skeleton in background - FIXED */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="h-full flex">
          <div className="w-20 sm:w-64 md:w-80 border-r border-base-300 p-2 sm:p-4 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 sm:h-16 w-full bg-base-300 rounded-lg"></div>
            ))}
          </div>
          <div className="flex-1 flex flex-col">
            <div className="border-b border-base-300 p-4">
              <div className="h-12 w-64 bg-base-300 rounded-lg"></div>
            </div>
            <div className="flex-1 p-4 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`h-20 w-3/4 bg-base-300 rounded-lg ${i % 2 === 1 ? 'ml-auto' : ''}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative min-h-full flex items-center justify-center p-4 sm:p-6 py-8">
        <div className="w-full max-w-4xl animate-in fade-in zoom-in duration-500">
          {/* Main card */}
          <div className="relative bg-base-100 shadow-2xl border-2 border-error/30 overflow-hidden">
            {/* Header */}
            <div className="relative bg-error/5 p-6 sm:p-8 md:p-10 border-b border-error/20">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Animated icon container */}
                <div className="relative">
                  {/* Pulsing background rings */}
                  <div className="absolute inset-0 bg-error/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="absolute inset-0 bg-error/10 rounded-full blur-xl animate-pulse delay-300"></div>
                  
                  {/* Main icon */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-error flex items-center justify-center shadow-lg">
                    <Ban className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-error-content" strokeWidth={2.5} />
                  </div>
                  
                  {/* Alert badge */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-warning flex items-center justify-center shadow-lg animate-bounce">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-warning-content" />
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-error">
                    Account Suspended
                  </h1>
                  <p className="text-sm sm:text-base md:text-lg text-base-content/60 font-medium">
                    Access to your account has been restricted
                  </p>
                </div>
              </div>
            </div>

            {/* Body content */}
            <div className="p-6 sm:p-8 md:p-10 space-y-6 sm:space-y-8">
              {/* Main message */}
              <div className="text-center space-y-3 max-w-2xl mx-auto">
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-base-content">
                  Your account access has been suspended
                </p>
                <p className="text-sm sm:text-base text-base-content/70 leading-relaxed">
                  If you believe this is a mistake or have questions about your suspension, 
                  please contact our support team. We're here to help resolve any issues.
                </p>
              </div>

              {/* Info cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Status card */}
                <div className="group relative bg-error/5 p-5 sm:p-6 border border-error/20 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-error flex items-center justify-center shadow-md">
                      <Ban className="w-6 h-6 text-error-content" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base sm:text-lg text-base-content mb-1">
                        Account Status
                      </h3>
                      <p className="text-sm text-base-content/60 mb-2">
                        Currently suspended
                      </p>
                      {authUser?.email && (
                        <p className="text-xs text-base-content/50 truncate bg-base-200 px-3 py-1.5">
                          {authUser.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Support card */}
                <div className="group relative bg-primary/5 p-5 sm:p-6 border border-primary/20 transition-all duration-300 hover:shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary flex items-center justify-center shadow-md">
                      <MessageCircle className="w-6 h-6 text-primary-content" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-base sm:text-lg text-base-content mb-1">
                        Need Help?
                      </h3>
                      <p className="text-sm text-base-content/60 mb-3">
                        Contact our support team
                      </p>
                      <a
                        href="mailto:elsonmgaya25@gmail.com"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Send Email
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alert banner */}
              <div className="alert alert-error">
                <div className="flex items-start gap-3 sm:gap-4 w-full">
                  <div className="flex-shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm sm:text-base mb-1">
                      Terms of Service Violation
                    </h4>
                    <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                      Your account has been flagged for potential violations. If you believe this is an error, 
                      please reach out to our support team for assistance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                <a
                  href="mailto:elsonmgaya25@gmail.com"
                  className="btn btn-primary flex-1 gap-2"
                >
                  <Mail className="w-5 h-5" />
                  <span>Contact Support</span>
                </a>
                <button
                  onClick={handleLogout}
                  className="btn btn-ghost flex-1 gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Footer */}
              <div className="text-center pt-4 border-t border-base-300">
                <p className="text-xs sm:text-sm text-base-content/50">
                  Support: <a href="mailto:elsonmgaya25@gmail.com" className="text-primary hover:underline font-medium">elsonmgaya25@gmail.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}