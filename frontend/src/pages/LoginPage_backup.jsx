import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import AppLogo from "../components/AppLogo";
import { MailIcon, LockIcon } from "lucide-react";
import { Link } from "react-router";
import GoogleSignIn from "../components/GoogleSignIn";

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    // Updated to use full viewport height and remove padding restrictions
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-base-300">
      {/* Updated container to use min-h-screen for mobile and maintain fixed height for desktop */}
      <div className="relative w-full max-w-6xl min-h-screen md:min-h-[800px] md:h-[800px] h-auto">
        <BorderAnimatedContainer>
<div className="w-full h-full flex flex-col md:flex-row-reverse">
{/* FORM COLUMN - RIGHT (like the reference design) */}
<div className="md:w-1/2 p-8 flex items-center justify-center md:border-l border-slate-600/30 min-h-screen md:min-h-0 h-full overflow-y-auto">
<div className="w-full max-w-md">
                <div className="mb-6 text-sm text-base-content/70">
                  New here? <Link to="/signup" className="link link-hover">Create an account</Link>
                </div>
                <div className="mb-8">
                  <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-base-content">Sign in</h1>
                  <p className="mt-2 text-base-content/70">
                    Use your Google account to continue.
                  </p>
                </div>

                {/* Google only */}
                <div className="space-y-4">
                  <div className="rounded-xl border border-base-300 bg-base-200/40 p-4">
                    <p className="text-sm text-base-content/70 mb-2">Continue with</p>
                    <div className="flex justify-start">
                      <div className="inline-block">
                        {/* Renders Google button */}
                        <div className="mt-1">
                          {/* Lazy import to avoid SSR issues */}
<GoogleSignIn />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-base-content/60">
                    By continuing, you agree to our Terms & Conditions.
                  </div>
                </div>

                <div className="divider my-8 text-base-content/60">or</div>

                {/* Email / Password form using daisyUI */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-control">
                    <label className="label"><span className="label-text">Email</span></label>
                    <label className="input input-bordered flex items-center gap-2">
                      <MailIcon className="w-4 h-4 opacity-70" />
                      <input
                        type="email"
                        className="grow"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e)=>setFormData({...formData, email:e.target.value})}
                        required
                      />
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text">Password</span></label>
                    <label className="input input-bordered flex items-center gap-2">
                      <LockIcon className="w-4 h-4 opacity-70" />
                      <input
                        type="password"
                        className="grow"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e)=>setFormData({...formData, password:e.target.value})}
                        required
                      />
                    </label>
                  </div>

                  <button className={`btn btn-primary w-full ${isLoggingIn ? 'btn-disabled' : ''}`} type="submit" disabled={isLoggingIn}>
                    {isLoggingIn ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center flex items-center justify-between">
                  <Link to="/signup" className="link link-hover">Create account</Link>
                  <Link to="/admin/login" className="link link-hover">Admin</Link>
                </div>
              </div>
            </div>

{/* ILLUSTRATION - LEFT, app logo inside soft card */}
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
export default LoginPage;