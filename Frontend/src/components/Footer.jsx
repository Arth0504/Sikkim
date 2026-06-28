import { Link } from "react-router-dom";
import { Compass, Mail, Phone, MapPin } from "lucide-react";
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-slate-900 pt-24 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-16 mb-20">
          {/* BRAND */}
          <div className="space-y-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-600/20 group-hover:scale-110 transition-transform">
                <Compass size={24} />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Monastery<span className="text-teal-600">360</span>
              </span>
            </Link>
            <p className="text-sm font-medium leading-relaxed">
              We bridge the gap between ancient traditions and modern explorers, offering a soulful window into the sacred heritage of Sikkim.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-teal-600 hover:text-white transition-all">
                <FaInstagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-teal-600 hover:text-white transition-all">
                <FaFacebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-teal-600 hover:text-white transition-all">
                <FaTwitter size={18} />
              </a>
            </div>
          </div>

          {/* EXPLORE */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-8">Discovery</h4>
            <ul className="space-y-4">
              {["Packages", "Monasteries", "Festivals", "Virtual Tours"].map((item) => (
                <li key={item}>
                  <Link to={`/${item.toLowerCase().replace(" ", "-")}`} className="text-sm font-bold hover:text-teal-500 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* SUPPORT */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-8">Support</h4>
            <ul className="space-y-4">
              {[
                { name: "Cancellation Policy", path: "/cancellation-policy" },
                { name: "Travel Insurance", path: "/travel-insurance" },
                { name: "Privacy Policy", path: "/privacy-policy" },
                { name: "Terms of Service", path: "/terms-of-service" }
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.path} className="text-sm font-bold hover:text-teal-500 transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-8">Get in Touch</h4>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <MapPin size={20} className="text-teal-600 shrink-0" />
                <span className="text-sm font-bold">Gangtok, Sikkim, India</span>
              </li>
              <li className="flex gap-4">
                <Phone size={20} className="text-teal-600 shrink-0" />
                <span className="text-sm font-bold">+91 00000 00000</span>
              </li>
              <li className="flex gap-4">
                <Mail size={20} className="text-teal-600 shrink-0" />
                <span className="text-sm font-bold">hello@monastery360.com</span>
              </li>
            </ul>
          </div>

          {/* MENTOR & SUPPORTED BY */}
          <div className="space-y-8">
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-8">Project Mentor</h4>
              <p className="text-sm font-bold text-white">Dr. Sejal Haveliwala</p>
              <p className="text-xs text-slate-500 font-medium">Faculty Mentor</p>
            </div>
            <div className="pt-6 border-t border-white/5">
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white mb-4">Supported By</h4>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-600/10 flex items-center justify-center text-teal-400 font-black text-xs shrink-0 border border-teal-500/20">
                  LB
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-tight">LB Infotech</p>
                  <p className="text-[10px] text-teal-500 font-bold tracking-widest mt-0.5">Tech Partner</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            &copy; 2024 Monastery360. Developed by LB Infotech.
          </p>
          <div className="flex gap-8">
            <Link to="/admin/login" className="text-xs font-black uppercase tracking-widest text-slate-600 hover:text-teal-500 transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
