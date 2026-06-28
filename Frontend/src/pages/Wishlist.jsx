import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, Clock, ArrowRight, Loader2, Compass } from "lucide-react";
import API from "../utils/api";
import imgUrl from "../utils/imgUrl";
import { showSuccess, showError } from "../utils/toast";
import { PackageSkeleton } from "../components/SkeletonLoader";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await API.get("/wishlist");
      setWishlist(res.data || []);
    } catch (err) {
      showError(err.response?.data?.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (packageId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await API.delete(`/wishlist/${packageId}`);
      showSuccess("Removed from Wishlist ❤️");
      setWishlist((prev) => prev.filter((item) => item.package?._id !== packageId));
      window.dispatchEvent(new Event("wishlist-update"));
    } catch (err) {
      showError(err.response?.data?.message || "Failed to remove item");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24 page-fade-in">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            My <span className="text-rose-600">Wishlist</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Your curated collection of spiritual tours and Himalayan experiences.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array(3).fill(0).map((_, i) => (
              <PackageSkeleton key={i} />
            ))}
          </div>
        ) : wishlist.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center shadow-sm space-y-6">
            <Heart className="mx-auto text-slate-200 fill-slate-50" size={56} />
            <div className="space-y-2">
              <p className="text-xl font-black text-slate-800">Your Wishlist is Empty</p>
              <p className="text-sm font-semibold text-slate-400 max-w-sm mx-auto">
                Explore our curated travel packages and click the heart icon to save your favorite tours.
              </p>
            </div>
            <Link
              to="/packages"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all shadow-md"
            >
              Explore Experiences <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlist.map((item) => {
              const pkg = item.package;
              if (!pkg) return null;
              return (
                <div
                  key={item._id}
                  onClick={() => navigate(`/packages/${pkg._id}`)}
                  className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm card-premium flex flex-col cursor-pointer group"
                >
                  {/* Image */}
                  <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                    <img
                      src={imgUrl(pkg.image)}
                      alt={pkg.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop"; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent" />
                    
                    {/* Floating Heart Button */}
                    <button
                      onClick={(e) => handleRemove(pkg._id, e)}
                      className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full text-rose-600 shadow-md hover:bg-white hover:scale-115 transition-all duration-300 border border-slate-100/50"
                      title="Remove from Wishlist"
                    >
                      <Heart size={18} className="fill-current" />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-600">
                        <Clock size={12} /> {pkg.duration}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-1">
                        {pkg.name}
                      </h3>
                      <p className="text-slate-500 text-xs font-semibold line-clamp-2 leading-relaxed">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Price</p>
                        <p className="text-2xl font-black text-slate-900">₹{pkg.price}</p>
                      </div>
                      <Link
                        to={`/booking/${pkg._id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-md"
                      >
                        Reserve
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
