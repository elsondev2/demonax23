import { useNavigate } from "react-router";
import { LogIn, UserPlus } from "lucide-react";

export default function AuthChoicePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-base-200 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-base-content mb-2">
            Welcome to PawSpa
          </h1>
          <p className="text-base-content/70">
            Choose how you'd like to proceed
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate("/signin")}
            className="w-full btn btn-primary btn-lg flex items-center justify-center gap-3"
          >
            <LogIn className="w-5 h-5" />
            I have an account - Sign In
          </button>

          <button
            onClick={() => navigate("/signup")}
            className="w-full btn btn-outline btn-lg flex items-center justify-center gap-3"
          >
            <UserPlus className="w-5 h-5" />
            I don't have an account - Sign Up
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-base-content/50">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}