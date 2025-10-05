import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfilePicUpload from "../components/ProfilePicUpload";
import AppLogo from "../components/AppLogo";
import { AtSignIcon } from "lucide-react";
import { Link } from "react-router";
import GoogleSignIn from "../components/GoogleSignIn";

function SignUpPage() {
  const [formData, setFormData] = useState({ 
    fullName: "", 
    username: "", 
    email: "", 
    password: "",
    profilePic: null 
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const { signup, isSigningUp, updateProfile } = useAuthStore();

  const handleImageSelect = (file) => {
    setFormData({ ...formData, profilePic: file });
    try { setPreviewUrl(URL.createObjectURL(file)); } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create FormData for file upload
    const submitData = new FormData();
    submitData.append('fullName', formData.fullName);
    submitData.append('username', formData.username);
    submitData.append('email', formData.email);
    submitData.append('password', formData.password);
    
    if (formData.profilePic) {
      submitData.append('profilePic', formData.profilePic);
    }
    
    signup(submitData);
  };

  return (
    // Updated to use full viewport height and remove padding restrictions
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-base-300">
      {/* Updated container to use min-h-screen for mobile and maintain fixed height for desktop */}
      <div className="relative w-full max-w-6xl min-h-screen md:min-h-[800px] md:h-[800px] h-auto">
        <BorderAnimatedContainer>
<div className="w-full h-full flex flex-col md:flex-row-reverse">
{/* FORM COLUMN - RIGHT (Google only) */}
<div className="md:w-1/2 p-8 flex items-center justify-center md:border-l border-slate-600/30 min-h-screen md:min-h-0 h-full overflow-y-auto">
<div className="w-full max-w-md">
                <div className="mb-6 text-sm text-base-content/70">
                  Already have an account? <Link to="/login" className="link link-hover">Log in</Link>
                </div>
                <div className="mb-8">
                  <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-base-content">Create an account</h1>
                  <p className="mt-2 text-base-content/70">Use Google to import your name and email. Then pick a username and photo.</p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-base-300 bg-base-200/40 p-4">
                    <p className="text-sm text-base-content/70 mb-2">Continue with</p>
                    <div className="flex flex-col gap-3">
                      <div className="inline-block">
                        <GoogleSignIn text="signup_with" onSuccess={(info)=>{
                          // Pre-fill from Google token claims if available
                          try{
                            const claims = info?.claims || {};
                            setFormData(prev=>({
                              ...prev,
                              fullName: claims.name || prev.fullName,
                              email: claims.email || prev.email,
                            }));
                            if (claims.picture && !formData.profilePic) {
                              setPreviewUrl(claims.picture);
                            }
                          }catch{}
                        }} />
                      </div>
                      {/* Summary */}
                      {(formData.fullName || formData.email) && (
                        <div className="text-xs rounded-lg bg-base-200/60 p-3">
                          <div className="text-base-content/80">Imported from Google</div>
                          <div className="mt-1 text-base-content/70">{formData.fullName} • {formData.email}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-base-content/60">
                    By continuing, you agree to our Terms & Conditions.
                  </div>
                </div>

                <div className="divider my-8 text-base-content/60">or</div>

                {/* Step 2: Pick username and photo only */}
                <form onSubmit={async (e)=>{
                  e.preventDefault();
                  // Finish profile after Google sign-in
                  const updates = { fullName: formData.fullName, username: formData.username };
                  // If user picked a new photo, convert to base64
                  if (formData.profilePic) {
                    const reader = new FileReader();
                    reader.readAsDataURL(formData.profilePic);
                    await new Promise(res=> reader.onloadend = res);
                    updates.profilePic = reader.result;
                  } else if (previewUrl && previewUrl.startsWith('http')) {
                    // Try to fetch Google picture, ignore errors
                    try {
                      const r = await fetch(previewUrl);
                      const b = await r.blob();
                      const fr = new FileReader(); fr.readAsDataURL(b);
                      await new Promise(res => fr.onloadend = res);
                      updates.profilePic = fr.result;
                    } catch { /* empty */ }
                  }
                  await updateProfile(updates);
                }} className="space-y-4">
                  {/* Readonly imported fields */}
                  <div className="form-control">
                    <label className="label"><span className="label-text">Name</span></label>
                    <input className="input input-bordered" value={formData.fullName} readOnly disabled={!formData.fullName} placeholder="Imported from Google" />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Email</span></label>
                    <input className="input input-bordered" value={formData.email} readOnly disabled={!formData.email} placeholder="Imported from Google" />
                  </div>

                  {/* Username only editable field */}
                  <div className="form-control">
                    <label className="label"><span className="label-text">Username</span></label>
                    <label className="input input-bordered flex items-center gap-2">
                      <AtSignIcon className="w-4 h-4 opacity-70" />
                      <input
                        type="text"
                        className="grow"
                        placeholder="janedoe"
                        value={formData.username}
                        onChange={(e)=>setFormData({...formData, username:e.target.value})}
                        required
                      />
                    </label>
                  </div>

                  {/* Optional photo override */}
                  <div className="form-control">
                    <label className="label"><span className="label-text">Profile photo (optional)</span></label>
                    <div className="flex items-center gap-4">
                      <ProfilePicUpload onImageSelect={handleImageSelect} selectedImage={previewUrl} />
                    </div>
                  </div>

                  <button className={`btn btn-primary w-full ${isSigningUp ? 'btn-disabled' : ''}`} type="submit" disabled={isSigningUp || !formData.username}>
                    {isSigningUp ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      "Finish"
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center flex items-center justify-between">
                  <Link to="/login" className="link link-hover">Already have an account? Sign in</Link>
                  <Link to="/admin/login" className="link link-hover">Admin</Link>
                </div>
              </div>
            </div>

{/* ILLUSTRATION - LEFT card (AppLogo) */}
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
export default SignUpPage;