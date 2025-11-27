import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import GoogleOAuthConfirmModal from "./GoogleOAuthConfirmModal";

// Google Icon SVG Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// Decode a JWT (base64url) to JSON
const decodeJwt = (token) => {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

// Google Identity Services button wrapper
// Renders a custom styled Google button that triggers Google's authentication
export default function GoogleSignIn({ onSuccess, onError, text = "continue_with" }) {
  const btnRef = useRef(null);
  const callbackRef = useRef(null);
  const { loginWithGoogle } = useAuthStore();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCredential, setPendingCredential] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get button text based on prop
  const getButtonText = () => {
    switch (text) {
      case "signup_with":
        return "Sign up with Google";
      case "signin_with":
        return "Sign in with Google";
      case "continue_with":
      default:
        return "Continue with Google";
    }
  };

  // Store callback in ref to avoid re-initialization
  callbackRef.current = useCallback(async (resp) => {
    setIsLoading(true);
    try {
      if (loginWithGoogle) {
        const res = await loginWithGoogle(resp.credential);
        const claims = decodeJwt(resp.credential);
        
        if (res?.success) {
          onSuccess?.({ ...res, claims, credential: resp.credential });
        } else if (res?.error?.includes('User not found') || res?.error?.includes('No account')) {
          setPendingCredential(resp.credential);
          setUserInfo(claims);
          setShowConfirmModal(true);
        } else {
          onError?.(res?.error);
        }
      } else {
        const claims = decodeJwt(resp.credential);
        onSuccess?.({ success: true, claims, credential: resp.credential });
      }
    } catch (e) {
      console.error('Google Sign-In error:', e);
      
      if (e.response?.data?.message?.includes('User not found') || 
          e.response?.data?.message?.includes('No account')) {
        const claims = decodeJwt(resp.credential);
        setPendingCredential(resp.credential);
        setUserInfo(claims);
        setShowConfirmModal(true);
      } else {
        onError?.(e);
      }
    } finally {
      setIsLoading(false);
    }
  }, [loginWithGoogle, onSuccess, onError]);

  useEffect(() => {
    if (!clientId) {
      console.warn('Google Client ID not found. Please set VITE_GOOGLE_CLIENT_ID in your .env file');
      return;
    }

    let initialized = false;

    const load = () => {
      if (window.google && window.google.accounts && !initialized) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (resp) => callbackRef.current?.(resp),
            ux_mode: "popup",
            auto_select: false,
            itp_support: true,
            use_fedcm_for_prompt: false,
          });
          initialized = true;
          setIsInitialized(true);
        } catch (error) {
          console.error('Failed to initialize Google Sign-In:', error);
        }
      }
    };

    if (!document.getElementById("google-identity-services")) {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.id = "google-identity-services";
      s.onload = load;
      s.onerror = () => console.error('Failed to load Google Identity Services script');
      document.head.appendChild(s);
    } else {
      setTimeout(load, 100);
    }
  }, [clientId]);

  // Handle custom button click - trigger Google prompt
  const handleGoogleClick = () => {
    if (window.google && window.google.accounts && isInitialized) {
      window.google.accounts.id.prompt();
    }
  };

  // Show fallback if no client ID
  if (!clientId) {
    return (
      <div className="w-full">
        <button className="btn w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 gap-3 font-medium shadow-sm" disabled>
          <GoogleIcon />
          {getButtonText()}
        </button>
        <div className="text-xs text-error mt-2 text-center">
          Google Sign-In not configured
        </div>
      </div>
    );
  }

  const handleConfirmAccount = async () => {
    if (pendingCredential && loginWithGoogle) {
      setIsLoading(true);
      try {
        const res = await loginWithGoogle(pendingCredential, true);
        const claims = decodeJwt(pendingCredential);
        
        if (res?.success) {
          onSuccess?.({ ...res, claims, credential: pendingCredential });
        } else {
          onError?.(res?.error);
        }
      } catch (e) {
        console.error('Account creation error:', e);
        onError?.(e);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      <div className="w-full">
        <button
          ref={btnRef}
          onClick={handleGoogleClick}
          disabled={isLoading || !isInitialized}
          className="btn w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 gap-3 font-medium shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <GoogleIcon />
          )}
          {isLoading ? "Signing in..." : getButtonText()}
        </button>
      </div>
      
      <GoogleOAuthConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingCredential(null);
          setUserInfo(null);
        }}
        onConfirm={handleConfirmAccount}
        userInfo={userInfo}
      />
    </>
  );
}