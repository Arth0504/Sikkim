import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, Check, Trash2, AlertCircle, Filter, ExternalLink, ChevronLeft, ChevronRight, CheckSquare } from "lucide-react";
import API from "../utils/api";
import { showSuccess, showError } from "../utils/toast";

const AdminNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [readFilter, setReadFilter] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, typeFilter, readFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/notifications", {
        params: {
          page: currentPage,
          limit,
          search,
          type: typeFilter,
          isRead: readFilter,
        },
      });
      setNotifications(res.data.notifications || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalNotifications(res.data.total || 0);
    } catch (err) {
      showError(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchNotifications();
  };

  const handleMarkAsRead = async (id) => {
    try {
      await API.put(`/admin/notifications/${id}/read`);
      showSuccess("Notification marked as read ✅");
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      showError(err.response?.data?.message || "Failed to mark read");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await API.put("/admin/notifications/mark-all-read");
      showSuccess("All notifications marked as read ✅");
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      showError(err.response?.data?.message || "Failed to mark all read");
    }
  };

  const handleActionClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const notificationTypes = [
    { value: "", label: "All Types" },
    { value: "NEW_USER", label: "New User Registered" },
    { value: "NEW_BOOKING", label: "New Booking Created" },
    { value: "NEW_QUERY", label: "New Support Query" },
    { value: "NEW_REVIEW", label: "New Package Review" },
    { value: "CANCELLATION_REQUEST", label: "Cancellation Request" },
    { value: "REFUND_REQUEST", label: "Refund Request" },
    { value: "FESTIVAL_REMINDER", label: "Festival Reminder Subscription" },
    { value: "SYSTEM", label: "System Notification" },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Alerts & Notifications</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">
            Track user actions, cancellation requests, refunds, reviews, and automated system reports
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-md"
        >
          <CheckSquare size={14} />
          Mark All Read
        </button>
      </div>

      {/* FILTER & SEARCH ROW */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search alerts by title/message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
          />
          <button type="submit" className="hidden"></button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Type Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2">
            <Filter size={16} className="text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-xs font-black uppercase tracking-wider text-slate-600 focus:outline-none cursor-pointer"
            >
              {notificationTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Read Status Filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2">
            <Bell size={16} className="text-slate-400" />
            <select
              value={readFilter}
              onChange={(e) => {
                setReadFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent border-none text-xs font-black uppercase tracking-wider text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="false">Unread</option>
              <option value="true">Read</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE/LIST SECTION */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center shadow-sm space-y-4">
          <AlertCircle className="mx-auto text-slate-300" size={48} />
          <p className="text-lg font-black text-slate-700">No Notifications Found</p>
          <p className="text-sm font-bold text-slate-500">
            There are no system notifications matching the current criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
                  !notif.isRead ? "bg-teal-50/10 hover:bg-teal-50/20" : "hover:bg-slate-50/50"
                }`}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${
                      !notif.isRead ? "bg-teal-50 border-teal-200 text-teal-700" : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}>
                      {notif.type.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {new Date(notif.createdAt).toLocaleDateString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </span>
                  </div>

                  <h3 className={`text-base font-black ${!notif.isRead ? "text-slate-950" : "text-slate-700"}`}>
                    {notif.title}
                  </h3>
                  <p className="text-slate-600 text-sm font-semibold max-w-3xl leading-relaxed">
                    {notif.message}
                  </p>
                  {notif.referenceId && (
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Reference ID: {notif.referenceId}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {notif.actionUrl && (
                    <button
                      onClick={() => handleActionClick(notif)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm"
                    >
                      <ExternalLink size={12} />
                      View Details
                    </button>
                  )}

                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notif._id)}
                      title="Mark as read"
                      className="p-2.5 bg-teal-50 hover:bg-teal-100 text-teal-600 rounded-xl transition-colors border border-teal-100"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION PANEL */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Showing page {currentPage} of {totalPages} ({totalNotifications} total)
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-9 h-9 rounded-xl font-black text-xs transition-colors ${
                      currentPage === i + 1
                        ? "bg-teal-600 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
