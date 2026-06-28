import { useEffect } from "react";
import { ShieldAlert, Key, Database, CreditCard, Lock, Eye, Link2 } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = "Privacy Policy - Monastery360";
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header Breadcrumbs */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex gap-2 text-xs font-black uppercase tracking-widest text-teal-600 mb-2">
            <Link to="/" className="hover:text-teal-800 transition-colors">Home</Link>
            <span>•</span>
            <span className="text-slate-400">Privacy Policy</span>
          </div>
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-teal-600/20">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Privacy <span className="text-teal-600">Policy</span></h1>
          <p className="text-slate-500 font-medium">How we safeguard your digital footprints and booking details</p>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-10 md:p-16 space-y-12">
          
          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Database className="text-teal-600" size={20} />
              1. User Data Collection
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              We collect traveler personal information necessary to organize permits and bookings in Sikkim. This includes names, ages, emails, mobile numbers, address details, and scanned ID proof copies (Aadhaar, Passport, PAN, Voter ID). Scanned documents are stored in encrypted directories and are purged 30 days after trip completion.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Lock className="text-teal-600" size={20} />
              2. Cookies & Personalization Policy
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              Monastery360 utilizes standard HTTP cookies to recognize user sessions, remember comparison lists, active drawer items, and wishlist selections. Cookies are also utilized by our embedded 360-degree virtual media viewer to cache assets locally, enabling lightning-fast loads. You may opt to block cookies in browser settings, which might disable some dynamic visual states.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CreditCard className="text-teal-600" size={20} />
              3. Payment Information Handling
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              All online payments are routed through Razorpay's securely hosted API checkout integrations. Monastery360 does not store raw credit card details, CVV codes, or netbanking passwords on its local MongoDB servers. Razorpay processes transactions in compliance with PCI-DSS guidelines. We only store Razorpay Order ID and Transaction IDs for confirmation audits.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Key className="text-teal-600" size={20} />
              4. Google Login Data Usage
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              For users opting to authenticate via Google Sign-In, we request access only to your Google profile name, email address, and avatar image. This data is exclusively used to pre-fill your traveler profiles and assign unique dashboard accounts. We do not write back or request administrative scope changes on your Google Drive or Gmail.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Eye className="text-teal-600" size={20} />
              5. Security Measures & Encryption
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              Our API channels communicate using Secure Socket Layer (SSL) encryption protocols. Direct uploads of travelers' profile photos are restricted to secure storage directories on our servers. Server access is restricted to verified administrators under strong JWT authentication checks.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="text-teal-600" size={20} />
              6. Your Legal User Rights
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              Under international data guidelines, you possess full ownership rights to your data. You may request our administrator panel to completely erase your traveler account, booking transaction logs (if already settled), query archives, and wishlist saves by sending a request to privacy@monastery360.com.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
