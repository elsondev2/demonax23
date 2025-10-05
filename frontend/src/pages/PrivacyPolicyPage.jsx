import { Link } from "react-router";
import { ArrowLeft, Shield, Eye, Lock, Database, AlertCircle } from "lucide-react";
import AppLogo from "../components/AppLogo";

function PrivacyPolicyPage() {
  return (
    <div className="w-full h-screen bg-base-300 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-base-100 to-base-200 border-b-2 border-info/20 flex-shrink-0 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 md:py-8">
          {/* Mobile Layout */}
          <div className="flex flex-col gap-4 md:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-base-200 rounded-lg flex items-center justify-center shadow-md">
                  <AppLogo className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-info to-success bg-clip-text text-transparent">
                    Privacy Policy
                  </h1>
                  <p className="text-xs text-base-content/60">Data protection and privacy</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-info/10 rounded-md border border-info/20">
                <Shield className="w-3 h-3 text-info" />
                <span className="text-xs font-medium text-info">Private</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/login" className="btn btn-outline btn-info btn-sm gap-2 flex-1">
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
                <h1 className="text-3xl font-bold bg-gradient-to-r from-info to-success bg-clip-text text-transparent">
                  Privacy Policy
                </h1>
                <p className="text-sm text-base-content/60 mt-1">Data protection and privacy</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/login" className="btn btn-outline btn-info btn-sm gap-2 hover:scale-105 transition-transform">
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
                At de_monax, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our messaging services.
              </p>
            </div>

            <div className="space-y-8">
              {/* Privacy-First Approach */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold text-base-content">1. Privacy-First Approach</h2>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-4">
                  <p className="text-base leading-relaxed text-base-content font-semibold mb-2">
                    <strong>We cannot access your messages or private data.</strong>
                  </p>
                  <p className="text-base leading-relaxed text-base-content/80">
                    Our messaging platform is designed with end-to-end privacy. We do not store, read, or have access to your private conversations and personal information.
                  </p>
                </div>
              </section>

              {/* Information We Collect */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Database className="w-6 h-6 text-info" />
                  <h2 className="text-2xl font-bold text-base-content">2. Information We Collect</h2>
                </div>
                <p className="text-base leading-relaxed text-base-content/80 mb-4">
                  We collect minimal information necessary to provide our services:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-base-content/80 mb-4">
                  <li><strong>Account Information:</strong> Email address, username, display name, and profile picture (if provided)</li>
                  <li><strong>Authentication Data:</strong> Encrypted passwords and login tokens</li>
                  <li><strong>Technical Information:</strong> IP addresses, device information, and browser details for security purposes</li>
                  <li><strong>Usage Analytics:</strong> Basic app usage statistics (anonymized)</li>
                  <li><strong>Support Communications:</strong> Messages you send us through support channels</li>
                </ul>
              </section>

              {/* Information We Do NOT Collect */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="w-6 h-6 text-success" />
                  <h2 className="text-2xl font-bold text-base-content">3. Information We Do NOT Collect or Access</h2>
                </div>
                <div className="bg-success/10 border border-success/20 rounded-lg p-6 mb-4">
                  <p className="text-base leading-relaxed text-base-content/80 mb-4">
                    <strong>We explicitly do not collect or have access to:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-base-content/80">
                    <li><strong>Message Content:</strong> We cannot read your private messages or group conversations</li>
                    <li><strong>Media Files:</strong> Photos, videos, documents, or files shared in chats</li>
                    <li><strong>Contact Lists:</strong> Your device contacts or friend lists</li>
                    <li><strong>Location Data:</strong> Your physical location or GPS coordinates</li>
                    <li><strong>Call Records:</strong> Voice or video call content and recordings</li>
                    <li><strong>Personal Files:</strong> Documents or media stored on your device</li>
                    <li><strong>Browsing History:</strong> Your web browsing or app usage outside our platform</li>
                    <li><strong>Financial Information:</strong> Payment details, bank accounts, or financial data</li>
                  </ul>
                </div>
              </section>

              {/* How We Use Information */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-6 h-6 text-secondary" />
                  <h2 className="text-2xl font-bold text-base-content">4. How We Use Your Information</h2>
                </div>
                <p className="text-base leading-relaxed text-base-content/80 mb-4">
                  We use collected information only for:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-base-content/80 mb-4">
                  <li>Creating and managing your user account</li>
                  <li>Authenticating your identity and securing your account</li>
                  <li>Facilitating message delivery between users</li>
                  <li>Providing customer support and responding to inquiries</li>
                  <li>Improving our services based on anonymous usage patterns</li>
                  <li>Ensuring platform security and preventing abuse</li>
                  <li>Complying with legal obligations when required</li>
                </ul>
              </section>

              {/* Disclaimer of Responsibility */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-warning" />
                  <h2 className="text-2xl font-bold text-base-content">5. Disclaimer of Responsibility</h2>
                </div>
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-6 mb-4">
                  <p className="text-base leading-relaxed text-base-content/80 mb-4">
                    <strong>Since we cannot access your private messages and data, we cannot be held responsible for:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-base-content/80">
                    <li>Content shared between users that we cannot monitor</li>
                    <li>Privacy violations or data breaches caused by user actions</li>
                    <li>Harmful content or illegal activities conducted through private messages</li>
                    <li>Data loss due to user device issues or account deletion</li>
                    <li>Misuse of the platform that occurs in private communications</li>
                    <li>Any damages resulting from user-to-user interactions</li>
                  </ul>
                </div>
              </section>

              {/* Your Rights */}
              <section>
                <h2 className="text-2xl font-bold text-base-content mb-4">6. Your Rights</h2>
                <p className="text-base leading-relaxed text-base-content/80 mb-4">
                  You have the right to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-base-content/80 mb-4">
                  <li>Access any personal data we have about you</li>
                  <li>Request correction or deletion of your account data</li>
                  <li>Delete your account and associated data at any time</li>
                  <li>Object to processing of your personal data</li>
                  <li>Request data portability where applicable</li>
                  <li>Withdraw consent for data processing</li>
                </ul>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-bold text-base-content mb-4">7. Contact Us</h2>
                <p className="text-base leading-relaxed text-base-content/80">
                  If you have questions about this Privacy Policy or our privacy practices, please contact us at:
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
                <Link to="/terms" className="link link-hover">Terms of Service</Link>
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

export default PrivacyPolicyPage;