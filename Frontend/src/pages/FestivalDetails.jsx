import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, ArrowLeft, Loader2, Sparkles, Bell, BellOff } from "lucide-react";
import API from "../services/api";
import imgUrl from "../utils/imgUrl";
import { showSuccess, showError } from "../utils/toast";
import { DetailSkeleton } from "../components/SkeletonLoader";

const FestivalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [festival, setFestival] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const userToken = sessionStorage.getItem("userToken") || localStorage.getItem("userToken");

  useEffect(() => {
    API.get("/festivals")
      .then((res) => {
        const found = res.data.find((f) => f._id === id);
        setFestival(found);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (userToken && festival) {
      API.get(`/reminders/status/${id}`)
        .then((res) => {
          setIsSubscribed(res.data.subscribed);
        })
        .catch((err) => {
          console.error("Fetch subscription status error", err);
        });
    }
  }, [id, userToken, festival]);

  const handleSubscribeToggle = async () => {
    if (!userToken) {
      showError("Please log in to subscribe to reminders");
      navigate("/login");
      return;
    }

    setSubmitting(true);
    try {
      if (isSubscribed) {
        const res = await API.post(`/reminders/unsubscribe/${id}`);
        setIsSubscribed(false);
        showSuccess(res.data.message || "Unsubscribed successfully! 🔕");
      } else {
        const res = await API.post(`/reminders/subscribe`, { festivalId: id });
        setIsSubscribed(true);
        showSuccess(res.data.message || "Subscribed successfully! 🔔");
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to update subscription");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  if (!festival) return (
    <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest">
      Festival Not Found
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO SECTION */}
      <div className="relative h-[60vh] min-h-[500px] overflow-hidden">
        <img src={imgUrl(festival.image)} alt={festival.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-end pb-20 px-6">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-2 text-white/70 hover:text-white font-bold uppercase tracking-widest text-xs mb-8 transition-colors"
            >
              <ArrowLeft size={16} /> Back to Festivals
            </button>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                <Sparkles size={12} /> Seasonal Celebration
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">{festival.name}</h1>
              <div className="flex flex-wrap items-center gap-6 text-white/80 font-bold uppercase tracking-[0.1em] text-sm">
                <span className="flex items-center gap-2"><Calendar size={18} className="text-teal-500" /> {festival.date}</span>
                <span className="flex items-center gap-2"><MapPin size={18} className="text-teal-500" /> Sikkim</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-12">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10 md:p-14">
              <h2 className="text-3xl font-black text-slate-900 mb-8">About the Festival</h2>
              <p className="text-slate-600 text-lg leading-relaxed font-medium whitespace-pre-wrap">
                {festival.description}
              </p>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10 bg-teal-600 text-white">
              <h3 className="text-xl font-black mb-6 text-white">Plan Your Visit</h3>
              <p className="text-teal-50 font-medium mb-8 leading-relaxed">
                Experience this vibrant celebration in person. We offer curated tour packages that include guided festival access.
              </p>
              <button onClick={() => navigate("/packages")} className="w-full py-4 bg-white text-teal-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-teal-50 transition-colors shadow-xl shadow-teal-900/20">
                Explore Packages
              </button>
            </div>

            {/* REMINDER SUBSCRIPTION CARD */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10 mt-8 text-slate-800">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-2xl transition-colors ${isSubscribed ? 'bg-teal-50 text-teal-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
                  <Bell size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">Festival Reminders</h3>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Stay Celebrated</p>
                </div>
              </div>
              
              <p className="text-slate-600 font-medium mb-6 leading-relaxed text-sm">
                Get email alerts <span className="text-teal-600 font-bold">7 days, 3 days, and 1 day</span> before the festival starts so you don't miss the celebration.
              </p>

              {userToken ? (
                <button
                  disabled={submitting}
                  onClick={handleSubscribeToggle}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 flex items-center justify-center gap-2 ${
                    isSubscribed
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20'
                  }`}
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : isSubscribed ? (
                    <>
                      <BellOff size={16} /> Unsubscribe
                    </>
                  ) : (
                    <>
                      <Bell size={16} /> Subscribe to Reminders
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-wider">
                    Please log in to manage reminders
                  </p>
                  <button
                    onClick={() => {
                      showError("Please log in to subscribe to reminders");
                      navigate("/login");
                    }}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-colors"
                  >
                    Log In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FestivalDetails;
