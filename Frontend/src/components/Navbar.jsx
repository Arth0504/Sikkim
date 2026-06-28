import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { logout } from "../utils/auth";
import { Menu, X, Compass, User, LogOut, Heart } from "lucide-react";
import API from "../utils/api";

const Navbar = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const role = sessionStorage.getItem("role");
  const token = sessionStorage.getItem("userToken") || sessionStorage.getItem("adminToken");

  const [wishlistCount, setWishlistCount] = useState(0);

  const fetchWishlistCount = async () => {
    if (!token || role !== "user") return;
    try {
      const res = await API.get("/wishlist");
      setWishlistCount(res.data?.length || 0);
    } catch (err) {
      console.error("Failed to load wishlist count:", err);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetchWishlistCount();
    const handleUpdate = () => fetchWishlistCount();
    window.addEventListener("wishlist-update", handleUpdate);
    return () => window.removeEventListener("wishlist-update", handleUpdate);
  }, [token, role]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Packages", path: "/packages" },
    { name: "Custom Tour", path: "/custom-builder" },
    { name: "Festivals", path: "/festivals" },
    { name: "Monasteries", path: "/monasteries" },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      scrolled ? "bg-white/95 backdrop-blur-md shadow-sm py-4" : "bg-transparent py-6"
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between w-full">
        {/* LOGO */}
        <div className="flex items-center lg:flex-1 justify-start">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-600/20 group-hover:scale-110 transition-transform">
              <Compass size={24} />
            </div>
            <span className={`text-2xl font-black tracking-tight ${scrolled ? "text-slate-900" : "text-white"}`}>
              Monastery<span className="text-teal-600">360</span>
            </span>
          </Link>
        </div>

        {/* DESKTOP LINKS */}
        <div className="hidden lg:flex items-center justify-center gap-[36px] mx-[64px] flex-shrink-0 whitespace-nowrap">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative text-sm font-bold uppercase tracking-widest transition-colors py-2 group ${
                location.pathname === link.path 
                  ? "text-teal-600 font-extrabold" 
                  : (scrolled ? "text-slate-600 hover:text-teal-600" : "text-white/80 hover:text-white")
              }`}
            >
              {link.name}
              <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-teal-600 transition-transform duration-300 origin-left ${
                location.pathname === link.path ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              }`} />
            </Link>
          ))}
          {role === "admin" && (
            <Link to="/admin/dashboard" className="text-sm font-bold uppercase tracking-widest text-teal-600">
              Admin
            </Link>
          )}
        </div>

        {/* ACTIONS */}
        <div className="hidden lg:flex items-center justify-end gap-5 lg:flex-1 flex-shrink-0 whitespace-nowrap">
          {!token ? (
            <>
              <Link to="/login" className={`px-6 py-2.5 text-sm font-bold uppercase tracking-widest rounded-xl transition-all ${
                scrolled ? "text-slate-900 hover:bg-slate-100" : "text-white hover:bg-white/10"
              }`}>
                Login
              </Link>
              <Link to="/register" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-sm font-bold uppercase tracking-widest rounded-xl transition-all duration-300 shadow-lg shadow-teal-900/10 active:scale-95">
                Register
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-4">
              {role === "user" && (
                <>
                  <Link to="/wishlist" className={`px-5 py-2.5 text-sm font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${
                    scrolled ? "text-slate-900 hover:bg-slate-100" : "text-white hover:bg-white/10"
                  }`}>
                    <Heart size={16} className="text-rose-500 fill-current" />
                    <span>Wishlist</span>
                    {wishlistCount > 0 && (
                      <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full scale-90">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/my-bookings" className={`px-5 py-2.5 text-sm font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 ${
                    scrolled ? "text-slate-900 hover:bg-slate-100" : "text-white hover:bg-white/10"
                  }`}>
                    <User size={18} /> My Bookings
                  </Link>
                </>
              )}
              <button 
                onClick={logout} 
                className={`p-2.5 rounded-xl transition-all ${
                  scrolled ? "text-slate-400 hover:text-red-500 hover:bg-red-50" : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)} 
          className={`lg:hidden p-2 rounded-xl ${scrolled ? "text-slate-900" : "text-white"}`}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      <div className={`fixed inset-0 bg-white z-[60] lg:hidden transition-transform duration-500 ${
        menuOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-12">
            <span className="text-2xl font-black text-slate-900">Menu</span>
            <button onClick={() => setMenuOpen(false)} className="p-2 text-slate-900">
              <X size={32} />
            </button>
          </div>

          <div className="flex flex-col gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className="text-2xl font-black text-slate-900 hover:text-teal-600 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="mt-auto pt-8 border-t border-slate-100 flex flex-col gap-4">
            {!token ? (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="w-full py-4 text-center font-bold text-slate-900 rounded-2xl bg-slate-50">
                  Login
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-2xl transition-all duration-300 w-full">
                  Get Started
                </Link>
              </>
            ) : (
              <button onClick={() => { logout(); setMenuOpen(false); }} className="w-full py-4 text-center font-bold text-red-600 rounded-2xl bg-red-50">
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;