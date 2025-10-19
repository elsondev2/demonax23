import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ShieldCheckIcon, UserIcon, LockIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import AppLogo from "../components/AppLogo";
import ThemeIcons from "../components/ThemeDots";
import toast from "react-hot-toast";
import { useThemeStore } from "../store/useThemeStore";

function AdminLoginPageNew() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const { authUser, setAuthUser } = useAuthStore();
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

  // Redirect if already logged in as admin
  useEffect(() => {
    if (authUser?.role === "admin") {
      navigate("/admin");
    }
  }, [authUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const res = await axiosInstance.post("/api/admin/login", formData);

      // Store token in localStorage for Authorization header
      if (res.data.token) {
        localStorage.setItem("jwt-token", res.data.token);
        console.log("✅ Admin token stored in localStorage");
      }

      // Update auth store with admin user (without token in the user object)
      const { token: _token, ...userData } = res.data;
      setAuthUser(userData);
      console.log("✅ Admin user set in auth store:", userData);

      toast.success("Admin login successful!");

      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        navigate("/admin");
      }, 100);
    } catch (error) {
      console.error("Admin login error:", error);
      toast.error(error.response?.data?.message || "Invalid admin credentials");
    } finally {
      setIsLoggingIn(false);
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
          <h1 className="text-6xl font-bold tracking-tight">Admin Access</h1>
          <p className="text-lg font-light opacity-90">Secure portal for system management and oversight.</p>
        </div>
      </div>

      {/* RIGHT PANEL - Form Section - SCROLLABLE */}
      <div className="w-full md:w-1/2 bg-base-100">
        <div className="h-screen overflow-y-auto">
          <div className="flex items-center justify-center p-8 min-h-screen">
            <div className="w-full max-w-md py-6">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <ShieldCheckIcon className="w-14 h-14 text-error" />
                </div>
                <h2 className="text-2xl font-bold text-base-content mb-2">Admin Portal</h2>
                <p className="text-sm text-base-content/60">Secure access to the dashboard</p>
              </div>

              {/* FORM */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* USERNAME INPUT */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text text-base-content/70">Username</span>
                  </label>
                  <label className="input input-bordered flex items-center gap-2 bg-base-200 w-full">
                    <UserIcon className="w-4 h-4 opacity-70" />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="grow"
                      placeholder="Enter admin username"
                      autoComplete="username"
                      required
                    />
                  </label>
                </div>

                {/* PASSWORD INPUT */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text text-base-content/70">Password</span>
                  </label>
                  <label className="input input-bordered flex items-center gap-2 bg-base-200 w-full">
                    <LockIcon className="w-4 h-4 opacity-70" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="grow"
                      placeholder="Enter admin password"
                      autoComplete="current-password"
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

                {/* SUBMIT BUTTON */}
                <button
                  className={`btn btn-error w-full mt-6 ${isLoggingIn ? 'btn-disabled' : ''}`}
                  type="submit"
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    "Admin Sign In"
                  )}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-base-content/60">
                Not an admin? <button onClick={() => navigate('/login')} className="text-primary hover:underline">Go to user sign in</button>
              </div>

              {/* Security Notice */}
              <div className="mt-8 bg-warning/10 border border-warning/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-base-content">Security Notice</h4>
                    <p className="text-xs text-base-content/60">
                      This is a restricted area. All access attempts are logged and monitored.
                    </p>
                  </div>
                </div>
              </div>

              {/* Theme Picker */}
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

export default AdminLoginPageNew;
