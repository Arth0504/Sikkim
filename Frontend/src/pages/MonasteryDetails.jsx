import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, ArrowLeft, Loader2, Compass, Scroll, ShieldAlert } from "lucide-react";
import API from "../services/api";
import imgUrl from "../utils/imgUrl";
import { DetailSkeleton } from "../components/SkeletonLoader";

const MonasteryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [monastery, setMonastery] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/monasteries/${id}`)
      .then((res) => {
        setMonastery(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) return <DetailSkeleton />;

  if (!monastery) return (
    <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest">
      Monastery Not Found
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-slate-400 hover:text-teal-600 font-bold uppercase tracking-widest text-xs mb-10 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Sanctuary List
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* LEFT: CONTENT */}
          <div className="lg:col-span-7 space-y-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-teal-600">
                <MapPin size={14} /> {monastery.location}
              </div>
              <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">{monastery.name}</h1>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10 md:p-14 space-y-10">
              <section className="space-y-6">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <Scroll size={20} className="text-teal-600" /> 
                  Heritage & History
                </h2>
                <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                  {monastery.history || "Experience the profound tranquility and rich spiritual heritage of this ancient sanctuary, where centuries of tradition meet breathtaking mountain vistas."}
                </p>
              </section>

              {monastery.rules && (
                <section className="pt-10 border-t border-slate-100 space-y-6">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <ShieldAlert size={20} className="text-teal-600" /> 
                    Visitor Guidelines
                  </h2>
                  <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                    <p className="text-slate-600 text-sm leading-relaxed font-bold">
                      {monastery.rules}
                    </p>
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* RIGHT: MEDIA & ACTIONS */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden shadow-2xl shadow-slate-200">
              <img
                src={imgUrl(monastery.image)}
                alt={monastery.name}
                className="w-full h-auto object-cover"
                onError={(e) => { e.target.src = imgUrl(""); }}
              />
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-600/20">
                  <Compass size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">360° Virtual Tour</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Immersive Experience</p>
                </div>
              </div>
              
              <button
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-all duration-300 w-full shadow-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                onClick={() => navigate(`/monasteries/${monastery._id}/tour`)}
                disabled={!monastery.iframe360 || monastery.iframe360.trim() === ""}
              >
                {!monastery.iframe360 || monastery.iframe360.trim() === "" ? "Tour Unavailable" : "Start Virtual Tour"}
              </button>
              
              {!monastery.iframe360 && (
                <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-300">
                  This site is currently being digitized.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonasteryDetails;