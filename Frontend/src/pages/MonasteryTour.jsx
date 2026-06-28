import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Compass, AlertCircle, Loader2 } from "lucide-react";
import API from "../services/api";

const MonasteryTour = () => {
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
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const getCleanTourUrl = (url) => {
    if (!url) return "";
    let cleanUrl = url.trim();
    
    // If the admin pasted a full iframe HTML string, extract the src attribute
    if (cleanUrl.includes("<iframe") && cleanUrl.includes("src=")) {
      const match = cleanUrl.match(/src=["']([^"']+)["']/);
      if (match && match[1]) {
        cleanUrl = match[1];
      }
    }
    
    // Validate that it is a valid HTTP/HTTPS URL
    try {
      const parsed = new URL(cleanUrl);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return cleanUrl;
      }
    } catch (_) {
      // URL is invalid
    }
    return "";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="text-teal-500 animate-spin" size={40} />
      </div>
    );
  }

  if (!monastery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-10">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-xl font-bold">Monastery Not Found</p>
          <button onClick={() => navigate("/")} className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-teal-900/10 active:scale-95 mt-6">Return Home</button>
        </div>
      </div>
    );
  }

  const cleanTourUrl = getCleanTourUrl(monastery.iframe360);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col pt-20">
      {/* HEADER BAR */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-white/5 px-8 py-6 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} /> Exit Tour
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white">
              <Compass size={18} />
            </div>
            <h1 className="text-lg font-black text-white tracking-tight">
              {monastery.name} <span className="text-teal-600 ml-2">360° Virtual Experience</span>
            </h1>
          </div>

          <div className="hidden md:block w-32"></div> {/* Spacer */}
        </div>
      </div>

      {/* VIEWPORT */}
      <div className="flex-1 relative bg-black overflow-hidden">
        {!cleanTourUrl ? (
          <div className="absolute inset-0 flex items-center justify-center text-center p-10">
            <div className="space-y-4">
              <Compass size={64} className="text-slate-800 mx-auto" />
              <p className="text-slate-500 font-bold uppercase tracking-widest">360° Immersive tour is not yet available for this site.</p>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                We are actively digitizing this sanctuary. Please check back later or view other sanctuaries.
              </p>
              <button onClick={() => navigate(-1)} className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white font-bold rounded-xl transition-all duration-300 mt-4 cursor-pointer">View Other Sites</button>
            </div>
          </div>
        ) : (
          <iframe
            src={cleanTourUrl}
            title="360 Virtual Tour"
            className="absolute inset-0 w-full h-full border-0"
            allowFullScreen
            loading="lazy"
          />
        )}
      </div>

      {/* FOOTER INFO */}
      <div className="bg-slate-950 px-8 py-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
            Navigation Tip: Click and drag to look around. Use scroll to zoom.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MonasteryTour;