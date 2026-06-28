import { useEffect, useState } from "react";
import { 
  Package, BookOpen, Map, Calendar, TrendingUp, Users, CreditCard, Loader2, 
  Activity, ShieldAlert, CheckCircle, Clock, AlertTriangle, ArrowRight,
  MessageSquare, HelpCircle, Star, Bell, Heart, FileText, Download
} from "lucide-react";
import API from "../services/api";
import { showError } from "../utils/toast";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [recentActivity, setRecentActivity] = useState({ bookings: [], payments: [] });
  const [systemHealth, setSystemHealth] = useState(null);
  const [wishlistStats, setWishlistStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, monthlyRes, recentRes, healthRes, wishlistRes] = await Promise.all([
        API.get("/admin/dashboard-stats"),
        API.get("/admin/analytics/monthly"),
        API.get("/admin/recent-activity"),
        API.get("/admin/system-health"),
        API.get("/wishlist/admin/stats")
      ]);

      setStats(statsRes.data);
      setMonthlyData(monthlyRes.data.data || []);
      setRecentActivity(recentRes.data || { bookings: [], payments: [] });
      setSystemHealth(healthRes.data);
      setWishlistStats(wishlistRes.data || []);
    } catch (err) {
      console.error("Dashboard Stats Fetch Error:", err);
      showError("Failed to fetch live dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading || !stats) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="text-teal-600 animate-spin" size={40} />
    </div>
  );

  const statCards = [
    { name: "Total Bookings", value: stats.bookings?.total || 0, icon: <BookOpen />, color: "text-blue-600", bg: "bg-blue-50", sub: `${stats.bookings?.confirmed || 0} Confirmed` },
    { name: "Total Revenue", value: `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(stats.revenue?.total || 0)}`, icon: <CreditCard />, color: "text-teal-600", bg: "bg-teal-50", sub: `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(stats.revenue?.month || 0)} this month` },
    { name: "Total Users", value: stats.counts?.users || 0, icon: <Users />, color: "text-purple-600", bg: "bg-purple-50", sub: `${stats.counts?.googleUsers || 0} Google • ${stats.counts?.otpUsers || 0} OTP Verified` },
    { name: "Monasteries", value: stats.counts?.monasteries || 0, icon: <Map />, color: "text-amber-600", bg: "bg-amber-50", sub: "Immersive 360 destinations" },
    { name: "Total Wishlists", value: stats.extraMetrics?.totalWishlists || 0, icon: <Heart className="fill-current" />, color: "text-rose-600", bg: "bg-rose-50", sub: "Saves across all packages" },
    { name: "Invoices Sent", value: stats.extraMetrics?.totalInvoices || 0, icon: <FileText />, color: "text-cyan-600", bg: "bg-cyan-50", sub: "Booking & refund statements" },
    { name: "PDF Downloads", value: stats.extraMetrics?.pdfDownloads || 0, icon: <Download />, color: "text-emerald-600", bg: "bg-emerald-50", sub: "Total receipt downloads" },
  ];

  // Max value calculation for Chart Scaling
  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue || 1), 1000);

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">Dashboard <span className="text-teal-600">Overview</span></h1>
          <p className="text-slate-500 font-medium">Real-time statistics and system performance of Monastery360.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm">
          <TrendingUp className="text-teal-600 animate-pulse" />
          <span className="text-sm font-black uppercase tracking-widest text-slate-400">Live Status</span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-8 flex flex-col items-center text-center">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{stat.name}</p>
            <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
            {stat.sub && <p className="text-[10px] font-bold text-slate-400 mt-2">{stat.sub}</p>}
          </div>
        ))}
      </div>

      {/* Cancellation & Refund Metrics */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-2">Cancellations & Refunds</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Pending Refund Requests", value: stats.refunds?.pending || 0, icon: <Clock />, color: "text-amber-600", bg: "bg-amber-50", sub: "Awaiting review" },
            { name: "Approved Refunds", value: stats.refunds?.approved || 0, icon: <CheckCircle />, color: "text-emerald-600", bg: "bg-emerald-50", sub: "Successfully processed" },
            { name: "Rejected Refunds", value: stats.refunds?.rejected || 0, icon: <AlertTriangle />, color: "text-rose-600", bg: "bg-rose-50", sub: "Declined requests" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-8 flex flex-col items-center text-center">
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                {stat.icon}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{stat.name}</p>
              <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-2">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* User Queries Analytics */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-2">User Inquiries & Queries</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { name: "Total Queries", value: stats.queries?.totalVal || 0, icon: <MessageSquare />, color: "text-blue-600", bg: "bg-blue-50", sub: "All time inquiries" },
            { name: "New Queries", value: stats.queries?.newVal || 0, icon: <HelpCircle />, color: "text-violet-600", bg: "bg-violet-50", sub: "Awaiting first view" },
            { name: "Pending Replies", value: stats.queries?.pendingVal || 0, icon: <Clock />, color: "text-amber-600", bg: "bg-amber-50", sub: "Needs administrator action" },
            { name: "Resolved Queries", value: stats.queries?.resolvedVal || 0, icon: <CheckCircle />, color: "text-emerald-600", bg: "bg-emerald-50", sub: "Closed cases" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-8 flex flex-col items-center text-center">
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                {stat.icon}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{stat.name}</p>
              <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-2">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews & Ratings Analytics */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-2">Reviews & Ratings</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {[
            { name: "Total Reviews Submitted", value: stats.reviews?.total || 0, icon: <MessageSquare />, color: "text-indigo-600", bg: "bg-indigo-50", sub: "All time user reviews" },
            { name: "Average Platform Rating", value: stats.reviews?.avgRating ? `${stats.reviews.avgRating} / 5.0` : "0.0 / 5.0", icon: <Star className="fill-current" />, color: "text-amber-600", bg: "bg-amber-50", sub: "Based on approved reviews" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-8 flex flex-col items-center text-center">
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                {stat.icon}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{stat.name}</p>
              <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-2">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* System Notifications Analytics */}
      <div className="space-y-4">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-2">System Notifications</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {[
            { name: "Total Notifications", value: stats.notifications?.total || 0, icon: <Bell />, color: "text-blue-600", bg: "bg-blue-50", sub: "All time admin alerts" },
            { name: "Unread Notifications", value: stats.notifications?.unread || 0, icon: <Bell className="animate-bounce" />, color: "text-rose-600", bg: "bg-rose-50", sub: "Requires administrator attention" },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-8 flex flex-col items-center text-center">
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                {stat.icon}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{stat.name}</p>
              <h3 className="text-3xl font-black text-slate-900">{stat.value}</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-2">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Growth Chart & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Growth Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xl font-black text-slate-900">Recent Platform Growth</h4>
            <span className="text-xs font-black uppercase tracking-widest text-teal-600">Monthly Revenue Distribution</span>
          </div>
          
          <div className="h-64 flex items-end gap-3 px-2">
            {monthlyData.map((d, i) => {
              const heightPct = Math.min(100, Math.round((d.revenue / maxRevenue) * 100));
              return (
                <div 
                  key={i} 
                  className="flex-1 bg-slate-50 rounded-t-xl relative group transition-all duration-500 hover:bg-teal-500/10 h-full flex flex-col justify-end"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
                    ₹{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(d.revenue)}
                  </div>
                  {/* Bar */}
                  <div 
                    className="w-full bg-teal-600/25 group-hover:bg-teal-600 rounded-t-xl transition-all duration-500" 
                    style={{ height: `${heightPct || 4}%` }}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex justify-between mt-6 px-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {monthlyData.map((d, i) => (
              <span key={i} className="flex-1 text-center">{d.month}</span>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10 flex flex-col justify-between">
          <div>
            <h4 className="text-xl font-black text-slate-900 mb-8">System Health</h4>
            <div className="space-y-6">
              {[
                { label: "Memory Usage", value: `${systemHealth?.metrics?.memory || 0}%`, color: "bg-teal-500" },
                { label: "CPU Load", value: `${systemHealth?.metrics?.cpu || 0}%`, color: "bg-blue-500" },
                { label: "Database Connection", value: systemHealth?.database ? "CONNECTED" : "DISCONNECTED", color: systemHealth?.database ? "bg-emerald-500" : "bg-red-500", rawVal: systemHealth?.database ? 100 : 0 }
              ].map((bar, i) => {
                const percentage = bar.rawVal !== undefined ? bar.rawVal : parseInt(bar.value);
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                      <span>{bar.label}</span>
                      <span>{bar.value}</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${bar.color} rounded-full`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-100 mt-6 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>Uptime: {systemHealth?.metrics?.uptime || "N/A"}</span>
            <span>Razorpay: {systemHealth?.razorpay ? "Active ✅" : "Missing ❌"}</span>
          </div>
        </div>
      </div>

      {/* Packages Popularity Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Booked Packages */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10">
          <h4 className="text-xl font-black text-slate-900 mb-8 flex items-center justify-between">
            Top Booked Packages
            <span className="text-xs font-black uppercase tracking-widest text-teal-600">By Reservations</span>
          </h4>
          <div className="space-y-4">
            {stats.topPackages?.length === 0 ? (
              <p className="text-slate-400 font-bold uppercase tracking-widest text-center py-10 text-xs">No booking records yet</p>
            ) : (
              stats.topPackages?.map((pkg, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{pkg.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Price: ₹{pkg.price}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-black rounded-full">
                      {pkg.count} {pkg.count === 1 ? "Book" : "Bookings"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Most Wishlisted Packages */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10">
          <h4 className="text-xl font-black text-slate-900 mb-8 flex items-center justify-between">
            Most Wishlisted Packages
            <span className="text-xs font-black uppercase tracking-widest text-rose-600">By Saves</span>
          </h4>
          <div className="space-y-4">
            {wishlistStats.length === 0 ? (
              <p className="text-slate-400 font-bold uppercase tracking-widest text-center py-10 text-xs">No wishlist records yet</p>
            ) : (
              wishlistStats.slice(0, 5).map((pkg, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{pkg.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Price: ₹{pkg.price} | Duration: {pkg.duration}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black rounded-full">
                      {pkg.wishlistCount} {pkg.wishlistCount === 1 ? "Save" : "Saves"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Most Compared Packages */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10">
          <h4 className="text-xl font-black text-slate-900 mb-8 flex items-center justify-between">
            Most Compared Packages
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600">By Comparisons</span>
          </h4>
          <div className="space-y-4">
            {!stats.mostCompared || stats.mostCompared.length === 0 ? (
              <p className="text-slate-400 font-bold uppercase tracking-widest text-center py-10 text-xs">No comparison records yet</p>
            ) : (
              stats.mostCompared.map((pkg, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{pkg.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Price: ₹{pkg.price} | Duration: {pkg.duration}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black rounded-full">
                      {pkg.compareCount || 0} {pkg.compareCount === 1 ? "Compare" : "Compares"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity: Transactions and Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xl font-black text-slate-900">Recent Transactions</h4>
            <CreditCard className="text-teal-600" size={20} />
          </div>
          <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
            {recentActivity.payments?.length === 0 ? (
              <p className="text-slate-400 font-bold uppercase tracking-widest text-center py-10 text-xs">No recent transactions</p>
            ) : (
              recentActivity.payments?.map((pay) => (
                <div key={pay._id} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{pay.booking?.package?.name || "Cash / Custom Payment"}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{pay.razorpayPaymentId || "CASH"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 text-sm">₹{pay.amount}</p>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-teal-50 border border-teal-200 text-teal-600 mt-1">
                      Success
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-xl font-black text-slate-900">Recent Bookings</h4>
            <BookOpen className="text-teal-600" size={20} />
          </div>
          <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
            {recentActivity.bookings?.length === 0 ? (
              <p className="text-slate-400 font-bold uppercase tracking-widest text-center py-10 text-xs">No recent bookings</p>
            ) : (
              recentActivity.bookings?.map((book) => (
                <div key={book._id} className="py-4 flex justify-between items-center first:pt-0 last:pb-0">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{book.firstName} {book.lastName}</p>
                    <p className="text-[10px] text-teal-600 font-black uppercase tracking-widest mt-0.5">{book.package?.name || "Trip Package"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 text-sm">₹{book.totalAmount}</p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest mt-1 border ${
                      book.bookingStatus === "confirmed" ? "bg-teal-50 border-teal-200 text-teal-600" :
                      book.bookingStatus === "cancelled" ? "bg-red-50 border-red-200 text-red-600" :
                      "bg-amber-50 border-amber-200 text-amber-600"
                    }`}>
                      {book.bookingStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
