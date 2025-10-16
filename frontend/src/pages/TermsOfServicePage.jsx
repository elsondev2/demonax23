import { Link } from "react-router";
import { ArrowLeft, Shield, AlertTriangle, Users, MessageCircle } from "lucide-react";
import AppLogo from "../components/AppLogo";

function TermsOfServicePage() {
  return (
    <div className="w-full h-screen bg-base-300 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-base-100 to-base-200 border-b-2 border-primary/20 flex-shrink-0 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 md:py-8">
          {/* Mobile Layout */}
          <div className="flex flex-col gap-4 md:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-base-200 rounded-lg flex items-center justify-center shadow-md">
                  <AppLogo className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Terms of Service
                  </h1>
                  <p className="text-xs text-base-content/60">Legal terms and conditions</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-md border border-primary/20">
                <Shield className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-primary">Legal</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/login" className="btn btn-outline btn-primary btn-sm gap-2 flex-1">
                <ArrowLeft className="w-3 h-3" />
                Login
              </Link>
              <Link to="/signup" className="btn btn-outline btn-secondary btn-sm gap-2 flex-1">
                <ArrowLeft className="w-3 h-3" />
                Sign Up
              </Link>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-base-200 rounded-xl flex items-center justify-center shadow-lg">
                <AppLogo className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Terms of Service
                </h1>
                <p className="text-sm text-base-content/60 mt-1">Legal terms and conditions</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/login" className="btn btn-outline btn-primary btn-sm gap-2 hover:scale-105 transition-transform">
                <ArrowLeft className="w-3 h-3" />
                Back to Login
              </Link>
              <Link to="/signup" className="btn btn-outline btn-secondary btn-sm gap-2 hover:scale-105 transition-transform">
                <ArrowLeft className="w-3 h-3" />
                Back to Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-base-100 rounded-none shadow-2xl border-2 border-base-300/30 p-8 md:p-10 lg:p-12">

            {/* Last Updated */}
            <div className="mb-8 pb-6 border-b border-base-300/30">
              <p className="text-sm text-base-content/60 mb-4">
                <strong>Last Updated:</strong> January 2025
              </p>
              <p className="text-base leading-relaxed text-base-content/80">
                Welcome to de_monax. These Terms of Service govern your use of our chat application and messaging services. By accessing or using our services, you agree to be bound by these Terms.
              </p>
            </div>

            <div className="space-y-8">
              {/* Acceptance */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold text-base-content">1. Acceptance of Terms</h2>
                </div>
                <p className="text-base leading-relaxed text-base-content/80 mb-4">
                  By creating an account or using de_monax messaging services, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, please do not use our services.
                </p>
              </section>

              {/* Disclaimer of Responsibility */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                  <h2 className="text-2xl font-bold text-base-content">2. Disclaimer of Responsibility</h2>
                </div>
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-6 mb-4">
                  <p className="text-base leading-relaxed text-base-content font-semibold mb-4">
                    <strong>IMPORTANT: WE ARE NOT RESPONSIBLE FOR ANY CRIMES, MISTAKES, OR HARMFUL RESULTS</strong>
                  </p>
                  <p className="text-base leading-relaxed text-base-content/80 mb-4">
                    de_monax and its operators shall not be held responsible for any:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-base-content/80">
                    <li><strong>Criminal Activities:</strong> Illegal content sharing, harassment, threats, fraud, identity theft, or any criminal behavior conducted through our platform</li>
                    <li><strong>Harmful Content:</strong> Hate speech, cyberbullying, doxxing, revenge sharing, or distribution of harmful materials</li>
                    <li><strong>Financial Losses:</strong> Scams, fraudulent transactions, investment schemes, or any financial damages resulting from user interactions</li>
                    <li><strong>Privacy Violations:</strong> Unauthorized sharing of personal information, intimate images, or confidential data</li>
                    <li><strong>Misinformation:</strong> False information, conspiracy theories, medical misinformation, or misleading content shared by users</li>
                    <li><strong>Psychological Harm:</strong> Mental distress, emotional damage, or psychological trauma caused by user interactions</li>
                    <li><strong>Physical Harm:</strong> Any real-world violence, self-harm, or dangerous activities coordinated through our platform</li>
                    <li><strong>Data Breaches:</strong> Unauthorized access to accounts due to weak passwords, phishing, or user negligence</li>
                    <li><strong>Technical Issues:</strong> Message delivery failures, data loss, service outages, or technical malfunctions</li>
                    <li><strong>Third-Party Actions:</strong> Actions taken by other users, external services, or malicious actors</li>
                  </ul>
                </div>
              </section>

              {/* No Access to Messages */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <MessageCircle className="w-6 h-6 text-info" />
                  <h2 className="text-2xl font-bold text-base-content">3. No Access to Private Communications</h2>
                </div>
                <div className="bg-info/10 border border-info/20 rounded-lg p-6 mb-4">
                  <p className="text-base leading-relaxed text-base-content/80 mb-4">
                    <strong>We do not have access to your messages or privately saved information.</strong> Our platform is designed with privacy in mind:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-base-content/80">
                    <li>Messages are transmitted directly between users</li>
                    <li>We cannot read, monitor, or access your private conversations</li>
                    <li>We cannot provide message content to law enforcement or other organizations</li>
                    <li>We cannot recover deleted messages or lost data</li>
                    <li>We cannot verify the content of reported messages without user cooperation</li>
                  </ul>
                  <p className="text-base leading-relaxed text-base-content/80 mt-4">
                    <strong>Therefore, we cannot be held responsible for content we cannot access or control.</strong>
                  </p>
                </div>
              </section>

              {/* User Responsibilities */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-secondary" />
                  <h2 className="text-2xl font-bold text-base-content">4. User Responsibilities</h2>
                </div>
                <p className="text-base leading-relaxed text-base-content/80 mb-4">
                  You are solely responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-base-content/80 mb-4">
                  <li>All content you send, share, or upload through our platform</li>
                  <li>Maintaining the security of your account credentials</li>
                  <li>Complying with all applicable laws and regulations</li>
                  <li>Respecting other users rights and privacy</li>
                  <li>Reporting inappropriate behavior through proper channels</li>
                  <li>Understanding the risks of online communication</li>
                  <li>Backing up important conversations or data</li>
                </ul>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-bold text-base-content mb-4">5. Contact Information</h2>
                <p className="text-base leading-relaxed text-base-content/80">
                  If you have questions about these Terms, please contact us at:
                  <br />
                  <strong>Email:</strong> <a href="mailto:elsonmgaya25@gmail.com" className="link link-primary">elsonmgaya25@gmail.com</a>
                  <br />
                  <strong>Support:</strong> <a href="https://justelson-help.vercel.app/" target="_blank" rel="noopener noreferrer" className="link link-primary">justelson-help.vercel.app</a>
                </p>
              </section>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-base-200 border-t border-base-300/50 mt-12">
          <div className="max-w-4xl mx-auto px-8 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-base-300 rounded-lg flex items-center justify-center">
                  <AppLogo className="w-5 h-5" />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-sm font-medium text-base-content">de_monax</p>
                  <p className="text-xs text-base-content/60">Secure messaging platform</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-xs text-base-content/60">
                <Link to="/eula" className="link link-hover">EULA</Link>
                <span className="hidden md:inline">•</span>
                <Link to="/privacy" className="link link-hover">Privacy Policy</Link>
                <span className="hidden md:inline">•</span>
                <a href="https://justelson-help.vercel.app/" target="_blank" rel="noopener noreferrer" className="link link-hover">Support</a>
                <span className="hidden md:inline">•</span>
                <span>© 2025 de_monax. All rights reserved.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsOfServicePage;