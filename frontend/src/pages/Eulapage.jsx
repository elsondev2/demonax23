import { Link } from "react-router";
import { ArrowLeft, FileText, Shield, Lock, AlertTriangle, Scale, Globe, DollarSign, Bell, Search } from "lucide-react";

// Simple logo component
function AppLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor">
      <circle cx="50" cy="50" r="40" />
    </svg>
  );
}

function EULAPage() {
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
                    End-User License Agreement
                  </h1>
                  <p className="text-xs text-base-content/60">Terms of use and licensing</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-md border border-primary/20">
                <FileText className="w-3 h-3 text-primary" />
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
                  End-User License Agreement
                </h1>
                <p className="text-sm text-base-content/60 mt-1">Terms of use and licensing</p>
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
                <strong>Last Updated:</strong> October 14, 2025
                <br />
                <strong>Application:</strong> de-monax (also styled "de_monax", "the App")
                <br />
                <strong>Developer / Operator:</strong> Just Elson Technologies
              </p>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                <p className="text-base leading-relaxed text-base-content/80">
                  By installing, accessing, creating an account for, activating, or using the App you accept and agree to be bound by this End-User License Agreement (this "Agreement"). <strong>If you do not agree, do not install or use the App.</strong>
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Definitions */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-info" />
                  <h2 className="text-2xl font-bold text-base-content">1. Definitions</h2>
                </div>
                <ul className="list-disc pl-6 space-y-2 text-base-content/80">
                  <li><strong>"App"</strong> means the de-monax application and any updates, patches, components, modules, plugins, APIs, SDKs and related documentation provided by Developer.</li>
                  <li><strong>"User", "you", "your"</strong> means the individual or entity that installs, activates, or uses the App.</li>
                  <li><strong>"Paid Features"</strong> means functionality or content that requires payment, a license key, or an active subscription to access.</li>
                  <li><strong>"Free Features"</strong> means features expressly offered without charge.</li>
                  <li><strong>"Entitlement"</strong> means the license token, subscription state, license file or remote authorization that enables access to specific Paid Features.</li>
                </ul>
              </section>

              {/* License Grant */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-success" />
                  <h2 className="text-2xl font-bold text-base-content">2. License Grant</h2>
                </div>
                <div className="bg-success/10 border border-success/20 rounded-lg p-6">
                  <p className="text-base leading-relaxed text-base-content/80 mb-4">
                    Subject to your compliance with this Agreement (including payment obligations where applicable) Developer grants you a limited, non-exclusive, non-transferable, revocable license to install and use one copy of the App in object-code form on a single device (or the number of devices permitted by the paid license you purchased) solely for your personal or internal business use and only for the features you are authorized to access.
                  </p>
                  <p className="text-base leading-relaxed text-base-content/80">
                    <strong>This license is a right to use — not a sale</strong> — and Developer retains all ownership and intellectual property rights in the App and related materials.
                  </p>
                </div>
              </section>

              {/* Incorporation of TOS & Privacy Policy */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold text-base-content">3. Incorporation of TOS & Privacy Policy</h2>
                </div>
                <p className="text-base leading-relaxed text-base-content/80">
                  The Developer's Terms of Service and Privacy Policy, as posted at the Developer's website and as updated from time to time, are incorporated by reference and form an integral part of this Agreement. You acknowledge you have read and accepted those documents. Where there is a conflict between this EULA and the TOS/Privacy Policy, the express provisions of this EULA control with respect to licensing, enforcement, and technological protection measures.
                </p>
              </section>

              {/* License Types, Payments & Access */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="w-6 h-6 text-warning" />
                  <h2 className="text-2xl font-bold text-base-content">4. License Types, Payments & Access</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-base-content mb-2">Free Use:</h3>
                    <p className="text-base leading-relaxed text-base-content/80">
                      Certain App functionality may be provided free of charge. Free Features may be limited in scope, time, or usage and may be modified or withdrawn at Developer's discretion.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-base-content mb-2">Paid / Subscription Use:</h3>
                    <p className="text-base leading-relaxed text-base-content/80">
                      Premium functionality requires payment or an active subscription. Paid Features are accessible only while your payment is current and your Entitlement is valid. Developer may use in-App billing, external payment processors, or both.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-base-content mb-2">License Activation:</h3>
                    <p className="text-base leading-relaxed text-base-content/80">
                      Access to Paid Features may require activation using license keys, account authentication, token exchange, or remote server validation (Entitlement checks). You must provide accurate payment and account information. Developer may suspend access for non-payment.
                    </p>
                  </div>
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-base-content mb-2">Fees & Refunds:</h3>
                    <p className="text-base leading-relaxed text-base-content/80">
                      <strong>Fees are non-refundable</strong> except as required by law or as Developer otherwise elects in writing. Subscription renewals are automatically charged unless you cancel per the in-App or account controls.
                    </p>
                  </div>
                </div>
              </section>

              {/* Technical Enforcement */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-6 h-6 text-secondary" />
                  <h2 className="text-2xl font-bold text-base-content">5. Technical Enforcement & Entitlement Checks</h2>
                </div>
                <p className="text-base leading-relaxed text-base-content/80 mb-4">
                  To protect licenses and Paid Features the App may implement technical enforcement mechanisms including, but not limited to: license keys, signed license files, device binding, server-side entitlement checks, feature flags, tamper detection, runtime integrity checks, and telemetry. You consent to these mechanisms and to the App communicating with Developer servers as required for activation, periodic validation, usage reporting, security, and updates.
                </p>
                <p className="text-base leading-relaxed text-base-content/80">
                  Developer may prevent or suspend access to Paid Features when the App detects tampering, invalid entitlements, or suspected misuse.
                </p>
              </section>

              {/* Restrictions */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-error" />
                  <h2 className="text-2xl font-bold text-base-content">6. Restrictions — What You MAY NOT Do</h2>
                </div>
                <div className="bg-error/10 border border-error/20 rounded-lg p-6 mb-4">
                  <p className="text-base leading-relaxed text-base-content/80 mb-4">
                    <strong>Except as expressly permitted by this Agreement, you shall not and shall not allow others to:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-base-content/80">
                    <li>Copy, reproduce, distribute, rent, lease, sublicense, sell, or transfer any portion of the App</li>
                    <li>Modify, adapt, translate, create derivative works of, or publicly display or perform the App or its components</li>
                    <li>Reverse engineer, decompile, disassemble, or otherwise attempt to derive source code, algorithms, or trade secrets from the App</li>
                    <li>Bypass, remove, deactivate, or circumvent any license verification, activation, DRM, entitlement checks, tamper detection, logging, telemetry, or other technological protection measures</li>
                    <li>Use cracks, keygens, patches, hacks, proxy servers, emulators, modified clients, or other unauthorized workarounds to enable Paid Features or to avoid payment or license restrictions</li>
                    <li>Use the App to provide commercial timesharing, service bureau or rental services unless explicitly licensed to do so</li>
                    <li>Use the App to store, transmit, or facilitate illegal content, or to perform unlawful activity</li>
                    <li>Introduce malware, spyware, rootkits, or any code designed to impair the App's operation</li>
                    <li>Remove or alter any copyright, trademark, or other proprietary notices embedded in the App</li>
                  </ul>
                </div>
                <p className="text-base leading-relaxed text-base-content/80 font-semibold">
                  Any attempt to violate these restrictions voids the license and may subject you to civil and criminal liability.
                </p>
              </section>

              {/* Anti-Circumvention */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-error" />
                  <h2 className="text-2xl font-bold text-base-content">7. Anti-Circumvention & Anti-Tampering</h2>
                </div>
                <div className="bg-error/10 border border-error/20 rounded-lg p-6">
                  <p className="text-base leading-relaxed text-base-content/80">
                    You agree not to attempt to circumvent, defeat, remove, or bypass any security mechanism, licensing check, digital rights management (DRM), or tamper detection included in the App. Circumvention may violate local and international law (including anti-circumvention statutes such as the DMCA §1201 in jurisdictions where applicable). Developer will take reasonable technical and legal steps to detect and respond to circumvention and to pursue available remedies.
                  </p>
                </div>
              </section>

              {/* Monitoring & Audit */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Search className="w-6 h-6 text-info" />
                  <h2 className="text-2xl font-bold text-base-content">8. Monitoring, Audit & Telemetry</h2>
                </div>
                <p className="text-base leading-relaxed text-base-content/80 mb-4">
                  Developer may collect and maintain technical information and diagnostic data necessary to enforce entitlements, detect misuse, improve the App and provide support. This may include license activation events, device identifiers, IP addresses, feature usage, crash logs, and tamper detection flags. Data collection will be governed by the Developer's Privacy Policy.
                </p>
                <p className="text-base leading-relaxed text-base-content/80">
                  Developer reserves the right to audit (directly or through a third party) your usage to confirm compliance with this Agreement, provided Developer gives reasonable notice and the audit is conducted during normal business hours. If the audit reveals non-compliant usage, you agree to pay reasonable audit costs and any additional licensing fees owed.
                </p>
              </section>

              {/* Updates */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Bell className="w-6 h-6 text-success" />
                  <h2 className="text-2xl font-bold text-base-content">9. Updates, Patches & Feature Changes</h2>
                </div>
                <p className="text-base leading-relaxed text-base-content/80 mb-4">
                  Developer may provide updates, patches, bug fixes, feature changes, or new releases. Developer is not obligated to provide updates indefinitely. Updates may be required to maintain entitlement validation or security; failure to update may result in loss of functionality.
                </p>
                <p className="text-base leading-relaxed text-base-content/80">
                  Developer may add, modify, or remove features (including free features) and may change pricing, subscription terms, or entitlements with reasonable notice where required by law.
                </p>
              </section>

              {/* Warranty Disclaimer */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                  <h2 className="text-2xl font-bold text-base-content">10. Warranty Disclaimer</h2>
                </div>
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-6">
                  <p className="text-base leading-relaxed text-base-content/80">
                    <strong>THE APP IS PROVIDED "AS-IS" AND "AS AVAILABLE."</strong> DEVELOPER DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT TO THE MAXIMUM EXTENT PERMITTED BY LAW. DEVELOPER DOES NOT WARRANT UNINTERRUPTED OR ERROR-FREE OPERATION, OR THAT THE APP WILL MEET YOUR REQUIREMENTS.
                  </p>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Scale className="w-6 h-6 text-error" />
                  <h2 className="text-2xl font-bold text-base-content">11. Limitation of Liability</h2>
                </div>
                <div className="bg-error/10 border border-error/20 rounded-lg p-6">
                  <p className="text-base leading-relaxed text-base-content/80">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL DEVELOPER BE LIABLE FOR CONSEQUENTIAL, INCIDENTAL, SPECIAL, PUNITIVE, OR INDIRECT DAMAGES, INCLUDING LOSS OF PROFITS, LOSS OF DATA, BUSINESS INTERRUPTION, OR LOSS OF GOODWILL, ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT OR THE USE OF THE APP, EVEN IF DEVELOPER HAS BEEN ADVISED OF THE POSSIBILITY OF THOSE DAMAGES. DEVELOPER'S TOTAL AGGREGATE LIABILITY FOR DIRECT DAMAGES SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE APP DURING THE 12 MONTHS PRECEDING THE CLAIM (IF ANY), OR ONE HUNDRED UNITED STATES DOLLARS (USD $100) IF YOU PAID NOTHING.
                  </p>
                </div>
              </section>

              {/* Governing Law */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold text-base-content">12. Governing Law & Jurisdiction</h2>
                </div>
                <p className="text-base leading-relaxed text-base-content/80">
                  This Agreement shall be governed by and construed in accordance with the laws of the <strong>United Republic of Tanzania</strong>. You agree to submit to the exclusive jurisdiction of the courts of Tanzania for any dispute arising out of or relating to this Agreement, to the extent permitted by applicable law.
                </p>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-bold text-base-content mb-4">13. Contact Information</h2>
                <p className="text-base leading-relaxed text-base-content/80">
                  If you have questions, need support, or wish to report a license enforcement matter, contact us at:
                  <br />
                  <strong>Email:</strong> <a href="mailto:elsonmgaya25@gmail.com" className="link link-primary">elsonmgaya25@gmail.com</a>
                  <br />
                  <strong>Support:</strong> <a href="https://justelson-help.vercel.app/" target="_blank" rel="noopener noreferrer" className="link link-primary">justelson-help.vercel.app</a>
                </p>
              </section>

              {/* Acceptance */}
              <section>
                <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-base-content mb-4">14. Acceptance</h2>
                  <p className="text-base leading-relaxed text-base-content/80">
                    <strong>BY CLICKING "I ACCEPT," INSTALLING, ACTIVATING, OR USING THE APP, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THIS AGREEMENT, THE TOS, AND THE PRIVACY POLICY. IF YOU DO NOT AGREE, DO NOT INSTALL OR USE THE APP — AND IF YOU HAVE ALREADY INSTALLED IT, UNINSTALL IMMEDIATELY.</strong>
                  </p>
                </div>
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
                <Link to="/terms" className="link link-hover">Terms of Service</Link>
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

export default EULAPage;