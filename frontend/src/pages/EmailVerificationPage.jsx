import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react';
import OTPInput from '../components/OTPInput';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userData = location.state?.userData;

  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Redirect if no user data
  useEffect(() => {
    if (!userData || !userData._id) {
      toast.error('Please sign up first');
      navigate('/signup');
    }
  }, [userData, navigate]);

  // OTP is already sent by backend during signup
  // No need to send again on mount

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const sendOTP = async () => {
    if (!userData?._id) return;

    setIsSending(true);
    try {
      await axiosInstance.post('/api/auth/send-otp', {
        userId: userData._id,
      });

      toast.success('Verification code sent to your email');
      setTimeLeft(600); // Reset timer
      setCanResend(false);
      setResendCooldown(60); // 1 minute cooldown
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send code');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async (code) => {
    setIsVerifying(true);
    try {
      const response = await axiosInstance.post('/api/auth/verify-otp', {
        userId: userData._id,
        code,
      });

      toast.success('Email verified successfully!');
      
      // Store token and user data
      if (response.data.token) {
        localStorage.setItem('jwt-token', response.data.token);
      }
      localStorage.setItem('chat-user', JSON.stringify(response.data.user));

      // Redirect to chat
      setTimeout(() => {
        navigate('/chat', { replace: true });
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid code');
      setIsVerifying(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!userData) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate('/signup')}
          className="btn btn-ghost btn-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Signup
        </button>

        {/* Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-10 h-10 text-primary" />
              </div>
            </div>

            {/* Title */}
            <h2 className="card-title text-2xl font-bold text-center justify-center mb-2">
              Verify Your Email
            </h2>

            {/* Description */}
            <p className="text-center text-base-content/70 mb-6">
              We sent a verification code to
              <br />
              <span className="font-semibold text-base-content">
                {userData.email}
              </span>
            </p>

            {/* OTP Input */}
            <div className="mb-6">
              <OTPInput
                length={6}
                onComplete={handleVerify}
                disabled={isVerifying || timeLeft === 0}
              />
            </div>

            {/* Timer */}
            {timeLeft > 0 ? (
              <div className="text-center text-sm text-base-content/60 mb-4">
                Code expires in{' '}
                <span className="font-semibold text-primary">
                  {formatTime(timeLeft)}
                </span>
              </div>
            ) : (
              <div className="text-center text-sm text-error mb-4">
                Code expired. Please request a new one.
              </div>
            )}

            {/* Resend button */}
            <div className="text-center">
              <p className="text-sm text-base-content/70 mb-2">
                Didn't receive the code?
              </p>
              <button
                onClick={sendOTP}
                disabled={!canResend || isSending}
                className="btn btn-ghost btn-sm gap-2"
              >
                {isSending ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    {canResend
                      ? 'Resend Code'
                      : `Resend in ${resendCooldown}s`}
                  </>
                )}
              </button>
            </div>

            {/* Verifying state */}
            {isVerifying && (
              <div className="alert alert-info mt-4">
                <span className="loading loading-spinner loading-sm"></span>
                <span>Verifying your code...</span>
              </div>
            )}
          </div>
        </div>

        {/* Help text */}
        <div className="text-center mt-4 text-sm text-base-content/60">
          <p>
            Check your spam folder if you don't see the email.
            <br />
            Need help? Contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
