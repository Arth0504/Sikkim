import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import rumtekMonastery from "../assets/rumtek_monastery.png";
import gurudongmarLake from "../assets/gurudongmar_lake.png";
import pemayangtseMonastery from "../assets/pemayangtse_monastery.png";

const slides = [
  {
    img: rumtekMonastery,
    title: "Rumtek Monastery",
    location: "Gangtok, Sikkim",
    desc: "Experience the profound tranquility of Sikkim's most iconic Tibetan spiritual sanctuary.",
  },
  {
    img: gurudongmarLake,
    title: "Gurudongmar Lake",
    location: "North Sikkim",
    desc: "Marvel at the holy, turquoise waters of one of the highest alpine lakes in the world.",
  },
  {
    img: pemayangtseMonastery,
    title: "Pemayangtse Monastery",
    location: "Pelling, Sikkim",
    desc: "Explore the timeless Buddhist heritage standing tall against the majestic Kanchenjunga peak.",
  },
];

const Hero = () => {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-slate-900">
      {/* BACKGROUND SLIDES */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            i === index ? "opacity-100 scale-100" : "opacity-0 scale-110"
          }`}
        >
          <img 
            src={slide.img} 
            alt={slide.title} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent" />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      ))}

      {/* CONTENT */}
      <div className="relative h-full max-w-7xl mx-auto px-6 flex items-center">
        <div className="max-w-2xl space-y-8 mt-20">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full text-white">
            <MapPin size={18} className="text-teal-400" />
            <span className="text-sm font-bold uppercase tracking-widest">{slides[index].location}</span>
          </div>

          <h1 className="text-6xl md:text-8xl text-white font-black leading-tight drop-shadow-2xl">
            {slides[index].title.split(' ').map((word, i) => (
              <span key={i} className={i === 0 ? "block" : "text-teal-400"}>
                {word}{' '}
              </span>
            ))}
          </h1>

          <p className="text-xl text-white/80 font-medium leading-relaxed max-w-xl">
            {slides[index].desc}
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={() => navigate("/packages")}
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-teal-900/10 active:scale-95 text-lg"
            >
              Explore Packages <ArrowRight size={20} />
            </button>
            <button
              onClick={() => navigate("/monasteries")}
              className="px-10 py-4 rounded-xl border-2 border-white/30 text-white font-bold hover:bg-white hover:text-slate-900 transition-all duration-300"
            >
              Virtual Tour
            </button>
          </div>
        </div>
      </div>

      {/* INDICATORS */}
      <div className="absolute bottom-12 left-6 right-6 max-w-7xl mx-auto px-6 flex justify-between items-end">
        <div className="flex gap-3">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 transition-all duration-500 rounded-full ${
                i === index ? "w-12 bg-teal-500" : "w-4 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
        
        <div className="hidden md:flex flex-col items-end gap-1">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Current Highlight</span>
          <span className="text-2xl font-black text-white uppercase tracking-widest">{slides[index].title}</span>
        </div>
      </div>
    </section>
  );
};

export default Hero;