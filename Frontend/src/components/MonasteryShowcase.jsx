import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import API from "../services/api";
import imgUrl from "../utils/imgUrl";

const MonasteryShowcase = () => {
  const [monasteries, setMonasteries] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/monasteries")
      .then((res) => {
        if (res.data?.length) {
          setMonasteries(res.data);
          setActiveId(res.data[0]._id);
        }
      })
      .catch(() => null);
  }, []);

  const activeMonastery = monasteries.find((m) => m._id === activeId);

  if (!activeMonastery) return null;

  return (
    <section className="py-20 md:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Sacred <span className="text-teal-600">Sanctuaries</span></h2>
            <p className="text-lg text-slate-500 max-w-2xl font-medium">Explore the spiritual heart of Sikkim through our curated collection of ancient monasteries.</p>
          </div>
          <button
            onClick={() => navigate("/monasteries")}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-[#0d9488] text-[#0d9488] hover:bg-teal-50 font-bold rounded-xl transition-all duration-300"
          >
            View All Monasteries <ArrowRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* LIST */}
          <div className="lg:col-span-4 space-y-4">
            {monasteries.slice(0, 5).map((m) => (
              <button
                key={m._id}
                onClick={() => setActiveId(m._id)}
                className={`w-full text-left p-6 rounded-2xl transition-all duration-300 border ${
                  activeId === m._id
                    ? "bg-white border-teal-500 shadow-xl shadow-teal-900/5 translate-x-2"
                    : "bg-transparent border-transparent hover:bg-white hover:border-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`text-lg font-bold transition-colors ${activeId === m._id ? "text-teal-900" : "text-slate-600"}`}>
                      {m.name}
                    </h4>
                    <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin size={14} /> {m.location}
                    </p>
                  </div>
                  {activeId === m._id && <ArrowRight size={20} className="text-teal-600" />}
                </div>
              </button>
            ))}
          </div>

          {/* PREVIEW */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden h-full flex flex-col">
              <div className="aspect-[16/9] overflow-hidden relative">
                <img
                  src={imgUrl(activeMonastery.image)}
                  alt={activeMonastery.name}
                  className="w-full h-full object-cover transition-transform duration-700"
                  onError={(e) => { e.target.src = imgUrl(""); }}
                />
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
                  Featured Destination
                </div>
              </div>
              <div className="p-10 flex-1">
                <h3 className="text-3xl font-black text-slate-900 mb-6">{activeMonastery.name}</h3>
                <p className="text-slate-500 leading-relaxed mb-8 text-lg font-medium">
                  {activeMonastery.history?.substring(0, 350) || "Experience the profound tranquility and rich spiritual heritage of this ancient sanctuary, where centuries of tradition meet breathtaking mountain vistas."}...
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate(`/monasteries/${activeMonastery._id}`)}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-teal-900/10 active:scale-95"
                  >
                    Explore History
                  </button>
                  <button
                    onClick={() => navigate(`/monasteries/${activeMonastery._id}/tour`)}
                    disabled={!activeMonastery.iframe360}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-[#0d9488] text-[#0d9488] hover:bg-teal-50 font-bold rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Virtual Tour
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MonasteryShowcase;
