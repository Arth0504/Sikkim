import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { 
  LayoutDashboard, 
  Package, 
  Map, 
  Calendar, 
  BookOpen, 
  CreditCard, 
  Users, 
  ShieldAlert, 
  LogOut, 
  ExternalLink,
  Compass,
  MessageSquare,
  Star,
  Bell,
  FileText,
  Check,
  Truck,
  Sparkles
} from "lucide-react";
import API from "../services/api";
import { showSuccess, showError } from "../utils/toast";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/admin/login");
  };

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "AI Insights", path: "/admin/analytics", icon: <Sparkles size={18} /> },
    { name: "Custom Tour Requests", path: "/admin/custom-requests", icon: <Map size={18} /> },
    { name: "Users", path: "/admin/users", icon: <Users size={18} /> },
    { name: "Packages", path: "/admin/packages", icon: <Package size={18} /> },
    { name: "Monasteries", path: "/admin/monasteries", icon: <Compass size={18} /> },
    { name: "Festivals", path: "/admin/festivals", icon: <Calendar size={18} /> },
    { name: "Bookings", path: "/admin/bookings", icon: <BookOpen size={18} /> },
    { name: "Drivers", path: "/admin/drivers", icon: <Truck size={18} /> },
    { name: "Cancellations", path: "/admin/cancel-requests", icon: <ShieldAlert size={18} /> },
    { name: "Payments", path: "/admin/payments", icon: <CreditCard size={18} /> },
    { name: "Queries", path: "/admin/queries", icon: <MessageSquare size={18} /> },
    { name: "Reviews", path: "/admin/reviews", icon: <Star size={18} /> },
    { name: "Reminders", path: "/admin/reminders", icon: <Bell size={18} /> },
    { name: "Policy Editor", path: "/admin/policy", icon: <FileText size={18} /> },
  ];

  const fetchNotificationsSummary = async () => {
    try {
      const res = await API.get("/admin/notifications?limit=5");
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications summary:", err);
    }
  };

  useEffect(() => {
    fetchNotificationsSummary();
    const interval = setInterval(fetchNotificationsSummary, 20000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await API.put(`/admin/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      showError("Failed to mark notification as read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await API.put("/admin/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showSuccess("All notifications marked as read ✅");
    } catch (err) {
      showError("Failed to mark all as read");
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await API.put(`/admin/notifications/${notification._id}/read`);
      } catch (err) {
        console.error(err);
      }
    }
    setShowDropdown(false);
    fetchNotificationsSummary();
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 text-slate-400 flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-3 mb-10 group">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-600/20 group-hover:scale-110 transition-transform">
              <Compass size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tight leading-none">Admin</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-500 mt-1">Control Center</span>
            </div>
          </Link>

          <nav className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-2 admin-sidebar">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                  location.pathname === item.path || (item.path === "/admin/dashboard" && location.pathname === "/admin")
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20"
                    : "hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 space-y-4">
          <Link 
            to="/" 
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold hover:bg-white/5 hover:text-white transition-all"
          >
            <ExternalLink size={20} />
            Public View
          </Link>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <LogOut size={20} />
            Logout Session
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-72">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em] text-slate-400">
            <span>Administration</span>
            <span className="text-slate-200">/</span>
            <span className="text-teal-600">
              {menuItems.find(i => i.path === location.pathname || (i.path === "/admin/dashboard" && location.pathname === "/admin"))?.name || "Portal"}
            </span>
          </div>

          {/* Notification Bell & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative p-2.5 hover:bg-slate-100 rounded-full transition-colors text-slate-600 focus:outline-none"
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black leading-none border-2 border-white animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-3 w-96 bg-white border border-slate-100 rounded-[2rem] shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/75">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-800">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black rounded-md">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-bold text-teal-600 hover:text-teal-700 uppercase tracking-wider transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 font-semibold text-sm">
                      <Bell className="mx-auto text-slate-200 mb-2" size={32} />
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-4 flex items-start gap-3 hover:bg-slate-50/75 transition-colors cursor-pointer ${
                          !notif.isRead ? "bg-teal-50/25" : ""
                        }`}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <span className={`text-xs font-black leading-tight ${
                              !notif.isRead ? "text-slate-900" : "text-slate-700"
                            }`}>
                              {notif.title}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold shrink-0">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <button
                            onClick={(e) => handleMarkAsRead(notif._id, e)}
                            title="Mark as read"
                            className="p-1 text-slate-400 hover:text-teal-600 rounded-md transition-colors"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <Link
                  to="/admin/notifications"
                  onClick={() => setShowDropdown(false)}
                  className="block p-4 border-t border-slate-100 text-center text-xs font-black text-teal-600 hover:bg-slate-50/50 uppercase tracking-widest transition-colors"
                >
                  View All Notifications
                </Link>
              </div>
            )}
          </div>
        </header>

        <div className="p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
