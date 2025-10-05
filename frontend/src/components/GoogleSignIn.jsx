import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import GoogleOAuthConfirmModal from "./GoogleOAuthConfirmModal";

// Google Identity Services button wrapper
// Renders the Google button and posts the returned ID token to our backend
export default function GoogleSignIn({ onSuccess, onError, text = "continue_with" }) {
  const btnRef = useRef(null);
  const { loginWithGoogle } = useAuthStore();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCredential, setPendingCredential] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

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

  useEffect(() => {
    // Guard: need a client id
    if (!clientId) {
      console.warn('Google Client ID not found. Please set VITE_GOOGLE_CLIENT_ID in your .env file');
      return;
    }

    let isInitialized = false;

    const load = () => {
      //* global google */
      if (window.google && window.google.accounts && btnRef.current && !isInitialized) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (resp) => {
              try {
                if (loginWithGoogle) {
                  const res = await loginWithGoogle(resp.credential);
                  const claims = decodeJwt(resp.credential);
                  
                  if (res?.success) {
                    onSuccess?.({ ...res, claims, credential: resp.credential });
                  } else if (res?.error?.includes('User not found') || res?.error?.includes('No account')) {
                    // User doesn't exist, show confirmation modal
                    setPendingCredential(resp.credential);
                    setUserInfo(claims);
                    setShowConfirmModal(true);
                  } else {
                    onError?.(res?.error);
                  }
                } else {
                  // Demo mode - just decode the token and call onSuccess
                  const claims = decodeJwt(resp.credential);
                  onSuccess?.({ success: true, claims, credential: resp.credential });
                }
              } catch (e) {
                console.error('Google Sign-In error:', e);
                
                // Check if it's a "user not found" error
                if (e.response?.data?.message?.includes('User not found') || 
                    e.response?.data?.message?.includes('No account')) {
                  const claims = decodeJwt(resp.credential);
                  setPendingCredential(resp.credential);
                  setUserInfo(claims);
                  setShowConfirmModal(true);
                } else {
                  onError?.(e);
                }
              }
            },
            ux_mode: "popup",
            auto_select: false,
            itp_support: true,
            use_fedcm_for_prompt: false,
          });

          window.google.accounts.id.renderButton(btnRef.current, {
            type: "standard",
            theme: "outline",
            text,
            size: "large",
            shape: "rectangular",
            width: 280,
            logo_alignment: "left",
          });

          isInitialized = true;
        } catch (error) {
          console.error('Failed to initialize Google Sign-In:', error);
        }
      }
    };

    // Load script once
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
      // Small delay to ensure DOM is ready
      setTimeout(load, 100);
    }

    return () => {
      isInitialized = false;
    };
  }, [clientId, loginWithGoogle, onSuccess, onError, text]);

  // Show fallback if no client ID
  if (!clientId) {
    return (
      <div className="flex justify-center">
        <div className="btn btn-outline btn-disabled gap-2 w-full max-w-xs">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </div>
        <div className="text-xs text-error mt-2 text-center">
          Google Sign-In not configured
        </div>
      </div>
    );
  }

  const handleConfirmAccount = async () => {
    if (pendingCredential && loginWithGoogle) {
      try {
        // Try to create account with Google credential
        const res = await loginWithGoogle(pendingCredential, true); // Pass true to indicate account creation
        const claims = decodeJwt(pendingCredential);
        
        if (res?.success) {
          onSuccess?.({ ...res, claims, credential: pendingCredential });
        } else {
          onError?.(res?.error);
        }
      } catch (e) {
        console.error('Account creation error:', e);
        onError?.(e);
      }
    }
  };

  return (
    <>
      <div className="flex justify-center">
        <div ref={btnRef} className="w-full max-w-xs" />
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