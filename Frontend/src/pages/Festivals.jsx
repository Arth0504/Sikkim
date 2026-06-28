import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ArrowRight, Loader2, Calendar, Search, SlidersHorizontal } from "lucide-react";
import API from "../services/api";
import imgUrl from "../utils/imgUrl";
import { FestivalSkeleton } from "../components/SkeletonLoader";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const monthOrderMap = {
  "January": 0, "February": 1, "March": 2, "April": 3, "May": 4, "June": 5,
  "July": 6, "August": 7, "September": 8, "October": 9, "November": 10, "December": 11
};

const Festivals = () => {
  const [festivals, setFestivals] = useState([]);
  const [filteredFestivals, setFilteredFestivals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");

  // Dynamic filter options lists
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    API.get("/festivals")
      .then((res) => {
        const data = res.data || [];
        setFestivals(data);
        setFilteredFestivals(data);

        // Collect unique locations dynamically
        const uniqueLocs = new Set();
        data.forEach(f => {
          if (f.location) uniqueLocs.add(f.location.trim());
        });
        setLocations(Array.from(uniqueLocs).sort());

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter and Sort execution
  useEffect(() => {
    let result = [...festivals];

    // 1. Search Term (Name, Location, Description)
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(f => {
        const nameMatch = f.name?.toLowerCase().includes(q);
        const locationMatch = f.location?.toLowerCase().includes(q);
        const descMatch = f.description?.toLowerCase().includes(q);
        
        return nameMatch || locationMatch || descMatch;
      });
    }

    // 2. Month Filter
    if (monthFilter !== "all") {
      result = result.filter(f => f.month === monthFilter);
    }

    // 3. Category Filter
    if (categoryFilter !== "all") {
      result = result.filter(f => f.category?.toLowerCase() === categoryFilter.toLowerCase());
    }

    // 4. Location Filter
    if (locationFilter !== "all") {
      result = result.filter(f => f.location?.trim() === locationFilter);
    }

    // 5. Sorting (A-Z, Z-A, Month Order, Newest, Oldest)
    result.sort((a, b) => {
      if (sortOption === "az") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortOption === "za") {
        return (b.name || "").localeCompare(a.name || "");
      }
      if (sortOption === "month") {
        const monthA = monthOrderMap[a.month] !== undefined ? monthOrderMap[a.month] : 99;
        const monthB = monthOrderMap[b.month] !== undefined ? monthOrderMap[b.month] : 99;
        return monthA - monthB;
      }
      if (sortOption === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortOption === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      return 0;
    });

    setFilteredFestivals(result);
  }, [festivals, searchTerm, monthFilter, categoryFilter, locationFilter, sortOption]);

  const clearFilters = () => {
    setSearchTerm("");
    setMonthFilter("all");
    setCategoryFilter("all");
    setLocationFilter("all");
    setSortOption("newest");
  };

  // No early screen loader, content renders with grid skeletons

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24 page-fade-in">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2">Cultural <span className="text-teal-600">Festivals</span></h1>
            <p className="text-slate-500 font-medium">Witness the vibrant colors, rhythmic dances, and ancient spiritual traditions of the Sikkim Himalayas.</p>
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
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* SEARCH & FILTERS CONTAINER */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm mb-6 space-y-6">
          {/* Main Search */}
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search festival name, location, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:border-teal-500 focus:bg-white text-slate-900 placeholder:text-slate-400 font-medium transition-all"
            />
          </div>

          {/* Collapsible Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-slate-100 animate-fade-in">
              
              {/* Month */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Month</label>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="all">All Months</option>
                  {MONTHS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="cultural">Cultural</option>
                  <option value="religious">Religious</option>
                  <option value="traditional">Traditional</option>
                  <option value="tourism">Tourism</option>
                  <option value="national">National</option>
                </select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location</label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="all">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sort By</label>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="newest">Newest Added</option>
                  <option value="oldest">Oldest Added</option>
                  <option value="az">A-Z (Alphabetical)</option>
                  <option value="za">Z-A (Alphabetical)</option>
                  <option value="month">Month Order (Jan → Dec)</option>
                </select>
              </div>

            </div>
          )}
        </div>

        {/* RESULT COUNT */}
        <p className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-widest">
          Showing {filteredFestivals.length} {filteredFestivals.length === 1 ? "Festival" : "Festivals"}
        </p>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading ? (
            Array(6).fill(0).map((_, i) => <FestivalSkeleton key={i} />)
          ) : (
            filteredFestivals.map((f) => (
              <div key={f._id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm card-premium overflow-hidden group flex flex-col h-full relative">
                <div className="h-[250px] relative overflow-hidden rounded-t-[2rem] bg-slate-100">
                  <img
                    src={imgUrl(f.image)}
                    alt={f.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=800&fit=crop"; }}
                  />
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-lg flex items-center gap-1.5">
                  <Calendar size={12} className="text-teal-600" />
                  {f.month}
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-600 mb-3">
                  <MapPin size={12} /> {f.location}
                </div>
                
                <h2 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-teal-600 transition-colors line-clamp-1">
                  {f.name}
                </h2>
                
                <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3 font-medium flex-1">
                  {f.description || "Experience the profound tranquility and rich spiritual heritage of this ancient celebration."}
                </p>
                
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-md">
                    {f.category || "Religious"}
                  </span>
                  <Link
                    to={`/festivals/${f._id}`}
                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-teal-600 hover:gap-3 transition-all"
                  >
                    Read More <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))
          )}
        </div>

        {/* EMPTY STATE */}
        {filteredFestivals.length === 0 && !loading && (
          <div className="py-24 text-center bg-white rounded-[2rem] border border-slate-100 p-10 flex flex-col items-center gap-4 mt-10">
            <SlidersHorizontal size={40} className="text-slate-300 animate-bounce" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No festivals match your search filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Festivals;
