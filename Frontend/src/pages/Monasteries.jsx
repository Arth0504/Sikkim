import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, ArrowRight, Loader2, Compass, Search, SlidersHorizontal } from "lucide-react";
import API from "../services/api";
import imgUrl from "../utils/imgUrl";
import { MonasterySkeleton } from "../components/SkeletonLoader";

const Monasteries = () => {
  const [monasteries, setMonasteries] = useState([]);
  const [filteredMonasteries, setFilteredMonasteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Search & Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [tourFilter, setTourFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");

  useEffect(() => {
    API.get("/monasteries")
      .then((res) => {
        const data = res.data || [];
        setMonasteries(data);
        setFilteredMonasteries(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Filter and Sort execution
  useEffect(() => {
    let result = [...monasteries];

    // 1. Search Term (Name, Location, History, Rules/Description)
    if (searchTerm.trim() !== "") {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(m => {
        const nameMatch = m.name?.toLowerCase().includes(q);
        const locationMatch = m.location?.toLowerCase().includes(q);
        const historyMatch = m.history?.toLowerCase().includes(q);
        const rulesMatch = m.rules?.toLowerCase().includes(q);
        const descMatch = m.description?.toLowerCase().includes(q);
        
        return nameMatch || locationMatch || historyMatch || rulesMatch || descMatch;
      });
    }

    // 2. Location Filter (North Sikkim, South Sikkim, East Sikkim, West Sikkim)
    if (locationFilter !== "all") {
      result = result.filter(m => 
        m.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // 3. Has 360 Tour Filter
    if (tourFilter !== "all") {
      result = result.filter(m => {
        const hasTour = m.iframe360 && m.iframe360.trim() !== "";
        return tourFilter === "yes" ? hasTour : !hasTour;
      });
    }

    // 4. Featured Filter (Featured / All)
    if (featuredFilter !== "all") {
      result = result.filter(m => m.featured === true || m.isFeatured === true);
    }

    // 5. Sorting (A-Z, Z-A, Newest, Oldest)
    result.sort((a, b) => {
      if (sortOption === "az") {
        return (a.name || "").localeCompare(b.name || "");
      }
      if (sortOption === "za") {
        return (b.name || "").localeCompare(a.name || "");
      }
      if (sortOption === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortOption === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      return 0;
    });

    setFilteredMonasteries(result);
  }, [monasteries, searchTerm, locationFilter, tourFilter, featuredFilter, sortOption]);

  const clearFilters = () => {
    setSearchTerm("");
    setLocationFilter("all");
    setTourFilter("all");
    setFeaturedFilter("all");
    setSortOption("newest");
  };

  // No early screen loader, content renders with grid skeletons

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24 page-fade-in">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl space-y-4">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <Compass size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2">Sacred <span className="text-teal-600">Sanctuaries</span></h1>
            <p className="text-slate-500 font-medium">Explore the spiritual heart of the Himalayas through Sikkim's most revered monasteries.</p>
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
              placeholder="Search monastery name, location, history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:border-teal-500 focus:bg-white text-slate-900 placeholder:text-slate-400 font-medium transition-all"
            />
          </div>

          {/* Collapsible Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-slate-100 animate-fade-in">
              
              {/* Location */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location</label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="all">All Districts</option>
                  <option value="North Sikkim">North Sikkim</option>
                  <option value="South Sikkim">South Sikkim</option>
                  <option value="East Sikkim">East Sikkim</option>
                  <option value="West Sikkim">West Sikkim</option>
                </select>
              </div>

              {/* 360 Tour */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">360° Virtual Tour</label>
                <select
                  value={tourFilter}
                  onChange={(e) => setTourFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="all">All Sites</option>
                  <option value="yes">Yes (Has Virtual Tour)</option>
                  <option value="no">No Virtual Tour</option>
                </select>
              </div>

              {/* Featured */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Featured / All</label>
                <select
                  value={featuredFilter}
                  onChange={(e) => setFeaturedFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="all">All Monasteries</option>
                  <option value="featured">Featured Only</option>
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
                  <option value="az">A-Z (Name)</option>
                  <option value="za">Z-A (Name)</option>
                </select>
              </div>

            </div>
          )}
        </div>

        {/* RESULT COUNT */}
        <p className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-widest">
          Showing {filteredMonasteries.length} {filteredMonasteries.length === 1 ? "Monastery" : "Monasteries"}
        </p>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {loading ? (
            Array(6).fill(0).map((_, i) => <MonasterySkeleton key={i} />)
          ) : (
            filteredMonasteries.map((m) => {
              const hasTour = m.iframe360 && m.iframe360.trim() !== "";
              return (
                <div 
                  key={m._id} 
                  className="bg-white rounded-[2rem] border border-slate-100 shadow-sm card-premium overflow-hidden group cursor-pointer flex flex-col relative h-full"
                  onClick={() => navigate(`/monasteries/${m._id}`)}
                >
                  {/* Featured / Tour badge overlay */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    {(m.featured || m.isFeatured) && (
                      <span className="bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                        Featured
                      </span>
                    )}
                    {hasTour && (
                      <span className="bg-teal-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                        360° Tour
                      </span>
                    )}
                  </div>

                  <div className="aspect-[16/11] overflow-hidden relative bg-slate-100">
                    <img 
                      src={imgUrl(m.image)} 
                      alt={m.name} 
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&fit=crop"; }}
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  </div>

                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-600 mb-3">
                    <MapPin size={12} /> {m.location}
                  </div>
                  
                  <h2 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-teal-600 transition-colors line-clamp-1">
                    {m.name}
                  </h2>
                  
                  <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3 font-medium flex-1">
                    {m.history || "Explore the profound tranquility and rich spiritual heritage of this ancient sanctuary."}
                  </p>

                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Explore Site
                    </span>
                    <ArrowRight size={20} className="text-teal-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
              )
            })
          )}
        </div>

        {/* EMPTY STATE */}
        {filteredMonasteries.length === 0 && !loading && (
          <div className="py-24 text-center bg-white rounded-[2rem] border border-slate-100 p-10 flex flex-col items-center gap-4 mt-10">
            <SlidersHorizontal size={40} className="text-slate-300 animate-bounce" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No monasteries match your search filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Monasteries;
