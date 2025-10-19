import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { AtSignIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon, UserIcon, ArrowRightIcon, ArrowLeftIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import GoogleSignIn from "../components/GoogleSignIn";
import ProfilePicUpload from "../components/ProfilePicUpload";
import ThemeIcons from "../components/ThemeDots";
import AppLogo from "../components/AppLogo";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useThemeStore } from "../store/useThemeStore";

function SignUpPageNew() {
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    profilePic: null
  });
  const [showPassword, setShowPassword] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Step 1 or 2
  const { signup, isSigningUp } = useAuthStore();
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

  const handleImageSelect = (file) => {
    setFormData({ ...formData, profilePic: file });
    try {
      setPreviewUrl(URL.createObjectURL(file));
    } catch (error) {
      console.error('Error creating preview URL:', error);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isStep1Valid = () => {
    return (
      formData.fullName.trim().length >= 3 &&
      validateEmail(formData.email) &&
      formData.password.length >= 6
    );
  };

  const handleContinue = async () => {
    if (!isStep1Valid()) return;

    try {
      // Check if user already exists
      const response = await axiosInstance.post('/api/auth/check-user', {
        email: formData.email.trim()
      });

      if (response.data.exists) {
        toast.error('An account with this email already exists. Redirecting to login...');
        setTimeout(() => {
          navigate('/login', {
            state: { email: formData.email.trim() }
          });
        }, 1500);
      } else {
        setCurrentStep(2);
      }
    } catch (error) {
      console.error('Error checking user existence:', error);
      // If check fails, proceed to step 2 anyway
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreedToTerms) {
      console.error('You must agree to the terms and conditions');
      return;
    }

    // Create FormData for file upload
    const submitData = new FormData();
    submitData.append('fullName', formData.fullName.trim());
    submitData.append('username', formData.username.trim());
    submitData.append('email', formData.email.trim());
    submitData.append('password', formData.password);

    if (formData.profilePic) {
      submitData.append('profilePic', formData.profilePic);
    }

    const result = await signup(submitData);

    if (result?.success) {
      // Verification disabled - go directly to chat
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
          <h1 className="text-6xl font-bold tracking-tight">Welcome</h1>
          <p className="text-lg font-light opacity-90">Join our community and start connecting with friends.</p>
        </div>
      </div>

      {/* RIGHT PANEL - Form Section - SCROLLABLE */}
      <div className="w-full md:w-1/2 bg-base-100">
        <div className="h-screen overflow-y-auto">
          <div className="flex items-center justify-center p-8 min-h-screen">
            <div className="w-full max-w-md py-6">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  <UserIcon className="w-14 h-14 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-base-content mb-2">Create Account</h2>
                <p className="text-sm text-base-content/60">
                  {currentStep === 1 ? "Let's get started with your basic info" : "Complete your profile setup"}
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="flex items-center justify-center mb-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${currentStep >= 1 ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/50'
                  }`}>
                  1
                </div>
                <div className={`h-1 w-16 mx-2 transition-all ${currentStep >= 2 ? 'bg-primary' : 'bg-base-300'
                  }`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${currentStep >= 2 ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/50'
                  }`}>
                  2
                </div>
              </div>

              {/* STEP 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-base-content/70">Full Name</span>
                    </label>
                    <label className="input input-bordered flex items-center gap-2 bg-base-200 w-full">
                      <UserIcon className="w-4 h-4 opacity-70" />
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        className="grow"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </label>
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-base-content/70">Email Address</span>
                    </label>
                    <label className="input input-bordered flex items-center gap-2 bg-base-200 w-full">
                      <MailIcon className="w-4 h-4 opacity-70" />
                      <input
                        type="email"
                        placeholder="Enter your email"
                        className="grow"
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
                        placeholder="Create a strong password"
                        className="grow"
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
                    className="btn btn-primary w-full mt-6"
                    onClick={handleContinue}
                    disabled={!isStep1Valid()}
                  >
                    Continue
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </button>

                  {!isStep1Valid() && (formData.fullName || formData.email || formData.password) && (
                    <div className="text-xs text-error mt-2 space-y-1">
                      {formData.fullName && formData.fullName.trim().length < 3 && (
                        <p>• Name must be at least 3 characters</p>
                      )}
                      {formData.email && !validateEmail(formData.email) && (
                        <p>• Please enter a valid email address</p>
                      )}
                      {formData.password && formData.password.length < 6 && (
                        <p>• Password must be at least 6 characters</p>
                      )}
                    </div>
                  )}

                  <div className="divider text-base-content/60 text-sm my-8">or sign up with</div>

                  {/* Google Sign In - Centered */}
                  <div className="flex justify-center w-full">
                    <div className="w-full max-w-sm">
                      <GoogleSignIn text="signup_with" onSuccess={(info) => {
                        try {
                          const claims = info?.claims || {};
                          setFormData(prev => ({
                            ...prev,
                            fullName: claims.name || prev.fullName,
                            email: claims.email || prev.email,
                          }));
                          if (claims.picture && !formData.profilePic) {
                            setPreviewUrl(claims.picture);
                          }
                        } catch { /* empty */ }
                        navigate("/chat");
                      }} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Profile Setup */}
              {currentStep === 2 && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-base-content/70">Username</span>
                    </label>
                    <label className="input input-bordered flex items-center gap-2 bg-base-200 w-full">
                      <AtSignIcon className="w-4 h-4 opacity-70" />
                      <input
                        type="text"
                        className="grow"
                        placeholder="Choose a unique username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                      />
                    </label>
                  </div>

                  {/* Profile Photo Upload */}
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-base-content/70">Profile Picture (Optional)</span>
                    </label>
                    <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-base-300 rounded-lg">
                      <ProfilePicUpload onImageSelect={handleImageSelect} selectedImage={previewUrl} />
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => document.querySelector('input[type="file"]')?.click()}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Choose Photo
                      </button>
                      <p className="text-xs text-base-content/60 text-center">
                        Upload a profile picture or we'll create one with your initials
                      </p>
                    </div>
                  </div>

                  {/* Terms Checkbox */}
                  <div className="form-control w-full">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm flex-shrink-0"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        required
                      />
                      <span className="label-text text-xs text-base-content/60">
                        I agree to the <Link to="/eula" className="text-primary">EULA</Link>, <Link to="/terms" className="text-primary">Terms of Service</Link> and <Link to="/privacy" className="text-primary">Privacy Policy</Link>
                      </span>
                    </label>
                  </div>

                  {/* Coming Soon Notice */}
                  <div className="bg-info/10 border border-info/30 rounded-lg p-3 mt-4">
                    <p className="text-xs text-base-content/70 text-center">
                      🚀 Email verification coming soon! For now, you can start using your account immediately.
                    </p>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      className="btn btn-outline flex-1"
                      onClick={handleBack}
                    >
                      <ArrowLeftIcon className="w-4 h-4 mr-2" />
                      Back
                    </button>
                    <button
                      type="submit"
                      className={`btn btn-primary flex-1 ${isSigningUp ? 'btn-disabled' : ''}`}
                      disabled={isSigningUp || !formData.username || !agreedToTerms}
                    >
                      {isSigningUp ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        <>
                          Create Account
                          <ArrowRightIcon className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-8 text-center text-sm text-base-content/60">
                Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in here</Link>
              </div>

              <div className="mt-4 text-center">
                <Link to="/admin/login" className="text-xs text-base-content/40 hover:text-base-content/60">Admin Login</Link>
              </div>

              {/* Theme Picker - Below Footer */}
              <div className="mt-8 pt-6 border-t border-base-300">
                <ThemeIcons />
              </div>

              {/* Terms Footer */}
              <div className="mt-6 text-xs text-center text-base-content/50">
                By creating an account, you agree to our <Link to="/eula" className="link link-hover">EULA</Link>, <Link to="/terms" className="link link-hover">Terms of Service</Link> and <Link to="/privacy" className="link link-hover">Privacy Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPageNew;
