import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Compass, 
  Calendar, 
  CheckSquare, 
  XSquare, 
  CreditCard, 
  FileText, 
  LogOut,
  Settings,
  MessageSquare,
  Star,
  Bell,
  Truck,
  Sparkles,
  Map
} from "lucide-react";
import { showSuccess } from "../utils/toast";
import API from "../services/api";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const [newQueriesCount, setNewQueriesCount] = useState(0);

  useEffect(() => {
    const fetchNewQueriesCount = () => {
      API.get("/admin/queries")
        .then((res) => {
          const count = res.data.filter((q) => q.status === "NEW").length;
          setNewQueriesCount(count);
        })
        .catch(() => null);
    };

    fetchNewQueriesCount();
    const interval = setInterval(fetchNewQueriesCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("role");
    showSuccess("Admin logged out ✅");
    navigate("/admin/login");
  };

  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/admin/analytics", icon: Sparkles, label: "AI Insights" },
    { to: "/admin/custom-requests", icon: Map, label: "Custom Requests" },
    { to: "/admin/users", icon: Users, label: "User Management" },
    { to: "/admin/packages", icon: Package, label: "Tour Packages" },
    { to: "/admin/monasteries", icon: Compass, label: "Monasteries" },
    { to: "/admin/festivals", icon: Calendar, label: "Festivals" },
    { to: "/admin/bookings", icon: CheckSquare, label: "All Bookings" },
    { to: "/admin/drivers", icon: Truck, label: "Driver Management" },
    { to: "/admin/cancel-requests", icon: XSquare, label: "Cancel Requests" },
    { to: "/admin/payments", icon: CreditCard, label: "Transactions" },
    { to: "/admin/queries", icon: MessageSquare, label: "User Queries" },
    { to: "/admin/reviews", icon: Star, label: "Review Moderation" },
    { to: "/admin/reminders", icon: Bell, label: "Festival Reminders" },
    { to: "/admin/policy", icon: FileText, label: "Policy Editor" },
  ];

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen shadow-sm">
      <div className="p-10">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
            <Settings size={22} className="text-white" />
          </div>
          Portal
        </h1>
      </div>

      <nav className="flex-1 px-6 space-y-2 admin-sidebar">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-4">Navigation</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm ${
                isActive
                  ? "bg-teal-600 text-white shadow-xl shadow-teal-600/20"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} />
                <span>{item.label}</span>
                {item.to === "/admin/queries" && newQueriesCount > 0 && (
                  <span className={`ml-auto px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider border transition-all ${
                    isActive ? "bg-white text-teal-600 border-white" : "bg-teal-50 border-teal-200 text-teal-700"
                  }`}>
                    {newQueriesCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 mt-auto border-t border-slate-50">
        <button 
          className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-slate-500 font-bold text-sm hover:bg-red-50 hover:text-red-600 transition-all" 
          onClick={logout}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
