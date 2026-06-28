import { useEffect, useState } from "react";
import { MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import API from "../services/api";
import imgUrl from "../utils/imgUrl";

const TopMonasteries = () => {
  const [monasteries, setMonasteries] = useState([]);

  useEffect(() => {
    API.get("/monasteries")
      .then((res) => { if (res.data) setMonasteries(res.data.slice(0, 6)); })
      .catch(() => null);
  }, []);

  if (monasteries.length === 0) return null;

  return (
    <section className="py-20 md:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Top <span className="text-teal-600">Monasteries</span></h2>
          <p className="text-lg text-slate-500 max-w-2xl font-medium mx-auto">Discover the most revered spiritual sanctuaries across the Sikkim Himalayas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {monasteries.map((m) => (
            <div key={m._id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group">
              <div className="h-[220px] overflow-hidden">
                <img
                  src={imgUrl(m.image)}
                  alt={m.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => { e.target.src = imgUrl(""); }}
                />
              </div>
              <div className="p-8">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-teal-600 mb-3">
                  <MapPin size={12} /> {m.location}
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-teal-600 transition-colors">
                  {m.name}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2 font-medium">
                  {m.history}
                </p>
                <Link
                  to={`/monasteries/${m._id}`}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-900 hover:text-teal-600 transition-colors group/link"
                >
                  View Sanctuary <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopMonasteries;
