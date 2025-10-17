import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import AppLogo from "../components/AppLogo";
import { ShieldCheckIcon, UserIcon, LockIcon, LoaderIcon } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

function AdminLoginPage() {
  const [formData, setFormData] = useState({ username: "", password: "" });
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
      
      // Store token in localStorage for Authorization header
      if (res.data.token) {
        localStorage.setItem("jwt-token", res.data.token);
      }
      
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
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-base-300">
      <div className="relative w-full max-w-6xl min-h-screen md:min-h-[800px] md:h-[800px] h-auto">
        <BorderAnimatedContainer>
          <div className="w-full h-full flex flex-col md:flex-row-reverse">
            {/* FORM COLUMN - RIGHT (refined typography) */}
            <div className="md:w-1/2 p-8 flex items-center justify-center md:border-l border-slate-600/30 min-h-screen md:min-h-0 h-full overflow-y-auto">
              <div className="w-full max-w-md">
                <div className="mb-6 text-sm text-base-content/70">
                  Not an admin? <button onClick={() => navigate('/login')} className="link link-hover">Go to user sign in</button>
                </div>
                {/* HEADING TEXT */}
                <div className="mb-8">
                  <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-base-content mb-2">Admin portal</h2>
                  <p className="text-base-content/70">Secure access to the dashboard</p>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* USERNAME INPUT */}
<div className="form-control">
                    <label className="label"><span className="label-text">Username</span></label>
                    <label className="input input-bordered flex items-center gap-2">
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
<div className="form-control">
                    <label className="label"><span className="label-text">Password</span></label>
                    <label className="input input-bordered flex items-center gap-2">
                      <LockIcon className="w-4 h-4 opacity-70" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="grow"
                        placeholder="Enter admin password"
                        autoComplete="current-password"
                        required
                      />
                    </label>
                  </div>

                  {/* SUBMIT BUTTON */}
<button className={`btn btn-primary w-full ${isLoggingIn ? 'btn-disabled' : ''}`} type="submit" disabled={isLoggingIn}>
                    {isLoggingIn ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      "Admin Sign In"
                    )}
                  </button>
                </form>
              </div>
            </div>

{/* ILLUSTRATION - LEFT with AppLogo */}
            <div className="hidden md:w-1/2 md:flex items-center justify-center p-10">
              <div className="w-full h-full rounded-3xl border border-base-300/60 bg-base-200/40 flex items-center justify-center">
                <AppLogo className="w-48 h-48 md:w-56 md:h-56 opacity-90" />
              </div>
            </div>
          </div>
        </BorderAnimatedContainer>
      </div>
    </div>
  );
}

export default AdminLoginPage;
