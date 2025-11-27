import { useState } from "react";
import { useNavigate } from "react-router";
import { FaArrowLeft, FaCheckCircle, FaMoneyBillWave } from "react-icons/fa";
import { MdContentCopy } from "react-icons/md";
import toast from "react-hot-toast";

const PaymentInstructionsPage = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const phoneNumber = "+255 748 656 698";

  const plans = [
    {
      id: "base",
      name: "Base Plan",
      price: "6,000",
      features: ["Basic messaging", "Group chats", "Voice calls", "Standard support"]
    },
    {
      id: "pro",
      name: "Pro Plan",
      price: "20,000",
      features: ["Everything in Base", "Video calls", "Priority support", "Advanced features", "No ads"]
    },
    {
      id: "premium",
      name: "Premium Plan",
      price: "35,000",
      features: ["Everything in Pro", "Unlimited storage", "Premium support", "Early access to features", "Custom themes"]
    }
  ];

  const paymentMethods = [
    { name: "M-Pesa", icon: "📱" },
    { name: "Tigo Pesa", icon: "💳" },
    { name: "Airtel Money", icon: "💰" },
    { name: "Halopesa", icon: "📲" }
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getVerificationMessage = () => {
    if (!selectedPlan) return "";
    const plan = plans.find(p => p.id === selectedPlan);
    return `Hey there Demonax, I [YOUR NAME] using number [YOUR NUMBER] verify that I have paid for the ${plan.name}.`;
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-base-200">
      {/* Header */}
      <div className="bg-primary text-primary-content p-4 z-10 shadow-lg flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm btn-circle">
            <FaArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Payment Instructions</h1>
            <p className="text-sm opacity-90">Choose your plan and pay</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 space-y-6 pb-safe">
        {/* Important Notice */}
        <div className="alert alert-warning shadow-lg">
          <FaMoneyBillWave size={24} />
          <div>
            <h3 className="font-bold">🎄 Free Trial Extended Until Christmas!</h3>
            <div className="text-sm">Your free access ends on <strong>December 25, 2025</strong>. Subscribe now to continue using Demonax.</div>
          </div>
        </div>

        {/* Christmas Activation Promise */}
        <div className="alert alert-success shadow-lg">
          <div className="text-2xl">🎅</div>
          <div>
            <h3 className="font-bold">Christmas Activation Promise!</h3>
            <div className="text-sm">
              <strong>Don't worry!</strong> For those who pay before Christmas, your accounts will be 
              <strong> automatically activated on Christmas Day (December 25th, 2025)</strong>. 
              We'll verify all payments and activate your subscription as our Christmas gift to you! 🎁
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Choose Your Plan</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`card bg-base-100 shadow-xl cursor-pointer transition-all hover:scale-105 ${
                  selectedPlan === plan.id ? "ring-4 ring-primary" : ""
                }`}
              >
                <div className="card-body">
                  {selectedPlan === plan.id && (
                    <div className="absolute top-2 right-2">
                      <FaCheckCircle className="text-primary" size={24} />
                    </div>
                  )}
                  <h3 className="card-title">{plan.name}</h3>
                  <div className="text-3xl font-bold text-primary">
                    {plan.price} <span className="text-sm">TSh</span>
                  </div>
                  <ul className="space-y-2 mt-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-success">✓</span>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        {selectedPlan && (
          <>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Payment Methods</h2>
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <p className="mb-4">You can pay using any of the following mobile money services:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {paymentMethods.map((method) => (
                      <div key={method.name} className="flex flex-col items-center gap-2 p-4 bg-base-200 rounded-lg">
                        <span className="text-4xl">{method.icon}</span>
                        <span className="font-semibold text-sm text-center">{method.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">How to Pay</h2>
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body space-y-4">
                  <div className="steps steps-vertical lg:steps-horizontal w-full">
                    <div className="step step-primary">Choose Plan</div>
                    <div className="step step-primary">Send Money</div>
                    <div className="step">Verify Payment</div>
                  </div>

                  <div className="divider"></div>

                  <div className="space-y-4">
                    <div className="bg-base-200 p-4 rounded-lg">
                      <h3 className="font-bold mb-2">Step 1: Send Payment</h3>
                      <p className="text-sm mb-3">Send <strong className="text-primary">{plans.find(p => p.id === selectedPlan)?.price} TSh</strong> to:</p>
                      <div className="flex items-center gap-2 bg-base-100 p-3 rounded-lg">
                        <span className="font-mono font-bold flex-1">{phoneNumber}</span>
                        <button
                          onClick={() => copyToClipboard(phoneNumber)}
                          className="btn btn-sm btn-ghost"
                        >
                          <MdContentCopy size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-base-200 p-4 rounded-lg">
                      <h3 className="font-bold mb-2">Step 2: Send Verification Message</h3>
                      <p className="text-sm mb-3">After payment, send this message to the same number:</p>
                      <div className="bg-base-100 p-3 rounded-lg space-y-2">
                        <p className="text-sm font-mono whitespace-pre-wrap">{getVerificationMessage()}</p>
                        <button
                          onClick={() => copyToClipboard(getVerificationMessage())}
                          className="btn btn-sm btn-primary w-full"
                        >
                          <MdContentCopy size={16} />
                          Copy Message Template
                        </button>
                      </div>
                      <div className="alert alert-info mt-3">
                        <span className="text-xs">
                          Replace [YOUR NAME] with your official name and [YOUR NUMBER] with the number you used to send money.
                        </span>
                      </div>
                    </div>

                    <div className="bg-base-200 p-4 rounded-lg">
                      <h3 className="font-bold mb-2">Step 3: Wait for Confirmation</h3>
                      <p className="text-sm">We'll verify your payment and activate your subscription within 24 hours. You'll receive a confirmation message.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Donation */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Support Us (Optional)</h2>
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <p className="text-sm">
                    Want to support Demonax development? You can add a donation to your payment! 
                    Just mention the donation amount in your verification message:
                  </p>
                  <div className="bg-base-200 p-3 rounded-lg mt-2">
                    <p className="text-sm font-mono">
                      "...I have paid for the {plans.find(p => p.id === selectedPlan)?.name} and donated [AMOUNT] TSh."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default PaymentInstructionsPage;
