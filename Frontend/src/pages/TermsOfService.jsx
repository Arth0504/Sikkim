import { useEffect } from "react";
import { BookOpen, Calendar, HelpCircle, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const TermsOfService = () => {
  useEffect(() => {
    document.title = "Terms of Service - Monastery360";
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header Breadcrumbs */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex gap-2 text-xs font-black uppercase tracking-widest text-teal-600 mb-2">
            <Link to="/" className="hover:text-teal-800 transition-colors">Home</Link>
            <span>•</span>
            <span className="text-slate-400">Terms of Service</span>
          </div>
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-teal-600/20">
            <FileText size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Terms of <span className="text-teal-600">Service</span></h1>
          <p className="text-slate-500 font-medium">Clear booking conditions, rules of conduct, and legal disclaimers</p>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-10 md:p-16 space-y-12">
          
          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="text-teal-600" size={20} />
              1. Tour Booking Conditions
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              All reservation requests for packages, monastery exploration tours, and local guides are subject to availability. Bookings are only finalized upon the generation of a successful transaction payment receipt. If travelers register with incorrect age values or false identity proof numbers, local army checkpoint authorities in Sikkim may decline passage, and Monastery360 will not be held liable.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="text-teal-600" size={20} />
              2. Cancellation Rules & Deadlines
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              Cancellations must be requested directly through your dashboard booking lifecycle modal. Cancellation percentage offsets are dynamically adjusted according to the timeline of travel start dates. Any cancellations requested within 48 hours of starting the trip are non-refundable. Detailed conditions can be found in our standalone <Link to="/cancellation-policy" className="text-teal-600 underline font-bold hover:text-teal-800">Cancellation Policy Page</Link>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CheckCircle className="text-teal-600" size={20} />
              3. Refund Disbursement Timelines
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              Once a cancellation request is reviewed and approved by our administrator team, refund amounts are routed back to the original payment source. Refund transactions take approximately 5 to 7 bank working days to settle on your account statement. Cash-on-destination refund requests are settled via direct bank transfer or manual checks.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <AlertTriangle className="text-teal-600" size={20} />
              4. Traveler Responsibilities & Conduct
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              Sikkim's monasteries are sacred places of worship. Explorers are required to follow religious guidelines: dress code restrictions, non-entry boundaries, camera limitations, silence in sanctums, and zero littering. Disrespectful behavior towards the resident Monks, local communities, or national park regulations will result in immediate tour cancellation without refund.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <AlertTriangle className="text-teal-600" size={20} />
              5. Liability Disclaimer
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              Monastery360 works with certified local logistics and transport operators. However, we do not accept liability for unexpected disruptions caused by natural events like heavy rainfall, landslides, flash floods, military checkpoint lockdowns, national strike calls, or flight cancellations. Travel insurance is highly recommended for all packages.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="text-teal-600" size={20} />
              6. Account Usage & Integrity
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              You are responsible for keeping your login credentials, email settings, and dashboard sessions confidential. Creating multiple duplicate accounts to claim fake referral points, exploiting system bugs, or scraping virtual 360-degree media elements will lead to automatic, permanent ban of your explorer account.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
