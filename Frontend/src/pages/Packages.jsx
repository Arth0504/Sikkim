import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, MapPin, ArrowRight, Star, Loader2, Search, SlidersHorizontal, ArrowUpDown, Heart, X } from "lucide-react";
import API from "../services/api";
import imgUrl from "../utils/imgUrl";
import { showSuccess, showError } from "../utils/toast";
import { PackageSkeleton } from "../components/SkeletonLoader";

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [destFilter, setDestFilter] = useState("all");
  const [durFilter, setDurFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active"); // default: active
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  // Dynamic filter options lists
  const [destinations, setDestinations] = useState([]);
  const [durations, setDurations] = useState([]);

  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);

  const fetchWishlist = async () => {
    const token = sessionStorage.getItem("userToken");
    if (!token) return;
    try {
      const res = await API.get("/wishlist");
      setWishlist((res.data || []).map(item => item.package?._id));
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    }
  };

  const handleWishlistToggle = async (packageId, e) => {
    e.preventDefault();
    e.stopPropagation();
    const token = sessionStorage.getItem("userToken");
    if (!token) {
      showError("Please log in to add this package to your wishlist");
      navigate("/login");
      return;
    }
    try {
      const isInWish = wishlist.includes(packageId);
      if (isInWish) {
        await API.delete(`/wishlist/${packageId}`);
        setWishlist(prev => prev.filter(id => id !== packageId));
        showSuccess("Removed from Wishlist ❤️");
      } else {
        await API.post("/wishlist", { packageId });
        setWishlist(prev => [...prev, packageId]);
        showSuccess("Added to Wishlist ❤️");
      }
      window.dispatchEvent(new Event("wishlist-update"));
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update wishlist");
    }
  };

  const [compareList, setCompareList] = useState(() => {
    try {
      const saved = sessionStorage.getItem("compareList");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    sessionStorage.setItem("compareList", JSON.stringify(compareList));
  }, [compareList]);

  const handleCompareToggle = (pkg) => {
    const exists = compareList.some(item => item._id === pkg._id);
    if (exists) {
      setCompareList(prev => prev.filter(item => item._id !== pkg._id));
    } else {
      if (compareList.length >= 3) {
        showError("You can compare up to 3 packages only");
        return;
      }
      setCompareList(prev => [...prev, pkg]);
    }
  };

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await API.get("/packages");
        const data = res.data || [];
        setPackages(data);
        setFilteredPackages(data);

        // Collect unique destinations from itineraries
        const uniqueDests = new Set();
        // Collect unique durations
        const uniqueDurs = new Set();

        data.forEach(p => {
          if (p.duration) uniqueDurs.add(p.duration.trim());
          if (p.itinerary && Array.isArray(p.itinerary)) {
            p.itinerary.forEach(item => {
              if (item.location) uniqueDests.add(item.location.trim());
            });
          }
        });

        setDestinations(Array.from(uniqueDests).sort());
        setDurations(Array.from(uniqueDurs).sort());
      } catch (err) {
        console.error("Fetch packages error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
    fetchWishlist();
  }, []);

  // Filter and Sort execution
  useEffect(() => {
    let result = [...packages];

    // 1. Search Term (Name, Location, Duration)
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(p => {
        const nameMatch = p.name?.toLowerCase().includes(q);
        const durationMatch = p.duration?.toLowerCase().includes(q);
        const descMatch = p.description?.toLowerCase().includes(q);
        
        // Match locations in itinerary
        const locationMatch = p.itinerary?.some(item => 
          item.location?.toLowerCase().includes(q)
        );

        return nameMatch || durationMatch || descMatch || locationMatch;
      });
    }

    // 2. Destination Filter
    if (destFilter !== "all") {
      result = result.filter(p => 
        p.itinerary?.some(item => item.location?.trim() === destFilter)
      );
    }

    // 3. Duration Filter
    if (durFilter !== "all") {
      result = result.filter(p => p.duration?.trim() === durFilter);
    }

    // 4. Status Filter (Active / Inactive)
    if (statusFilter !== "all") {
      result = result.filter(p => {
        const isActive = p.isActive !== false; // default to true if undefined
        return statusFilter === "active" ? isActive : !isActive;
      });
    }

    // 5. Price Filters
    if (minPrice !== "") {
      result = result.filter(p => p.price >= Number(minPrice));
    }
    if (maxPrice !== "") {
      result = result.filter(p => p.price <= Number(maxPrice));
    }

    // 6. Sorting (Newest, Oldest, Price Low-High, Price High-Low)
    result.sort((a, b) => {
      if (sortOption === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortOption === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortOption === "price_low_high") {
        return a.price - b.price;
      }
      if (sortOption === "price_high_low") {
        return b.price - a.price;
      }
      return 0;
    });

    setFilteredPackages(result);
  }, [packages, searchTerm, destFilter, durFilter, statusFilter, minPrice, maxPrice, sortOption]);

  const clearFilters = () => {
    setSearchTerm("");
    setDestFilter("all");
    setDurFilter("all");
    setStatusFilter("active");
    setMinPrice("");
    setMaxPrice("");
    setSortOption("newest");
  };

  // No early screen loader, content renders with grid skeletons

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24 page-fade-in">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2">Tour <span className="text-teal-600">Packages</span></h1>
            <p className="text-slate-500 font-medium">Carefully curated itineraries that blend spiritual depth with the breathtaking natural beauty of the Himalayas.</p>
          </div>
          
          {/* Controls Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-5 py-3 border rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer ${
                showFilters 
                  ? "bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-600/20" 
                  : "bg-white border-slate-200 text-slate-600 hover:border-teal-500"
              }`}
            >
              <SlidersHorizontal size={16} />
              {showFilters ? "Hide Filters" : "Filters"}
            </button>
            
            {showFilters && (
              <button
                onClick={clearFilters}
                className="px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* SEARCH & FILTERS CONTAINER */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm mb-10 space-y-6">
          {/* Main Search */}
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search package name, location, duration..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:border-teal-500 focus:bg-white text-slate-900 placeholder:text-slate-400 font-medium transition-all"
            />
          </div>

          {/* Collapsible Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 pt-6 border-t border-slate-100">
              
              {/* Destination */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Destination</label>
                <select
                  value={destFilter}
                  onChange={(e) => setDestFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="all">All Locations</option>
                  {destinations.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duration</label>
                <select
                  value={durFilter}
                  onChange={(e) => setDurFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="all">All Durations</option>
                  {durations.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="all">All Packages</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Price Range (Min - Max)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 placeholder:text-slate-400"
                  />
                  <span className="text-slate-300">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Sort Options */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sort By</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="newest">Newest Packages</option>
                  <option value="oldest">Oldest Packages</option>
                  <option value="price_low_high">Price: Low to High</option>
                  <option value="price_high_low">Price: High to Low</option>
                </select>
              </div>

            </div>
          )}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading ? (
            Array(6).fill(0).map((_, i) => <PackageSkeleton key={i} />)
          ) : (
            filteredPackages.map((pkg) => (
              <div key={pkg._id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm card-premium overflow-hidden group flex flex-col h-full relative">
                
                {/* Inactive tag overlay */}
                {pkg.isActive === false && (
                  <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                    Inactive
                  </div>
                )}

                <div className="aspect-[16/11] overflow-hidden relative bg-slate-100">
                  {/* Floating Heart Button */}
                  <button
                    onClick={(e) => handleWishlistToggle(pkg._id, e)}
                    className={`absolute z-10 p-3 bg-white/95 backdrop-blur-sm rounded-full shadow-md transition-all duration-300 border border-slate-100/50 cursor-pointer ${
                      pkg.isActive === false ? "top-14 left-4" : "top-4 left-4"
                    } ${
                      wishlist.includes(pkg._id) ? "text-rose-600 scale-110" : "text-slate-400 hover:text-rose-600 hover:scale-110"
                    }`}
                    title={wishlist.includes(pkg._id) ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    <Heart size={16} className={wishlist.includes(pkg._id) ? "fill-current" : ""} />
                  </button>

                  <img 
                    src={imgUrl(pkg.image)} 
                    alt={pkg.name} 
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop"; }}
                  />
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
                    <p className="text-lg font-black text-slate-900 leading-none">₹{pkg.price}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-6 mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <Clock size={16} className="text-teal-500" />
                    {pkg.duration}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <MapPin size={16} className="text-teal-500" />
                    Sikkim
                  </div>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-teal-600 transition-colors line-clamp-1">
                  {pkg.name}
                </h3>
                
                <p className="text-slate-500 font-medium leading-relaxed mb-4 line-clamp-2">
                  {pkg.description}
                </p>

                {/* Compare Toggle Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCompareToggle(pkg);
                  }}
                  className={`w-full py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer mb-6 ${
                    compareList.some(item => item._id === pkg._id)
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10"
                      : "bg-white border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-600"
                  }`}
                >
                  {compareList.some(item => item._id === pkg._id) ? "Comparing" : "Compare"}
                </button>

                <div className="mt-auto flex items-center gap-3">
                  <Link 
                    to={`/packages/${pkg._id}`} 
                    className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-all duration-300 text-xs uppercase tracking-widest shadow-lg shadow-teal-900/10 active:scale-95 text-center"
                  >
                    View Details
                  </Link>
                  <Link 
                    to={`/booking/${pkg._id}`} 
                    className="w-12 h-12 bg-slate-100 hover:bg-teal-600 hover:text-white rounded-xl flex items-center justify-center transition-all duration-300 text-slate-700"
                  >
                    <ArrowRight size={20} />
                  </Link>
                </div>
              </div>
            </div>
          ))
          )}
        </div>

        {filteredPackages.length === 0 && !loading && (
          <div className="py-24 text-center bg-white rounded-3xl border border-slate-100 p-10 flex flex-col items-center gap-4 mt-10">
            <SlidersHorizontal size={40} className="text-slate-300 animate-bounce" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No packages match your search filters.</p>
          </div>
        )}
      </div>

      {/* Floating Compare Drawer */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-6 shadow-2xl z-40 flex flex-col md:flex-row items-center gap-6 border border-slate-800/80 animate-in fade-in slide-in-from-bottom-10 max-w-[90vw] md:max-w-3xl w-full">
          <div className="flex-1">
            <h4 className="text-sm font-black tracking-wide">Compare Packages</h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{compareList.length} of 3 packages selected</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex gap-2 flex-wrap items-center">
              {compareList.map(item => (
                <div key={item._id} className="bg-slate-800 border border-slate-700/50 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-bold">
                  <span className="truncate max-w-[100px]">{item.name}</span>
                  <button onClick={() => setCompareList(prev => prev.filter(p => p._id !== item._id))} className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/compare")}
              className="ml-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer shrink-0"
            >
              Compare Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;