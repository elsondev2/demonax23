import { useState } from "react";
import { X, Shield, CheckCircle } from "lucide-react";
import { Link } from "react-router";
import Avatar from "./Avatar";

function GoogleOAuthConfirmModal({ isOpen, onClose, onConfirm, userInfo }) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleConfirm = () => {
    if (agreedToTerms) {
      onConfirm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-base-100 rounded-2xl shadow-2xl border border-base-300/50 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300/30">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-semibold text-base-content">Confirm Account Creation</h3>
          </div>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div>
              <h4 className="text-lg font-medium text-base-content">Welcome, {userInfo?.name}!</h4>
              <p className="text-sm text-base-content/60">
                We'll create your account using your Google profile information.
              </p>
            </div>
          </div>

          {/* User Info Preview */}
          <div className="bg-base-200/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-3">
              <Avatar
                src={userInfo?.picture}
                name={userInfo?.name}
                alt="Profile"
                size="w-10 h-10"
              />
              <div>
                <p className="font-medium text-base-content">{userInfo?.name}</p>
                <p className="text-sm text-base-content/60">{userInfo?.email}</p>
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
                <Link to="/terms" className="link link-primary" target="_blank">Terms of Service</Link>
                {" "}and{" "}
                <Link to="/privacy" className="link link-primary" target="_blank">Privacy Policy</Link>
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              className={`btn btn-primary flex-1 ${!agreedToTerms ? 'btn-disabled' : ''}`}
              disabled={!agreedToTerms}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoogleOAuthConfirmModal;