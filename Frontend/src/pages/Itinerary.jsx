import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, User, ShieldCheck, CheckCircle, ArrowLeft, Loader2, Heart } from "lucide-react";
import API from "../services/api";
import { DetailSkeleton } from "../components/SkeletonLoader";

const Itinerary = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In order to fetch a single booking, we can either use a specific endpoint or filter from /bookings/my
    API.get("/bookings/my")
      .then((res) => {
        const found = res.data.find(b => b._id === bookingId);
        setBooking(found);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [bookingId]);

  if (loading) return <DetailSkeleton />;

  if (!booking) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <p className="text-slate-400 font-bold uppercase tracking-widest mb-4">Booking Not Found</p>
      <button onClick={() => navigate("/my-bookings")} className="text-teal-600 font-bold hover:underline">Return to My Bookings</button>
    </div>
  );

  const pkg = booking.package || {};
  let itineraryList = pkg.itinerary || [];

  // AUTO FALLBACK
  if (itineraryList.length === 0) {
    const numDays = parseInt(pkg.duration) || 3;
    for (let i = 1; i <= numDays; i++) {
      let title = "Exploration & Activities";
      let desc = "Enjoy the planned activities and local culture.";
      if (i === 1) { title = "Arrival"; desc = "Welcome! Check-in to your hotel and relax."; }
      else if (i === 2) { title = "Local Sightseeing"; desc = "Explore the beautiful local attractions and monasteries."; }
      else if (i === numDays) { title = "Departure"; desc = "Checkout and safe travels back home."; }
      itineraryList.push({ day: i, title, description: desc });
    }
  }

  const getDayDate = (startDate, dayNum) => {
    if (!startDate) return "";
    const date = new Date(startDate);
    date.setDate(date.getDate() + (dayNum - 1));
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const parsePolicies = (policiesStr) => {
    if (!policiesStr) return [];
    return policiesStr
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^[•\-\*\d+\.\s]+/, ""));
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24 font-sans">
      <div className="max-w-4xl mx-auto px-6">
        
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-xs mb-10 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft size={16} /> Back to My Bookings
        </button>

        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
          
          {/* 1. Welcome Section */}
          <div className="bg-teal-600 p-10 md:p-14 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 relative z-10">Your Journey Manual</h1>
            <p className="text-teal-100 font-medium text-lg relative z-10">
              Welcome, {booking.firstName}! Here is the complete itinerary for your upcoming trip.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 bg-white/10 px-6 py-2 rounded-full border border-white/20 backdrop-blur-md relative z-10">
              <MapPin size={18} className="text-teal-200" />
              <span className="font-bold tracking-wide">{pkg.name || "Sikkim Tour"}</span>
            </div>
          </div>

          <div className="p-10 md:p-14 space-y-16">
            
            {/* 2. Day-wise plan */}
            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <Calendar className="text-teal-600" /> Day-Wise Itinerary
              </h2>
              <div className="space-y-6">
                {itineraryList.map((day, idx) => (
                  <div key={idx} className="flex gap-6">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-black shrink-0 border border-teal-100">
                        {day.day}
                      </div>
                      {idx !== itineraryList.length - 1 && (
                        <div className="w-0.5 h-full bg-teal-100 my-2"></div>
                      )}
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-6 flex-1 border border-slate-100 mb-2">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-teal-50 text-teal-600 text-[10px] font-black uppercase tracking-wider rounded-md">
                          {getDayDate(booking.travelStartDate, day.day)}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-2">
                        {day.title || day.location || `Day ${day.day} Activity`}
                      </h3>
                      {day.description && (
                        <p className="text-slate-600 text-sm leading-relaxed mb-3">
                          {day.description}
                        </p>
                      )}
                      {day.hotel && (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-bold text-slate-500">
                          <MapPin size={12} className="text-teal-500" /> Stay: {day.hotel}
                        </div>
                      )}
                      {day.activities && day.activities.length > 0 && (
                        <ul className="mt-4 space-y-2">
                          {day.activities.map((act, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-500">
                              <CheckCircle size={14} className="text-teal-500 shrink-0 mt-0.5" /> {act}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Driver Info */}
            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <User className="text-teal-600" /> Driver & Transport
              </h2>
              {booking.driver ? (
                <div className="bg-teal-50 border border-teal-100 rounded-2xl p-6 md:p-8 space-y-4">
                  <p className="text-xs font-black uppercase tracking-widest text-teal-700">Allocated Driver Details</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-sm font-bold text-slate-700">
                    <p><span className="text-slate-400 font-semibold">Driver Name:</span> {booking.driver.name}</p>
                    <p><span className="text-slate-400 font-semibold">Contact Phone:</span> {booking.driver.phone}</p>
                    <p><span className="text-slate-400 font-semibold">Vehicle Number:</span> {booking.driver.vehicleNumber}</p>
                    <p><span className="text-slate-400 font-semibold">Vehicle Type:</span> {booking.driver.vehicleType}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic text-sm font-medium">
                  Driver details will be shared 24 hours before departure.
                </p>
              )}
            </section>

            {/* 4. Policies */}
            <section>
              <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <ShieldCheck className="text-teal-600" /> Journey Policies
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(pkg.policies ? parsePolicies(pkg.policies) : [
                  "Carry valid ID proofs at all times.",
                  "Respect local customs at monasteries.",
                  "Weather in Sikkim changes rapidly; carry warm clothing."
                ]).map((policy, idx) => (
                  <div key={idx} className="flex gap-4 p-5 bg-white border border-slate-100 rounded-2xl transition-all hover:bg-teal-50/20 hover:border-teal-100/50 hover:shadow-md">
                    <CheckCircle className="text-teal-600 shrink-0 mt-0.5" size={18} />
                    <p className="text-slate-600 font-medium text-sm leading-relaxed">{policy}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 5. Thank You */}
            <div className="pt-10 border-t border-slate-100 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart size={28} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Thank you for traveling with us!</h2>
              <p className="text-slate-500 font-medium">We wish you a spiritually enriching and wonderful journey.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Itinerary;
