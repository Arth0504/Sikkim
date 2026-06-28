import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";

const reviews = [
  {
    id: 1,
    name: "Tashi Namgyal",
    location: "Sikkim, India",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80",
    comment: "Monastery360 made my spiritual journey to Sikkim unforgettable. The peace I felt at Rumtek Monastery is beyond words. Driver and guides were exceptional.",
  },
  {
    id: 2,
    name: "Sarah Jenkins",
    location: "London, United Kingdom",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80",
    comment: "An absolute dream trip! The organization was seamless, and the dynamic itinerary helped us explore hidden gems. Highly recommend the Pemayangtse tour.",
  },
  {
    id: 3,
    name: "Priya Sharma",
    location: "Delhi, India",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&q=80",
    comment: "Beautifully curated. The driver allocation was prompt, and the vehicle was very comfortable. A soul-stirring experience.",
  },
];

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % reviews.length);
    }, 6000); // Auto-slide every 6 seconds
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % reviews.length);
  };

  return (
    <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] translate-y-1/2 translate-x-1/2"></div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.25em] text-teal-400">Traveler Voices</h2>
          <h3 className="text-4xl md:text-5xl font-black tracking-tight">Voices of the Pilgrims</h3>
          <p className="text-slate-400 text-base font-medium">
            Read authentic stories and heartfelt experiences shared by travelers on our spiritual excursions.
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-[2.5rem] p-8 md:p-14 backdrop-blur-md shadow-2xl">
          <Quote className="absolute top-10 right-10 text-slate-700/30" size={80} />

          <div className="min-h-[220px] flex flex-col justify-between">
            {/* Active Testimonial Card */}
            <div className="space-y-8 transition-opacity duration-500 ease-in-out">
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: reviews[activeIndex].rating }).map((_, i) => (
                  <Star key={i} size={18} className="fill-current" />
                ))}
              </div>

              <p className="text-lg md:text-xl font-medium leading-relaxed text-slate-100 italic">
                "{reviews[activeIndex].comment}"
              </p>

              <div className="flex items-center gap-4 pt-4 border-t border-slate-700/50">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-teal-500/50 flex-shrink-0 bg-slate-700">
                  <img
                    src={reviews[activeIndex].avatar}
                    alt={reviews[activeIndex].name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop";
                    }}
                  />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">{reviews[activeIndex].name}</h4>
                  <p className="text-xs text-slate-400 font-bold tracking-wider mt-0.5">{reviews[activeIndex].location}</p>
                </div>
              </div>
            </div>

            {/* Navigation Arrows & Pagination Dots */}
            <div className="flex items-center justify-between mt-12 pt-6 border-t border-slate-700/30">
              {/* Pagination Dots */}
              <div className="flex items-center gap-2">
                {reviews.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === activeIndex ? "w-8 bg-teal-400" : "w-2 bg-slate-600 hover:bg-slate-500"
                    }`}
                  />
                ))}
              </div>

              {/* Arrow Controls */}
              <div className="flex gap-2">
                <button
                  onClick={handlePrev}
                  className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl transition-all active:scale-95 text-slate-300 hover:text-white cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNext}
                  className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl transition-all active:scale-95 text-slate-300 hover:text-white cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
