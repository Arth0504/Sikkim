import { useEffect } from "react";
import { ShieldCheck, HeartPulse, CalendarX, Luggage, PhoneCall, ArrowRight, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

const TravelInsurance = () => {
  useEffect(() => {
    document.title = "Travel Insurance - Monastery360";
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24">
      {/* Header section with breadcrumbs */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex gap-2 text-xs font-black uppercase tracking-widest text-teal-600 mb-2">
            <Link to="/" className="hover:text-teal-800 transition-colors">Home</Link>
            <span>•</span>
            <span className="text-slate-400">Travel Insurance</span>
          </div>
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-teal-600/20">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Travel <span className="text-teal-600">Insurance Info</span></h1>
          <p className="text-slate-500 font-medium max-w-xl mx-auto">
            Explore the sacred valleys of Sikkim with complete peace of mind. Learn about our comprehensive protection coverage.
          </p>
        </div>

        {/* Coverage Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            {
              title: "Medical Emergencies",
              desc: "Immediate medical evacuation and cashless hospital admission in Gangtok, Darjeeling, and northern Sikkim hospitals.",
              icon: <HeartPulse className="text-rose-500" size={24} />,
              bg: "bg-rose-50",
              badge: "Up to ₹5,00,000"
            },
            {
              title: "Trip Cancellation",
              desc: "Receive refund offsets for flight disruptions, landslides, weather alerts, or sudden military permits denial.",
              icon: <CalendarX className="text-amber-500" size={24} />,
              bg: "bg-amber-50",
              badge: "Up to 100% Refund"
            },
            {
              title: "Baggage & Belongings",
              desc: "Reimbursement for delayed or lost baggage on transits, domestic airline flights, and hotel transfers.",
              icon: <Luggage className="text-sky-500" size={24} />,
              bg: "bg-sky-50",
              badge: "Up to ₹50,000"
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-between">
              <div>
                <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center mb-6`}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">{item.desc}</p>
              </div>
              <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-xs font-black uppercase tracking-wider text-slate-400">
                <span>Coverage Limit</span>
                <span className="text-teal-600 bg-teal-50 px-2.5 py-1 rounded-md">{item.badge}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Core Content Container */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-10 md:p-16 space-y-12 mb-16">
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 bg-teal-600 rounded-full inline-block" />
              Insurance Coverage Information
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              Every travel itinerary booked through Monastery360 offers a customizable travel insurance add-on provided by our partner, GoSafe Protect. The policy is specifically tailored for mountain travel, high-altitude trekking in Sikkim, and helicopter evacuations if necessary.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 bg-teal-600 rounded-full inline-block" />
              Medical Evacuations & High Altitudes
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              Monasteries such as Rumtek, Pemayangtse, and especially Tashiding or Gurudongmar Lake are situated in remote, high-altitude alpine regions. Our policy ensures that in the event of acute mountain sickness (AMS) or physical injuries, standard road ambulance services or high-altitude rescue transport is fully covered.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 bg-teal-600 rounded-full inline-block" />
              Lost Baggage & Delay Policy
            </h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              If your baggage is delayed for more than 12 hours during connection transits at Bagdogra Airport (IXB) or Pakyong Airport (PYG), the travel insurance policy provides reimbursement for purchasing essential toiletries, clothing, and medicines needed to continue your spiritual pilgrimage without interruption.
            </p>
          </section>

          {/* Contact Support */}
          <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shrink-0">
                <PhoneCall size={22} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Need immediate medical or claim assistance?</h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Contact our 24/7 dedicated GoSafe Desk at claims@monastery360.com or dial +91 99999 88888.</p>
              </div>
            </div>
            <a href="mailto:claims@monastery360.com" className="px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-teal-600 transition-colors shrink-0">
              Submit Claim
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelInsurance;
