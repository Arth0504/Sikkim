import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Sparkles, Compass, Coins, Calendar, Smile, MapPin, 
  ArrowRight, Info, BookOpen, ChevronRight, HelpCircle, Loader2 
} from "lucide-react";
import API from "../services/api";
import { showError, showSuccess } from "../utils/toast";

const CustomBuilder = () => {
  const navigate = useNavigate();
  const [region, setRegion] = useState("");
  const [duration, setDuration] = useState("");
  const [budget, setBudget] = useState("");
  const [interests, setInterests] = useState("");
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!region || !duration || !budget || !interests) {
      showError("Please complete all selector fields.");
      return;
    }

    const token = sessionStorage.getItem("userToken");
    if (!token) {
      showError("Please log in as a traveler to reserve a custom tour.");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      // 1. Generate Custom Tour Itinerary
      const res = await API.post("/packages/custom-builder", {
        region,
        duration,
        budget,
        interests
      });

      const customPkg = res.data.customRecommendation;

      // 2. Submit reservation request in database
      await API.post("/packages/custom-builder/reserve", {
        region,
        duration,
        budget,
        interests,
        aiGeneratedPlan: customPkg,
        estimatedPrice: customPkg.price
      });

      setResult(res.data);
      setStep(5); // Go to results step
      showSuccess("Custom Tour Reserved Successfully! ✅");
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Could not reserve custom tour. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRegion("");
    setDuration("");
    setBudget("");
    setInterests("");
    setResult(null);
    setStep(1);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-6 page-fade-in">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* HEADER */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-black uppercase tracking-widest rounded-full">
            <Sparkles size={14} className="animate-spin" /> Custom Package Builder
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Design Your Ideal <span className="text-teal-600">Sikkim Journey</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-base leading-relaxed">
            Tell our smart recommendation assistant about your travel choices, and receive an instant tour suggestion matching your parameters.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center space-y-4 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="text-teal-600 animate-spin" size={48} />
            <p className="text-slate-800 font-black uppercase tracking-widest text-sm">Generating Personalized Itinerary...</p>
            <p className="text-slate-400 font-bold text-xs max-w-xs">Aligning budget, regions, attractions, and monastery references</p>
          </div>
        ) : step < 5 ? (
          /* STEP WIZARD FORM */
          <div className="max-w-2xl mx-auto bg-white rounded-[2rem] border border-slate-100 shadow-sm p-10 space-y-8">
            {/* Step Progress indicators */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span className={step === 1 ? "text-teal-600" : ""}>1. Region</span>
              <ChevronRight size={14} />
              <span className={step === 2 ? "text-teal-600" : ""}>2. Duration</span>
              <ChevronRight size={14} />
              <span className={step === 3 ? "text-teal-600" : ""}>3. Budget</span>
              <ChevronRight size={14} />
              <span className={step === 4 ? "text-teal-600" : ""}>4. Interests</span>
            </div>

            {/* STEP 1: REGION SELECTOR */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <MapPin className="text-teal-600" size={20} /> Which region of Sikkim do you prefer?
                  </h3>
                  <p className="text-slate-500 font-medium text-xs">Each region has its own distinctive climate, monastery sects, and landscape beauty.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "North Sikkim", val: "North Sikkim", desc: "Gurudongmar Lake, valleys, and snowy heights" },
                    { label: "South Sikkim", val: "South Sikkim", desc: "Temi tea garden and Buddha Park" },
                    { label: "East Sikkim", val: "East Sikkim", desc: "Gangtok hub, Ropeway, and Tsomgo Lake" },
                    { label: "West Sikkim", val: "West Sikkim", desc: "Historic ruins and Pemayangtse Monastery" },
                    { label: "All Sikkim", val: "All", desc: "Open to suggestions across all districts" }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => { setRegion(opt.val); setStep(2); }}
                      className={`p-6 rounded-2xl text-left border transition-all duration-300 ${
                        region === opt.val 
                          ? "bg-teal-50 border-teal-500 text-teal-900 shadow-md shadow-teal-500/5" 
                          : "bg-white border-slate-100 hover:border-teal-500 hover:bg-slate-50/50 text-slate-700"
                      }`}
                    >
                      <span className="block font-black text-sm mb-1">{opt.label}</span>
                      <span className="block text-[11px] font-medium text-slate-400 leading-normal">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: DURATION SELECTOR */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Calendar className="text-teal-600" size={20} /> How long is your plan?
                  </h3>
                  <p className="text-slate-500 font-medium text-xs">Choose the length of stay that fits your travel window.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Short Stay", val: "short", desc: "3 - 5 Days" },
                    { label: "Medium Stay", val: "medium", desc: "6 - 8 Days" },
                    { label: "Long Stay", val: "long", desc: "9+ Days" }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => { setDuration(opt.val); setStep(3); }}
                      className={`p-6 rounded-2xl text-left border transition-all duration-300 ${
                        duration === opt.val 
                          ? "bg-teal-50 border-teal-500 text-teal-900 shadow-md shadow-teal-500/5" 
                          : "bg-white border-slate-100 hover:border-teal-500 hover:bg-slate-50/50 text-slate-700"
                      }`}
                    >
                      <span className="block font-black text-sm mb-1">{opt.label}</span>
                      <span className="block text-[11px] font-bold text-teal-600 leading-normal">{opt.desc}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-start">
                  <button onClick={() => setStep(1)} className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider">
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: BUDGET SELECTOR */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Coins className="text-teal-600" size={20} /> Select your budget preference
                  </h3>
                  <p className="text-slate-500 font-medium text-xs">Estimated package costs calculated per traveler.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Budget-Friendly", val: "low", desc: "Under ₹15,000" },
                    { label: "Standard", val: "medium", desc: "₹15,000 - ₹30,000" },
                    { label: "Premium Tour", val: "high", desc: "₹30,000+" }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => { setBudget(opt.val); setStep(4); }}
                      className={`p-6 rounded-2xl text-left border transition-all duration-300 ${
                        budget === opt.val 
                          ? "bg-teal-50 border-teal-500 text-teal-900 shadow-md shadow-teal-500/5" 
                          : "bg-white border-slate-100 hover:border-teal-500 hover:bg-slate-50/50 text-slate-700"
                      }`}
                    >
                      <span className="block font-black text-sm mb-1">{opt.label}</span>
                      <span className="block text-[11px] font-medium text-slate-400 leading-normal">{opt.desc}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-start">
                  <button onClick={() => setStep(2)} className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider">
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: INTERESTS SELECTOR */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Smile className="text-teal-600" size={20} /> Select travel interest focus
                  </h3>
                  <p className="text-slate-500 font-medium text-xs">We customize itinerary highlights to focus on your chosen style.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Spiritual & Meditation", val: "spiritual", desc: "Sutra classes, prayer flags, and quiet monasteries" },
                    { label: "Adventure & Valleys", val: "adventure", desc: "Alpine hikes, high passes, and mountain scenery" },
                    { label: "Cultural Heritage", val: "cultural", desc: "Local food, traditional festivals, and ruins" },
                    { label: "Scenic Photography", val: "scenic", desc: "Sunset peaks, waterfalls, and orange gardens" }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => setInterests(opt.val)}
                      className={`p-6 rounded-2xl text-left border transition-all duration-300 ${
                        interests === opt.val 
                          ? "bg-teal-50 border-teal-500 text-teal-900 shadow-md shadow-teal-500/5" 
                          : "bg-white border-slate-100 hover:border-teal-500 hover:bg-slate-50/50 text-slate-700"
                      }`}
                    >
                      <span className="block font-black text-sm mb-1">{opt.label}</span>
                      <span className="block text-[11px] font-medium text-slate-400 leading-normal">{opt.desc}</span>
                    </button>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setStep(3)} className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider">
                    ← Back
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={!interests}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-[#0d9488] hover:bg-[#0f766e] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl shadow-lg transition-all duration-300"
                  >
                    Reserve Custom Tour <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* RESULTS STAGE */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column: Customized Synthesized Package Proposal */}
            <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 p-8 md:p-10 shadow-sm space-y-8">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start border-b border-slate-100 pb-6 gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-100 text-teal-700 text-[10px] font-black uppercase tracking-wider rounded-full mb-2">
                    Synthesized Custom Itinerary
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">{result.customRecommendation.name}</h2>
                  <p className="text-slate-500 text-xs mt-1">{result.customRecommendation.description}</p>
                </div>
                <div className="text-left md:text-right shrink-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Estimated Cost</p>
                  <h3 className="text-3xl font-black text-teal-600">{formatCurrency(result.customRecommendation.price)}</h3>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block">Duration: {result.customRecommendation.duration}</span>
                </div>
              </div>

              {/* Success Request Alert */}
              <div className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl space-y-1.5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-emerald-700 flex items-center gap-1.5">
                  <Sparkles size={14} className="animate-pulse" /> Custom Tour Reserved Successfully!
                </p>
                <p className="text-[11px] font-medium leading-relaxed">
                  Your custom tour request has been submitted to the Admin team. Once approved (status set to Approved), you will find it in your Custom Tours list under "My Journeys" where you can complete booking details and make the payment.
                </p>
              </div>

              {/* Recommendation Reason alert box */}
              <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-2xl flex gap-3 text-xs text-teal-800 leading-relaxed font-semibold">
                <Sparkles className="text-teal-600 shrink-0 mt-0.5" size={18} />
                <p>{result.customRecommendation.recommendationReason}</p>
              </div>

              {/* Day-by-Day itinerary timeline */}
              <div className="space-y-6">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-4">
                  <BookOpen size={18} className="text-teal-600" /> Day-by-Day Activity Schedule
                </h4>
                <div className="relative pl-6 border-l-2 border-slate-100 space-y-8">
                  {result.customRecommendation.itinerary.map((day) => (
                    <div key={day.day} className="relative">
                      {/* Circle indicator */}
                      <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-teal-600 bg-white flex items-center justify-center text-[8px] font-black text-teal-600">
                        {day.day}
                      </span>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-teal-600">Day {day.day}</span>
                        <h5 className="font-black text-slate-800 text-sm">{day.title}</h5>
                        <p className="text-xs text-slate-500 leading-relaxed font-semibold">{day.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                <button onClick={handleReset} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all uppercase tracking-wider">
                  ← Plan Another Journey
                </button>
                
                <Link
                  to="/my-bookings?tab=reservations"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold text-xs rounded-xl shadow-lg transition-all uppercase tracking-widest"
                >
                  View Reservation Request <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Right Column: Sikkim Tourism details & matching packages */}
            <div className="space-y-8 lg:col-span-1">
              
              {/* Regional travel guide suggestions */}
              <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-6">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
                  <Compass size={18} className="text-teal-600" /> Travel Details
                </h4>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Target Season</span>
                    <p className="font-bold text-slate-700 leading-normal">{result.customRecommendation.season}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Permit Guidelines</span>
                    <p className="font-bold text-slate-700 leading-normal">
                      {result.customRecommendation.permitRequired 
                        ? "Protected Area Permit (PAP) required for alpine regions. Bring 4 passport photos and ID proof copies." 
                        : "No special Inner Line Permit required for Indian Nationals."}
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex gap-2 font-medium leading-relaxed">
                    <Info size={16} className="text-amber-600 shrink-0" />
                    <span>{result.customRecommendation.tips}</span>
                  </div>
                </div>
              </div>

              {/* Matching Official Packages list */}
              <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-6">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
                  <Compass size={18} className="text-teal-600" /> Matching Tour Packages
                </h4>

                {result.matchingPackages.length === 0 ? (
                  <p className="text-slate-400 text-xs font-bold leading-relaxed text-center py-6">
                    No registry packages perfectly match this specific combination. Check out our synthesized AI itinerary map!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {result.matchingPackages.map((pkg) => (
                      <Link 
                        key={pkg._id} 
                        to={`/packages/${pkg._id}`}
                        className="block p-4 border border-slate-100 rounded-xl hover:border-teal-500 hover:shadow-md transition-all space-y-2 group"
                      >
                        <h5 className="font-black text-slate-800 text-sm group-hover:text-teal-600 transition-colors leading-tight">
                          {pkg.name}
                        </h5>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                          <span>{pkg.duration}</span>
                          <span className="text-teal-600 font-black">₹{pkg.price}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default CustomBuilder;
