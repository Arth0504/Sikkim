import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock as ClockIcon, MapPin as MapPinIcon, ArrowRight as ArrowRightIcon } from "lucide-react";
import API from "../services/api";
import imgUrl from "../utils/imgUrl";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";

const PackageCoverflow = () => {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    API.get("/packages").catch(() => null).then((res) => {
      if (res?.data) setPackages(res.data.slice(0, 6));
    });
  }, []);

  if (packages.length === 0) return null;

  return (
    <section className="py-20 md:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Curated <span className="text-teal-600">Journeys</span></h2>
          <p className="text-lg text-slate-500 max-w-2xl font-medium mx-auto">Explore our handpicked spiritual and cultural experiences across the majestic Sikkim Himalayas.</p>
        </div>

        <Swiper
          effect="coverflow"
          grabCursor
          centeredSlides
          slidesPerView="auto"
          coverflowEffect={{ rotate: 20, stretch: 0, depth: 100, modifier: 1, slideShadows: false }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ clickable: true, dynamicBullets: true }}
          modules={[Autoplay, Pagination, EffectCoverflow]}
          className="!pb-20 !px-4"
        >
          {packages.map((pkg) => (
            <SwiperSlide key={pkg._id} className="!w-[320px] md:!w-[450px]">
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group h-full">
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img
                    src={imgUrl(pkg.image)}
                    alt={pkg.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.src = imgUrl(""); }}
                  />
                  <div className="absolute top-4 right-4 bg-teal-600 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-teal-900/20">
                    Featured
                  </div>
                </div>
                <div className="p-8 md:p-10">
                  <div className="flex items-center gap-6 mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <span className="flex items-center gap-1.5"><ClockIcon size={14} className="text-teal-500" /> {pkg.duration}</span>
                    <span className="flex items-center gap-1.5"><MapPinIcon size={14} className="text-teal-500" /> Sikkim</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 group-hover:text-teal-600 transition-colors">
                    {pkg.name}
                  </h3>
                  <Link
                    to={`/packages/${pkg._id}`}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0d9488] hover:bg-[#0f766e] text-white font-black uppercase tracking-[0.2em] text-xs rounded-xl transition-all duration-300 w-full"
                  >
                    Experience Now <ArrowRightIcon size={16} />
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default PackageCoverflow;
