import { useEffect, useState } from "react";
import { 
  TrendingUp, CreditCard, Users, Loader2, Sparkles, AlertCircle, 
  CheckCircle2, Info, ArrowUpRight, HelpCircle, UserCheck, MapPin, 
  Calendar, Award, Truck, ShoppingBag, Map
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from "recharts";
import API from "../services/api";
import { showError } from "../utils/toast";

const COLORS = ["#0d9488", "#0ea5e9", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/analytics/dashboard");
      setData(res.data);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      showError("Failed to fetch business intelligence analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="text-teal-600 animate-spin" size={44} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Computing BI Aggregations...</p>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // AI recommendations rendering map
  const getRecStyles = (type) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-emerald-50 border-emerald-200 text-emerald-800",
          icon: <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />,
          badge: "bg-emerald-600 text-white"
        };
      case "warning":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-800",
          icon: <AlertCircle className="text-amber-600 shrink-0" size={20} />,
          badge: "bg-amber-500 text-white"
        };
      case "danger":
        return {
          bg: "bg-rose-50 border-rose-200 text-rose-800",
          icon: <AlertCircle className="text-rose-600 shrink-0" size={20} />,
          badge: "bg-rose-600 text-white"
        };
      case "info":
      default:
        return {
          bg: "bg-sky-50 border-sky-200 text-sky-800",
          icon: <Info className="text-sky-600 shrink-0" size={20} />,
          badge: "bg-sky-600 text-white"
        };
    }
  };

  return (
    <div className="space-y-12 page-fade-in pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2 flex items-center gap-3">
            AI Insights & <span className="text-teal-600">Analytics</span>
          </h1>
          <p className="text-slate-500 font-medium">Advanced MongoDB business intelligence & automated decision suggestions.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 flex items-center gap-3 shadow-sm self-start">
          <Sparkles className="text-teal-600 animate-pulse" />
          <span className="text-sm font-black uppercase tracking-widest text-slate-600">AI Enabled</span>
        </div>
      </div>

      {/* AI RECOMMENDATIONS SECTION */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm space-y-6">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Sparkles className="text-teal-600" size={20} />
          Smart Suggestions & Action Points
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.recommendations.map((rec) => {
            const styles = getRecStyles(rec.type);
            return (
              <div key={rec.id} className={`flex items-start gap-4 p-5 rounded-2xl border ${styles.bg} transition-all hover:shadow-md`}>
                {styles.icon}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${styles.badge}`}>
                      {rec.type}
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed">{rec.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CORE METRICS SUMMARY GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
              <CreditCard size={22} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 flex items-center gap-0.5">
              Success <ArrowUpRight size={12} />
            </span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Revenue</p>
            <h3 className="text-2xl font-black text-slate-900">{formatCurrency(data.revenue.total)}</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-2">Highest Month: {data.revenue.highestMonth}</p>
          </div>
        </div>

        {/* Avg Booking Value */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <TrendingUp size={22} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-0.5">
              Average <ArrowUpRight size={12} />
            </span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Avg Booking Value</p>
            <h3 className="text-2xl font-black text-slate-900">{formatCurrency(data.revenue.avgBookingValue)}</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-2">Calculated from success state</p>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <Users size={22} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-600">Registered</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Users</p>
            <h3 className="text-2xl font-black text-slate-900">{data.userAnalytics.totalUsers}</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-2">User accounts created</p>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <UserCheck size={22} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Status Active</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Active Users</p>
            <h3 className="text-2xl font-black text-slate-900">{data.userAnalytics.activeUsers}</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-2">Non-blocked users</p>
          </div>
        </div>
      </div>

      {/* TREND GRAPHS: REVENUE TIMELINE & BOOKING CHRONOLOGY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Area Chart */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 hover:shadow-md transition-all">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h4 className="text-lg font-black text-slate-900">Revenue Timeline</h4>
              <p className="text-xs text-slate-400 font-bold">Sum of successful payment events</p>
            </div>
            <CreditCard className="text-teal-600" size={20} />
          </div>
          <div className="h-72">
            {data.revenue.monthly.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">No monthly revenue data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenue.monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "1rem", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }}
                    formatter={(value) => [formatCurrency(value), "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Booking & Registration Line Chart */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 hover:shadow-md transition-all">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h4 className="text-lg font-black text-slate-900">Monthly Booking Trend</h4>
              <p className="text-xs text-slate-400 font-bold">Chronological non-cancelled bookings count</p>
            </div>
            <TrendingUp className="text-indigo-600" size={20} />
          </div>
          <div className="h-72">
            {data.bookingTrend.chronological.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">No booking trend data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.bookingTrend.chronological} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: "1rem", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)" }} />
                  <Line type="monotone" dataKey="bookings" stroke="#8b5cf6" strokeWidth={2.5} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* CORE BUSINESS ANALYTICS: PACKAGES, MONASTERIES & REGISTRATION TRENDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Packages Performance Ranking */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 hover:shadow-md transition-all lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h4 className="text-lg font-black text-slate-900">Package Popularity Ranking</h4>
                <p className="text-xs text-slate-400 font-bold">Bookings count and average ratings</p>
              </div>
              <ShoppingBag className="text-violet-600" size={20} />
            </div>
            <div className="h-64">
              {data.packagePerformance.ranking.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">No package data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.packagePerformance.ranking} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 9, fontWeight: 700 }} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} />
                    <Tooltip contentStyle={{ borderRadius: "1rem", border: "1px solid #e2e8f0" }} />
                    <Bar dataKey="bookingCount" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-50 mt-6 grid grid-cols-3 text-center text-xs font-black uppercase tracking-wider text-slate-500">
            <div>
              <p className="text-[10px] text-slate-400 mb-1">Most Booked</p>
              <p className="text-teal-600 truncate px-2">{data.packagePerformance.mostBooked}</p>
            </div>
            <div className="border-x border-slate-100">
              <p className="text-[10px] text-slate-400 mb-1">Least Booked</p>
              <p className="text-rose-600 truncate px-2">{data.packagePerformance.leastBooked}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 mb-1">Highest Rated</p>
              <p className="text-violet-600 truncate px-2">{data.packagePerformance.highestRated}</p>
            </div>
          </div>
        </div>

        {/* Monastery Visits Insights */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h4 className="text-lg font-black text-slate-900">Monastery Popularity</h4>
                <p className="text-xs text-slate-400 font-bold">Relative visitor share by package bookings</p>
              </div>
              <MapPin className="text-emerald-600" size={20} />
            </div>
            <div className="h-60 flex items-center justify-center">
              {data.monasteryInsights.ranking.length === 0 ? (
                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">No monastery visitor records yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.monasteryInsights.ranking}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="bookingCount"
                    >
                      {data.monasteryInsights.ranking.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Visits`, "Count"]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50 space-y-2 max-h-[140px] overflow-y-auto">
            {data.monasteryInsights.ranking.slice(0, 3).map((mon, i) => (
              <div key={mon._id} className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="truncate max-w-[120px]">{mon.name}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-black">{mon.bookingCount} visits</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FESTIVAL ANALYTICS & SEASONALITY REGISTRATION TRENDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Festival reminders subscription report */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h4 className="text-lg font-black text-slate-900">Festival Subscriptions</h4>
                <p className="text-xs text-slate-400 font-bold">Active reminder subscribers per event</p>
              </div>
              <Calendar className="text-amber-500" size={20} />
            </div>
            <div className="h-60 flex items-center justify-center">
              {data.festivalAnalytics.participationReport.length === 0 ? (
                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">No festival subscriptions</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.festivalAnalytics.participationReport}
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      dataKey="subscriberCount"
                    >
                      {data.festivalAnalytics.participationReport.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Subs`, "Subscriptions"]} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50 space-y-2 max-h-[140px] overflow-y-auto">
            {data.festivalAnalytics.participationReport.slice(0, 3).map((fest, i) => (
              <div key={fest._id} className="flex justify-between items-center text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[(i + 2) % COLORS.length] }} />
                  <span className="truncate max-w-[120px]">{fest.name}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-black">{fest.subscriberCount} subs</span>
              </div>
            ))}
          </div>
        </div>

        {/* User Registration Velocity */}
        <div className="bg-white rounded-[2rem] border border-slate-100 p-8 hover:shadow-md transition-all lg:col-span-2">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h4 className="text-lg font-black text-slate-900">User Registrations</h4>
              <p className="text-xs text-slate-400 font-bold">Timeline of user sign-ups per month</p>
            </div>
            <Users className="text-rose-500" size={20} />
          </div>
          <div className="h-72">
            {data.userAnalytics.registrations.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">No registration data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.userAnalytics.registrations} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} />
                  <Tooltip contentStyle={{ borderRadius: "1rem", border: "1px solid #e2e8f0" }} />
                  <Area type="monotone" dataKey="registrations" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRegs)" name="Sign-ups" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* CUSTOM RESERVATIONS ANALYTICS */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h4 className="text-xl font-black text-slate-900">Custom Tour Reservation Insights</h4>
            <p className="text-xs text-slate-400 font-medium">Analytics of user-customized travel plans, approval funnel, and projected revenue.</p>
          </div>
          <Map className="text-teal-600" size={24} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Card 1: Key Metrics */}
          <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 flex flex-col justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Total Custom Tour Requests</p>
              <h3 className="text-3xl font-black text-slate-900">{data.customReservationStats?.total || 0}</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-2">Requested via Custom Package Builder</p>
            </div>
            <div className="pt-6 border-t border-slate-100 mt-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Projected Custom Revenue</p>
              <h4 className="text-2xl font-black text-teal-600">{formatCurrency(data.customReservationStats?.projectedRevenue || 0)}</h4>
              <p className="text-[9px] text-slate-400 font-bold">Sum of estimated prices from approved requests</p>
            </div>
          </div>

          {/* Card 2: Approval Funnel Status */}
          <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 space-y-4">
            <h5 className="text-xs font-black uppercase tracking-widest text-slate-400">Request Funnel Status</h5>
            
            <div className="space-y-3">
              {/* Approved */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-teal-500 rounded-full" />
                    Approved
                  </span>
                  <span className="text-slate-900">{data.customReservationStats?.approved || 0} requests</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-teal-500 h-full transition-all duration-500" 
                    style={{ width: `${data.customReservationStats?.total ? (data.customReservationStats.approved / data.customReservationStats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Pending */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                    Pending Review
                  </span>
                  <span className="text-slate-900">{data.customReservationStats?.pending || 0} requests</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full transition-all duration-500" 
                    style={{ width: `${data.customReservationStats?.total ? (data.customReservationStats.pending / data.customReservationStats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Rejected */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                    Rejected
                  </span>
                  <span className="text-slate-900">{data.customReservationStats?.rejected || 0} requests</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-red-500 h-full transition-all duration-500" 
                    style={{ width: `${data.customReservationStats?.total ? (data.customReservationStats.rejected / data.customReservationStats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Regional Demand Ranking */}
          <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 space-y-4">
            <h5 className="text-xs font-black uppercase tracking-widest text-slate-400">Regional Interest Breakdown</h5>
            
            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
              {!data.customReservationStats?.regionRanking || data.customReservationStats.regionRanking.length === 0 ? (
                <div className="text-slate-400 text-xs font-bold py-6 text-center">No regional requests tracked yet</div>
              ) : (
                data.customReservationStats.regionRanking.map((region) => {
                  const maxCount = data.customReservationStats.regionRanking[0]?.count || 1;
                  return (
                    <div key={region._id} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600">{region._id}</span>
                        <span className="text-slate-900">{region.count} requests</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full transition-all duration-500" 
                          style={{ width: `${(region.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DRIVER ANALYTICS & WORKLOAD REPORT */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h4 className="text-xl font-black text-slate-900">Driver Performance & Workload</h4>
            <p className="text-xs text-slate-400 font-medium">Assigned bookings, vehicle registration states, and real-time status.</p>
          </div>
          <Truck className="text-teal-600" size={24} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-4 px-2">Driver Name</th>
                <th className="py-4 px-2">Vehicle Type</th>
                <th className="py-4 px-2">Vehicle Number</th>
                <th className="py-4 px-2">Total Bookings</th>
                <th className="py-4 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
              {data.driverAnalytics.workloadReport.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No driver records found</td>
                </tr>
              ) : (
                data.driverAnalytics.workloadReport.map((driver, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-2 font-black text-slate-900">{driver.name}</td>
                    <td className="py-4 px-2">{driver.vehicleType}</td>
                    <td className="py-4 px-2 font-mono text-[10px]">{driver.vehicleNumber}</td>
                    <td className="py-4 px-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-50 border border-teal-200 text-teal-700">
                        {driver.bookingsCount} bookings
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        driver.status === "available" ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                        driver.status === "busy" ? "bg-amber-50 border-amber-200 text-amber-600" :
                        "bg-slate-50 border-slate-200 text-slate-400"
                      }`}>
                        {driver.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
