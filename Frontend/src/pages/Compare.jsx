import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Star, Trash2, CheckCircle2, XCircle, ShieldAlert, Sparkles, MapPin, Compass } from "lucide-react";
import API from "../utils/api";
import imgUrl from "../utils/imgUrl";
import { showError } from "../utils/toast";

const Compare = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComparedPackages();
  }, []);

  const loadComparedPackages = async () => {
    try {
      setLoading(true);
      const saved = sessionStorage.getItem("compareList");
      const list = saved ? JSON.parse(saved) : [];

      if (list.length === 0) {
        setPackages([]);
        setLoading(false);
        return;
      }

      // Fetch the full details from backend just to be fresh and have latest values
      const res = await API.get("/packages");
      const filtered = res.data.filter(p => list.some(item => item._id === p._id));
      setPackages(filtered);

      // Log comparison on backend
      const packageIds = filtered.map(p => p._id);
      if (packageIds.length > 0) {
        await API.post("/packages/compare-log", { packageIds });
      }

      // Fetch ratings for all compared packages
      const ratingsData = {};
      await Promise.all(
        filtered.map(async (p) => {
          try {
            const reviewsRes = await API.get(`/reviews/package/${p._id}`);
            ratingsData[p._id] = {
              avgRating: reviewsRes.data.avgRating || 0,
              totalReviews: reviewsRes.data.totalReviews || 0
            };
          } catch {
            ratingsData[p._id] = { avgRating: 0, totalReviews: 0 };
          }
        })
      );
      setRatings(ratingsData);
    } catch (err) {
      showError("Failed to load compared packages");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (id) => {
    const updated = packages.filter(p => p._id !== id);
    setPackages(updated);
    sessionStorage.setItem("compareList", JSON.stringify(updated));
    window.dispatchEvent(new Event("wishlist-update")); // trigger navbar refresh if needed
  };

  // Helper to extract locations from itinerary
  const getLocations = (pkg) => {
    if (pkg.itinerary && pkg.itinerary.length > 0) {
      const locs = pkg.itinerary.map(item => item.location).filter(Boolean);
      const uniqueLocs = [...new Set(locs)];
      return uniqueLocs.join(", ") || "Sikkim";
    }
    return "Sikkim";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-20">
        <div className="animate-spin text-indigo-600 w-10 h-10 border-4 border-current border-t-transparent rounded-full" />
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 pb-24 flex flex-col items-center justify-center px-6">
        <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center shadow-sm max-w-lg space-y-6">
          <ShieldAlert className="mx-auto text-slate-300" size={56} />
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800">No Packages Selected</h2>
            <p className="text-sm font-semibold text-slate-400">
              Please go back to the packages list and select at least two packages to compare side-by-side.
            </p>
          </div>
          <Link
            to="/packages"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all shadow-md cursor-pointer"
          >
            Explore Packages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Back link */}
        <button 
          onClick={() => navigate("/packages")}
          className="flex items-center gap-2 text-slate-500 font-bold uppercase tracking-widest text-xs mb-8 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Packages
        </button>

        {/* Title */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2">Package <span className="text-indigo-600">Comparison</span></h1>
          <p className="text-slate-500 font-medium">Compare side-by-side attributes to find the perfect Himalayan journey.</p>
        </div>

        {/* Comparison Desktop Grid */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden p-6 md:p-10">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="w-64 text-left font-black text-slate-400 uppercase tracking-widest text-[10px] pb-8 pr-6">Specifications</th>
                  {packages.map((pkg) => (
                    <th key={pkg._id} className="text-left pb-8 px-6 align-top min-w-[280px]">
                      <div className="relative group space-y-4">
                        <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-slate-50 shadow-sm relative">
                          <img 
                            src={imgUrl(pkg.image)} 
                            alt={pkg.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop"; }}
                          />
                          <button
                            onClick={() => handleRemove(pkg._id)}
                            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-slate-500 hover:text-red-500 transition-colors shadow-md border border-slate-100 cursor-pointer"
                            title="Remove from comparison"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-black text-slate-900 text-lg leading-tight line-clamp-1">{pkg.name}</h3>
                          <div className="flex items-center gap-1 text-xs text-amber-500">
                            <Star className="fill-current" size={14} />
                            <span className="font-bold">{ratings[pkg._id]?.avgRating || "0.0"}</span>
                            <span className="text-slate-400 font-semibold">({ratings[pkg._id]?.totalReviews || 0} reviews)</span>
                          </div>
                        </div>
                      </div>
                    </th>
                  ))}
                  {/* Empty state padding if comparing less than 3 */}
                  {packages.length < 3 && Array.from({ length: 3 - packages.length }).map((_, idx) => (
                    <th key={`empty-${idx}`} className="text-left pb-8 px-6 min-w-[280px]">
                      <div className="h-full border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-3 min-h-[180px]">
                        <Compass className="text-slate-300 animate-pulse" size={28} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add Another Package</p>
                        <Link to="/packages" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Add</Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-sm font-semibold">
                
                {/* Price */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="font-black text-slate-900 uppercase tracking-wider text-[10px] py-6 pr-6">Price</td>
                  {packages.map((pkg) => (
                    <td key={pkg._id} className="py-6 px-6 font-black text-2xl text-slate-900">
                      ₹{pkg.price}
                      <span className="text-[10px] text-slate-400 block tracking-widest font-black uppercase mt-1">Per Traveler</span>
                    </td>
                  ))}
                  {packages.length < 3 && Array.from({ length: 3 - packages.length }).map((_, idx) => <td key={`empty-price-${idx}`} className="py-6 px-6" />)}
                </tr>

                {/* Duration */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="font-black text-slate-900 uppercase tracking-wider text-[10px] py-6 pr-6">Duration</td>
                  {packages.map((pkg) => (
                    <td key={pkg._id} className="py-6 px-6 font-bold text-slate-800">{pkg.duration}</td>
                  ))}
                  {packages.length < 3 && Array.from({ length: 3 - packages.length }).map((_, idx) => <td key={`empty-dur-${idx}`} className="py-6 px-6" />)}
                </tr>

                {/* Location */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="font-black text-slate-900 uppercase tracking-wider text-[10px] py-6 pr-6">Location coverage</td>
                  {packages.map((pkg) => (
                    <td key={pkg._id} className="py-6 px-6 font-semibold text-slate-600 max-w-[280px] break-words">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="text-teal-500 shrink-0 mt-0.5" size={14} />
                        <span>{getLocations(pkg)}</span>
                      </div>
                    </td>
                  ))}
                  {packages.length < 3 && Array.from({ length: 3 - packages.length }).map((_, idx) => <td key={`empty-loc-${idx}`} className="py-6 px-6" />)}
                </tr>

                {/* Difficulty */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="font-black text-slate-900 uppercase tracking-wider text-[10px] py-6 pr-6">Difficulty level</td>
                  {packages.map((pkg) => (
                    <td key={pkg._id} className="py-6 px-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        pkg.difficulty === "Hard" || pkg.difficulty === "Difficult" ? "bg-red-50 text-red-600 border border-red-200" :
                        pkg.difficulty === "Easy" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                        "bg-blue-50 text-blue-600 border border-blue-200"
                      }`}>
                        {pkg.difficulty || "Moderate"}
                      </span>
                    </td>
                  ))}
                  {packages.length < 3 && Array.from({ length: 3 - packages.length }).map((_, idx) => <td key={`empty-diff-${idx}`} className="py-6 px-6" />)}
                </tr>

                {/* Accommodation */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="font-black text-slate-900 uppercase tracking-wider text-[10px] py-6 pr-6">Accommodation</td>
                  {packages.map((pkg) => (
                    <td key={pkg._id} className="py-6 px-6 text-slate-600 font-medium">{pkg.accommodation || "Standard Hotel / Guest House"}</td>
                  ))}
                  {packages.length < 3 && Array.from({ length: 3 - packages.length }).map((_, idx) => <td key={`empty-acco-${idx}`} className="py-6 px-6" />)}
                </tr>

                {/* Meals */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="font-black text-slate-900 uppercase tracking-wider text-[10px] py-6 pr-6">Meals provided</td>
                  {packages.map((pkg) => (
                    <td key={pkg._id} className="py-6 px-6 text-slate-600 font-medium">{pkg.meals || "Breakfast Included"}</td>
                  ))}
                  {packages.length < 3 && Array.from({ length: 3 - packages.length }).map((_, idx) => <td key={`empty-meals-${idx}`} className="py-6 px-6" />)}
                </tr>

                {/* Transport */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="font-black text-slate-900 uppercase tracking-wider text-[10px] py-6 pr-6">Transport</td>
                  {packages.map((pkg) => (
                    <td key={pkg._id} className="py-6 px-6 text-slate-600 font-medium">{pkg.transport || "Shared SUV / Cab"}</td>
                  ))}
                  {packages.length < 3 && Array.from({ length: 3 - packages.length }).map((_, idx) => <td key={`empty-trans-${idx}`} className="py-6 px-6" />)}
                </tr>

                {/* Inclusions */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="font-black text-slate-900 uppercase tracking-wider text-[10px] py-6 pr-6">Inclusions</td>
                  {packages.map((pkg) => (
                    <td key={pkg._id} className="py-6 px-6 align-top">
                      <ul className="space-y-1.5">
                        {(pkg.inclusions || ["Accommodation", "Breakfast", "Sightseeing", "Permits"]).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-600 font-medium">
                            <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={14} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                  {packages.length < 3 && Array.from({ length: 3 - packages.length }).map((_, idx) => <td key={`empty-inc-${idx}`} className="py-6 px-6" />)}
                </tr>

                {/* Exclusions */}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="font-black text-slate-900 uppercase tracking-wider text-[10px] py-6 pr-6">Exclusions</td>
                  {packages.map((pkg) => (
                    <td key={pkg._id} className="py-6 px-6 align-top">
                      <ul className="space-y-1.5">
                        {(pkg.exclusions || ["Lunch & Dinner", "Personal Expenses", "Tips"]).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-500 font-medium">
                            <XCircle className="text-red-400 shrink-0 mt-0.5" size={14} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                  {packages.length < 3 && Array.from({ length: 3 - packages.length }).map((_, idx) => <td key={`empty-exc-${idx}`} className="py-6 px-6" />)}
                </tr>

                {/* Action CTA */}
                <tr>
                  <td className="py-8 pr-6" />
                  {packages.map((pkg) => (
                    <td key={pkg._id} className="py-8 px-6">
                      <Link
                        to={`/booking/${pkg._id}`}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer text-center"
                      >
                        Reserve Now
                      </Link>
                    </td>
                  ))}
                  {packages.length < 3 && Array.from({ length: 3 - packages.length }).map((_, idx) => <td key={`empty-action-${idx}`} className="py-8 px-6" />)}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Compare;
