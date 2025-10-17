import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { UserIcon, AtSignIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowRightIcon, CameraIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import GoogleSignIn from "../components/GoogleSignIn";
import Avatar from "../components/Avatar";
import AppLogo from "../components/AppLogo";
import QuickThemeToggle from "../components/QuickThemeToggle";
import ThemeIcons from "../components/ThemeDots";

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
  const [currentStep, setCurrentStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { signup, isSigningUp } = useAuthStore();
  const navigate = useNavigate();

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormData({ ...formData, profilePic: file });
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.fullName.trim()) {
      console.error('Full name is required');
      return;
    }
    if (!formData.username.trim()) {
      console.error('Username is required');
      return;
    }
    if (!formData.email.trim()) {
      console.error('Email is required');
      return;
    }
    if (!formData.password.trim()) {
      console.error('Password is required');
      return;
    }
    if (!agreedToTerms) {
      console.error('You must agree to the terms and conditions');
      return;
    }

    console.log('Submitting signup data:', {
      fullName: formData.fullName,
      username: formData.username,
      email: formData.email,
      hasProfilePic: !!formData.profilePic
    });

    // Try both FormData and JSON approaches
    let result;
    if (formData.profilePic) {
      // Use FormData for file upload
      const submitData = new FormData();
      submitData.append('fullName', formData.fullName.trim());
      submitData.append('username', formData.username.trim());
      submitData.append('email', formData.email.trim());
      submitData.append('password', formData.password);
      submitData.append('profilePic', formData.profilePic);

      console.log('Using FormData with file upload');
      result = await signup(submitData);
      console.log('Signup result:', result);
    } else {
      // Use JSON for no file upload
      const submitData = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password
      };

      console.log('Using JSON without file upload');
      result = await signup(submitData);
      console.log('Signup result:', result);
    }

    if (result?.success) {
      // Check if verification is required
      if (result.requiresVerification) {
        navigate('/verify-email', {
          state: { userData: result.userData },
          replace: true
        });
      } else {
        // Already verified (e.g., Google OAuth)
        navigate("/chat");
      }
    }
  };

  const nextStep = () => {
    if (currentStep < 2) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const isStep1Valid = formData.fullName && formData.email && formData.password;

  return (
    <div className="min-h-screen bg-base-300 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center min-h-screen lg:min-h-0 py-8">

        {/* Left Side - Branding & Progress */}
        <div className="hidden lg:flex flex-col items-center justify-center p-12 space-y-8">
          <div className="text-center space-y-6">
            <div className="w-32 h-32 mx-auto">
              <AppLogo className="w-32 h-32" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-primary">
                Join Our Community
              </h1>
              <p className="text-lg text-base-content/70">
                Create your account and start connecting
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="w-full max-w-md space-y-4">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${currentStep >= 1 ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/50'
                }`}>
                1
              </div>
              <div className={`h-1 w-16 transition-all ${currentStep >= 2 ? 'bg-primary' : 'bg-base-300'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${currentStep >= 2 ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/50'
                }`}>
                2
              </div>
            </div>

            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${currentStep === 1
                ? 'bg-primary/10 border-primary/30'
                : 'bg-base-200/50 border-base-300'
                }`}>
                <UserIcon className={`w-6 h-6 ${currentStep === 1 ? 'text-primary' : 'text-base-content/40'}`} />
                <div className="text-left">
                  <h3 className="font-semibold text-base-content">Basic Information</h3>
                  <p className="text-sm text-base-content/60">Name, email, and password</p>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${currentStep === 2
                ? 'bg-primary/10 border-primary/30'
                : 'bg-base-200/50 border-base-300'
                }`}>
                <CameraIcon className={`w-6 h-6 ${currentStep === 2 ? 'text-primary' : 'text-base-content/40'}`} />
                <div className="text-left">
                  <h3 className="font-semibold text-base-content">Profile Setup</h3>
                  <p className="text-sm text-base-content/60">Username and profile picture</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Sign Up Form */}
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
              <h2 className="text-3xl font-bold text-base-content">Create Account</h2>
              <p className="text-base-content/60">
                {currentStep === 1 ? "Let's get started with your basic info" : "Complete your profile setup"}
              </p>
            </div>

            {/* Mobile Progress */}
            <div className="lg:hidden flex items-center justify-center space-x-4 mb-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/50'
                }`}>
                1
              </div>
              <div className={`h-1 w-12 ${currentStep >= 2 ? 'bg-primary' : 'bg-base-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/50'
                }`}>
                2
              </div>
            </div>

            {currentStep === 1 && (
              <>
                {/* Step 1 Form */}
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Full Name</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="input input-bordered w-full pl-12 focus:input-primary transition-all duration-200"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                      <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
                    </div>
                  </div>

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
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                        placeholder="Create a strong password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                    type="button"
                    onClick={nextStep}
                    className={`btn btn-primary w-full gap-2 ${!isStep1Valid ? 'btn-disabled' : ''}`}
                    disabled={!isStep1Valid}
                  >
                    Continue
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="divider text-base-content/50">or sign up with</div>

                {/* Google Sign In */}
                <div className="space-y-4">
                  <div className="p-4 bg-base-200/30 rounded-2xl border border-base-300/30">
                    <div className="flex justify-center">
                      <GoogleSignIn text="signup_with" onSuccess={(info) => {
                        // Pre-fill from Google token claims if available
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
                        // Navigate to chat after successful Google sign up
                        navigate("/chat");
                      }} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                {/* Step 2 Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Username</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="input input-bordered w-full pl-12 focus:input-primary transition-all duration-200"
                        placeholder="Choose a unique username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                      />
                      <AtSignIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Profile Picture (Optional)</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <Avatar
                        src={previewUrl}
                        name={formData.fullName}
                        size="w-20 h-20"
                        textSize="text-xl"
                        className="ring-2 ring-base-300"
                      />
                      <div className="flex-1">
                        <label className="btn btn-outline btn-sm gap-2 cursor-pointer">
                          <CameraIcon className="w-4 h-4" />
                          Choose Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageSelect}
                          />
                        </label>
                        <p className="text-xs text-base-content/60 mt-2">
                          Upload a profile picture or we'll create one with your initials
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Terms Agreement */}
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                      />
                      <span className="label-text text-sm">
                        I agree to the{" "}
                        <Link to="/eula" className="link link-primary">EULA</Link>
                        {", "}
                        <Link to="/terms" className="link link-primary">Terms of Service</Link>
                        {" "}and{" "}
                        <Link to="/privacy" className="link link-primary">Privacy Policy</Link>
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="btn btn-outline flex-1"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className={`btn btn-primary flex-1 gap-2 ${isSigningUp ? 'loading' : ''}`}
                      disabled={isSigningUp || !formData.username || !agreedToTerms}
                    >
                      {isSigningUp ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Creating...
                        </>
                      ) : (
                        <>
                          Create Account
                          <ArrowRightIcon className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Footer Links */}
            <div className="text-center space-y-4">
              <div className="text-sm text-base-content/60">
                Already have an account?{" "}
                <Link to="/login" className="link link-primary font-medium">
                  Sign in here
                </Link>
              </div>

              <div className="flex justify-center gap-4 text-xs">
                <Link to="/admin/login" className="link link-hover text-base-content/50">
                  Admin Login
                </Link>
              </div>
            </div>

            {/* Theme Dots */}
            <div className="pt-4 border-t border-base-300/30">
              <ThemeIcons />
            </div>

            {/* Terms */}
            <div className="text-xs text-center text-base-content/50 pt-3">
              By creating an account, you agree to our{" "}
              <Link to="/eula" className="link link-hover">EULA</Link>,{" "}
              <Link to="/terms" className="link link-hover">Terms of Service</Link> and{" "}
              <Link to="/privacy" className="link link-hover">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPageNew;