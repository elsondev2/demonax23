import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ShieldCheckIcon, UserIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowRightIcon, SettingsIcon, DatabaseIcon, UsersIcon } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import AppLogo from "../components/AppLogo";
import toast from "react-hot-toast";

function AdminLoginPageNew() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const { authUser, setAuthUser } = useAuthStore();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (authUser && authUser.role === "admin") {
      navigate("/admin");
    }
  }, [authUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const res = await axiosInstance.post("/api/admin/login", formData);

      // Update auth store with admin user
      setAuthUser(res.data);

      toast.success("Admin login successful!");
      navigate("/admin");
    } catch (error) {
      console.error("Admin login error:", error);
      toast.error(error.response?.data?.message || "Invalid admin credentials");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-300 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center min-h-screen lg:min-h-0 py-8">

        {/* Left Side - Admin Features */}
        <div className="hidden lg:flex flex-col items-center justify-center p-12 space-y-8">
          <div className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-error to-warning rounded-3xl flex items-center justify-center shadow-2xl">
              <AppLogo className="w-20 h-20" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-error">
                Admin Portal
              </h1>
              <p className="text-lg text-base-content/70">
                Secure access to system management
              </p>
            </div>
          </div>

          {/* Admin features */}
          <div className="grid grid-cols-1 gap-4 w-full max-w-md">
            <div className="flex items-center gap-3 p-4 bg-base-200/50 rounded-xl border border-base-300/50">
              <div className="w-10 h-10 bg-error/20 rounded-full flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-base-content">User Management</h3>
                <p className="text-xs text-base-content/60">Manage users and permissions</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-base-200/50 rounded-xl border border-base-300/50">
              <div className="w-10 h-10 bg-info/20 rounded-full flex items-center justify-center">
                <DatabaseIcon className="w-5 h-5 text-info" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-base-content">System Analytics</h3>
                <p className="text-xs text-base-content/60">Monitor system performance</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-base-200/50 rounded-xl border border-base-300/50">
              <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-base-content">Configuration</h3>
                <p className="text-xs text-base-content/60">System settings and controls</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Admin Login Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <div className="bg-base-100 rounded-3xl shadow-2xl border border-base-300/50 p-8 space-y-6 max-h-[90vh] overflow-y-auto scrollbar-hide">

            {/* Header */}
            <div className="text-center space-y-4">
              <div className="lg:hidden w-16 h-16 mx-auto bg-gradient-to-br from-error to-warning rounded-2xl flex items-center justify-center shadow-lg mb-4">
                <AppLogo className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-base-content">Admin Access</h2>
                <p className="text-base-content/60">Secure login to the admin dashboard</p>
              </div>

              {/* Security Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-error/10 border border-error/20 rounded-full">
                <ShieldCheckIcon className="w-4 h-4 text-error" />
                <span className="text-xs text-error font-medium">Secure Access Required</span>
              </div>
            </div>

            {/* Admin Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Admin Username</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="input input-bordered w-full pl-12 focus:input-error transition-all duration-200"
                    placeholder="Enter admin username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    autoComplete="username"
                    required
                  />
                  <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Admin Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input input-bordered w-full pl-12 pr-12 focus:input-error transition-all duration-200"
                    placeholder="Enter admin password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    autoComplete="current-password"
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
                className={`btn btn-error w-full gap-2 ${isLoggingIn ? 'loading' : ''}`}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="w-4 h-4" />
                    Access Admin Panel
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Security Notice */}
            <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
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

            {/* Footer Links */}
            <div className="text-center space-y-4">
              <div className="text-sm text-base-content/60">
                Not an admin?{" "}
                <button
                  onClick={() => navigate('/login')}
                  className="link link-error font-medium"
                >
                  Go to user login
                </button>
              </div>

              <div className="flex justify-center gap-4 text-xs">
                <button 
                  onClick={() => toast.info("To access admin panel, please sign in as admin first")}
                  className="link link-hover text-base-content/50"
                >
                  System Status
                </button>
                <span className="text-base-content/30">•</span>
                <a 
                  href="https://justelson-help.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="link link-hover text-base-content/50"
                >
                  Support
                </a>
              </div>
            </div>

            {/* Terms */}
            <div className="text-xs text-center text-base-content/50 pt-4 border-t border-base-300/30">
              Authorized personnel only. Unauthorized access is prohibited.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPageNew;