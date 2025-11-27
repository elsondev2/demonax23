import { useNavigate } from "react-router";
import { FaLock, FaMoneyBillWave } from "react-icons/fa";
import { useAuthStore } from "../store/useAuthStore";

const PaymentBlockScreen = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-200 p-4 overflow-y-auto">
      <div className="max-w-md w-full my-auto">
        <div className="bg-base-100 rounded-lg shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-error text-error-content p-6 text-center">
            <FaLock size={64} className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Subscription Required</h1>
          </div>

          {/* Content - Scrollable */}
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="alert alert-error">
              <FaMoneyBillWave size={24} />
              <div>
                <h3 className="font-bold">Free Trial Ended</h3>
                <div className="text-sm">Your free access ended on December 25, 2025</div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-lg">
                To continue using <strong>Demonax</strong> as a Monarc, please subscribe to one of our plans.
              </p>
              <p className="text-sm opacity-70">
                Choose from Base (6,000 TSh), Pro (20,000 TSh), or Premium (35,000 TSh) plans.
              </p>
            </div>

            <div className="divider">What you're missing</div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                <span className="text-2xl">💬</span>
                <div>
                  <div className="font-semibold">Unlimited Messaging</div>
                  <div className="text-xs opacity-70">Chat with friends and groups</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                <span className="text-2xl">📞</span>
                <div>
                  <div className="font-semibold">Voice & Video Calls</div>
                  <div className="text-xs opacity-70">Crystal clear communication</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                <span className="text-2xl">🎮</span>
                <div>
                  <div className="font-semibold">Games & Features</div>
                  <div className="text-xs opacity-70">Access all premium features</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <button
                onClick={() => navigate("/payment-instructions")}
                className="btn btn-primary btn-lg w-full"
              >
                <FaMoneyBillWave size={20} />
                Subscribe Now
              </button>
              <button
                onClick={handleLogout}
                className="btn btn-ghost w-full"
              >
                Logout
              </button>
            </div>

            <p className="text-xs text-center opacity-70 pt-2">
              Need help? Contact support through our payment number
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentBlockScreen;
