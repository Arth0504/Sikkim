import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import API from "../services/api";
import imgUrl from "../utils/imgUrl";

const FestivalStory = () => {
  const [festivals, setFestivals] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/festivals")
      .then((res) => { if (res.data) setFestivals(res.data.slice(0, 4)); })
      .catch(() => null);
  }, []);

  if (festivals.length === 0) return null;

  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Living <span className="text-teal-600">Traditions</span></h2>
          <p className="text-lg text-slate-500 max-w-2xl font-medium mx-auto">Witness the vibrant colors, rhythmic dances, and ancient spiritual depth of Sikkim's festivals.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {festivals.map((f) => (
            <div key={f._id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group flex flex-col">
              <div className="aspect-[4/5] relative overflow-hidden">
                <img
                  src={imgUrl(f.image)}
                  alt={f.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => { e.target.src = imgUrl(""); }}
                />
                {/* month badge — uses f.month which is the actual schema field */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl flex flex-col items-center min-w-[60px] shadow-lg">
                  <span className="text-[10px] font-black uppercase text-teal-600 tracking-wider text-center leading-tight">
                    {f.month}
                  </span>
                </div>
                {f.location && (
                  <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                    <MapPin size={11} className="text-teal-400 flex-shrink-0" />
                    <span className="text-[10px] font-bold text-white truncate">{f.location}</span>
                  </div>
                )}
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 mb-2">{f.category}</span>
                <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-teal-600 transition-colors">{f.name}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 line-clamp-3">
                  {f.description}
                </p>
                <button
                  onClick={() => navigate(`/festivals/${f._id}`)}
                  className="mt-auto flex items-center gap-2 text-xs font-black uppercase tracking-widest text-teal-600 hover:gap-3 transition-all"
                >
                  Learn More <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-14">
          <button
            onClick={() => navigate("/festivals")}
            className="inline-flex items-center gap-2 px-10 py-3.5 border-2 border-[#0d9488] text-[#0d9488] hover:bg-teal-50 font-bold rounded-xl transition-all duration-300"
          >
            View All Festivals <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default FestivalStory;
