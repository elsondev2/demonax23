import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router";
import GoogleSignIn from "../components/GoogleSignIn";
import ThemeIcons from "../components/ThemeDots";
import AppLogo from "../components/AppLogo";
import { useThemeStore } from "../store/useThemeStore";

function LoginPageNew() {
  const location = useLocation();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn } = useAuthStore();
  const navigate = useNavigate();

  const currentTheme = useThemeStore((state) => state.currentTheme);

  // Get theme-specific text color
  const getTextColor = () => {
    switch (currentTheme) {
      case 'light':
        return '#1a1a1a'; // Dark black for light theme
      case 'synthwave':
        return '#e779c1'; // Synthwave pink
      case 'dracula':
        return '#f8f8f2'; // Dracula white
      default:
        return undefined; // Use theme's default primary-content
    }
  };

  // Get theme-specific text shadow
  const getTextShadow = () => {
    if (currentTheme === 'cyberpunk') {
      return 'none'; // No shadow for cyberpunk
    }
    return '0 2px 10px rgba(0,0,0,0.3), 0 0 20px rgba(0,0,0,0.2)';
  };

  // Pre-fill email if coming from signup
  useEffect(() => {
    if (location.state?.email) {
      setFormData(prev => ({ ...prev, email: location.state.email }));
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData);
    if (result?.success) {
      navigate("/chat");
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-base-100">
      {/* LEFT PANEL - Welcome Section */}
      <div className="hidden md:flex md:w-1/2 flex-col items-center relative overflow-hidden bg-gradient-to-br from-primary/90 to-secondary/90" style={{ minHeight: '100vh', paddingTop: '20vh' }}>
        {/* Decorative Circles */}
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-white/20 backdrop-blur-md shadow-lg"></div>
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-48 h-48 rounded-full bg-white/15 backdrop-blur-md shadow-lg"></div>
        <div className="absolute bottom-32 left-16 w-40 h-40 rounded-full bg-white/20 backdrop-blur-md shadow-lg"></div>
        <div className="absolute bottom-1/4 right-20 w-28 h-28 rounded-full bg-white/25 backdrop-blur-md shadow-lg"></div>

        {/* Content */}
        <div className="text-center space-y-5 p-10 relative z-10" style={{ color: getTextColor(), textShadow: getTextShadow() }}>
          <div className="mb-6">
            <AppLogo className="w-24 h-24 mx-auto" />
          </div>
          <h1 className="text-6xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-lg font-light opacity-90">We're glad to see you again. Let's continue the conversation.</p>
        </div>
      </div>

      {/* RIGHT PANEL - Form Section - SCROLLABLE */}
      <div className="w-full md:w-1/2 bg-base-100">
        <div className="h-screen overflow-y-auto">
          <div className="flex items-center justify-center p-8 min-h-screen">
            <div className="w-full max-w-md py-6">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <svg className="w-14 h-14 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-base-content mb-2">Sign In</h2>
                <p className="text-sm text-base-content/60">Welcome back! Please sign in to continue</p>
              </div>

              {/* Email / Password form - FIRST */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text text-base-content/70">Email Address</span>
                  </label>
                  <label className="input input-bordered flex items-center gap-2 bg-base-200 w-full">
                    <MailIcon className="w-4 h-4 opacity-70" />
                    <input
                      type="email"
                      className="grow"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </label>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text text-base-content/70">Password</span>
                  </label>
                  <label className="input input-bordered flex items-center gap-2 bg-base-200 w-full">
                    <LockIcon className="w-4 h-4 opacity-70" />
                    <input
                      type={showPassword ? "text" : "password"}
                      className="grow"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      className="text-base-content/40 hover:text-base-content transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </label>
                </div>

                <button
                  className={`btn btn-primary w-full mt-6 ${isLoggingIn ? 'btn-disabled' : ''}`}
                  type="submit"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </form>

              <div className="divider text-base-content/60 text-sm my-8">or</div>

              {/* Google Sign In - Centered */}
              <div className="flex justify-center w-full">
                <div className="w-full max-w-sm">
                  <GoogleSignIn onSuccess={() => navigate("/chat")} />
                </div>
              </div>

              <div className="mt-8 text-center text-sm text-base-content/60">
                Don't have an account? <Link to="/signup" className="text-primary hover:underline">Create account</Link>
              </div>

              <div className="mt-4 text-center">
                <Link to="/admin/login" className="text-xs text-base-content/40 hover:text-base-content/60">Admin Portal</Link>
              </div>

              {/* Theme Picker - Below Footer */}
              <div className="mt-8 pt-6 border-t border-base-300">
                <ThemeIcons />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPageNew;
