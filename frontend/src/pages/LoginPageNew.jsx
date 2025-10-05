import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowRightIcon, UserIcon } from "lucide-react";
import { Link } from "react-router";
import GoogleSignIn from "../components/GoogleSignIn";
import AppLogo from "../components/AppLogo";
import QuickThemeToggle from "../components/QuickThemeToggle";
import ThemeIcons from "../components/ThemeDots";

function LoginPageNew() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="min-h-screen bg-base-300 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center min-h-screen lg:min-h-0 py-8">
        
        {/* Left Side - Branding & Illustration */}
        <div className="hidden lg:flex flex-col items-center justify-center p-12 space-y-8">
          <div className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto">
              <AppLogo className="w-32 h-32" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-primary">
                Welcome Back
              </h1>
              <p className="text-lg text-base-content/70">
                Connect with friends and share moments
              </p>
            </div>
          </div>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 gap-4 w-full max-w-md">
            <div className="flex items-center gap-3 p-4 bg-base-200/50 rounded-xl border border-base-300/50">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <MailIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-base-content">Real-time Chat</h3>
                <p className="text-xs text-base-content/60">Instant messaging with friends</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-base-200/50 rounded-xl border border-base-300/50">
              <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-base-content">Group Chats</h3>
                <p className="text-xs text-base-content/60">Create and manage group conversations</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-base-200/50 rounded-xl border border-base-300/50">
              <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                <LockIcon className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-base-content">Secure & Private</h3>
                <p className="text-xs text-base-content/60">Your conversations are protected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-base-100 rounded-3xl shadow-2xl border border-base-300/50 p-8 space-y-6 max-h-[90vh] overflow-y-auto scrollbar-hide relative">
            
            {/* Theme Toggle - Top Right */}
            <div className="absolute top-4 right-4">
              <QuickThemeToggle />
            </div>
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="lg:hidden w-16 h-16 mx-auto mb-4">
                <AppLogo className="w-16 h-16" />
              </div>
              <h2 className="text-3xl font-bold text-base-content">Sign In</h2>
              <p className="text-base-content/60">Welcome back! Please sign in to continue</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email Address</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    className="input input-bordered w-full pl-12 focus:input-primary transition-all duration-200"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                  <MailIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input input-bordered w-full pl-12 pr-12 focus:input-primary transition-all duration-200"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                  <LockIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className={`btn btn-primary w-full gap-2 ${isLoggingIn ? 'loading' : ''}`}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="divider text-base-content/50">or sign in with</div>

            {/* Google Sign In */}
            <div className="space-y-4">
              <div className="p-4 bg-base-200/30 rounded-2xl border border-base-300/30">
                <div className="flex justify-center">
                  <GoogleSignIn />
                </div>
              </div>
            </div>

            {/* Footer Links */}
            <div className="text-center space-y-4">
              <div className="text-sm text-base-content/60">
                Don't have an account?{" "}
                <Link to="/signup" className="link link-primary font-medium">
                  Create one here
                </Link>
              </div>
              
              <div className="flex justify-center gap-4 text-xs">
                <Link to="/admin/login" className="link link-hover text-base-content/50">
                  Admin Login
                </Link>
                <span className="text-base-content/30">•</span>
                <a href="#" className="link link-hover text-base-content/50">
                  Forgot Password?
                </a>
              </div>
            </div>

            {/* Theme Dots */}
            <div className="pt-4 border-t border-base-300/30">
              <ThemeIcons />
            </div>

            {/* Terms */}
            <div className="text-xs text-center text-base-content/50 pt-3">
              By signing in, you agree to our{" "}
              <Link to="/terms" className="link link-hover">Terms of Service</Link> and{" "}
              <Link to="/privacy" className="link link-hover">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPageNew;