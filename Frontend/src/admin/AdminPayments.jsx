import { useEffect, useState, useCallback } from "react";
import {
  CreditCard,
  Search,
  IndianRupee,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpDown,
  ChevronDown,
  X,
  Calendar,
  User,
  Compass,
  FileText,
  AlertCircle,
  Eye,
} from "lucide-react";
import API from "../services/api";
import { showError } from "../utils/toast";
import LifecycleModal from "../components/LifecycleModal";

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const fmtDateOnly = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtAmount = (amt) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amt ?? 0);

const customerName = (p) => {
  const bFirst = p.booking?.firstName;
  const bLast = p.booking?.lastName;
  if (bFirst) return `${bFirst} ${bLast || ""}`.trim();
  return p.user?.name || "—";
};

const packageName = (p) => p.booking?.package?.name || "—";

// ─── status badge config ──────────────────────────────────────────────────────

const STATUS_CFG = {
  // Green (Success / Paid / Confirmed)
  success:    { label: "Success", bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", dot: "bg-teal-500" },
  paid:       { label: "Paid", bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", dot: "bg-teal-500" },
  confirmed:  { label: "Confirmed", bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", dot: "bg-teal-500" },
  PAYMENT_SUCCESS: { label: "Payment Success", bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", dot: "bg-teal-500" },

  // Yellow (Pending / Requested)
  created:    { label: "Pending", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  pending:    { label: "Pending", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  CANCELLATION_REQUESTED: { label: "Cancel Requested", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  REFUND_PENDING: { label: "Refund Pending", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },

  // Red (Failed)
  failed:     { label: "Failed", bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" },
  REFUND_FAILED: { label: "Refund Failed", bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" },

  // Blue (Refund Processed / Cancelled)
  refunded:   { label: "Refunded", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-50" },
  cancelled:  { label: "Cancelled", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-50" },
  CANCELLATION_APPROVED: { label: "Cancel Approved", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-50" },
  REFUND_PROCESSED: { label: "Refund Processed", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-50" },
  BOOKING_CANCELLED: { label: "Booking Cancelled", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-50" },
  processed:  { label: "Processed", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-50" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.border} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot || "bg-slate-400"}`} />
      {cfg.label}
    </span>
  );
};

// ─── stat card ─────────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-7 flex items-center gap-5">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
    <div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      {sub && <p className="text-[10px] font-bold text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── main component ────────────────────────────────────────────────────────────

const getPaymentStatus = (p) => {
  const refundStatus = String(p.refundStatus || p.booking?.refund_status || '').toLowerCase();
  if (refundStatus === 'pending') {
    return "success";
  }
  return p.status || p.booking?.paymentStatus;
};

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // filter / search / sort state
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [searchInput, setSearchInput] = useState("");

  // timeline modal state
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showLifecycleModal, setShowLifecycleModal] = useState(false);

  // Requirement 8: Add console debugging
  console.log("selectedTransaction state in AdminPayments:", selectedTransaction);

  // ── fetch stats once ──
  const loadStats = () => {
    API.get("/admin/payments-stats")
      .then((r) => setStats(r.data))
      .catch(() => null);
  };

  useEffect(() => {
    loadStats();
  }, []);

  // ── fetch payments whenever filters change ──
  const loadPayments = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search) params.set("search", search);
    if (sort) params.set("sort", sort);

    API.get(`/admin/payments?${params.toString()}`)
      .then((r) => {
        setPayments(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [statusFilter, search, sort]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
  };

  const openLifecycleModal = (transaction) => {
    // Requirement 8: Add console debugging
    console.log("Lifecycle button clicked transaction:", transaction);
    setSelectedTransaction(transaction);
    setShowLifecycleModal(true);
  };

  // ─── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* ── header ── */}
      <div>
        <h1 className="text-3xl font-black text-slate-900">
          Transaction <span className="text-teal-600">History</span>
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Monitor payments, cancellation details, and full refund lifecycles.
        </p>
      </div>

      {/* ── stats cards ── */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <StatCard
            icon={IndianRupee}
            label="Total Revenue"
            color="bg-teal-600"
            value={`₹${fmtAmount(stats.totalRevenue)}`}
            sub="From successful payments"
          />
          <StatCard
            icon={CheckCircle}
            label="Successful Payments"
            color="bg-emerald-500"
            value={stats.successful}
            sub="Payments confirmed"
          />
          <StatCard
            icon={Clock}
            label="Pending Payments"
            color="bg-amber-500"
            value={stats.pending}
            sub="Awaiting verification"
          />
          <StatCard
            icon={XCircle}
            label="Refunded Payments"
            color="bg-purple-600"
            value={stats.refunded || 0}
            sub="Cancelled bookings"
          />
          <StatCard
            icon={IndianRupee}
            label="Refunded Amount"
            color="bg-rose-500"
            value={`₹${fmtAmount(stats.refundedAmount || 0)}`}
            sub="Total money returned"
          />
        </div>
      )}

      {/* ── controls ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 flex-wrap">
        {/* search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[220px]">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search order ID, payment ID, customer…"
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition-all"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all"
            >
              Clear
            </button>
          )}
        </form>

        {/* status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: "all", label: "All" },
            { key: "success", label: "Success" },
            { key: "created", label: "Pending" },
            { key: "failed", label: "Failed" },
            { key: "refunded", label: "Refunded" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                statusFilter === key
                  ? "bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-600/20"
                  : "bg-white text-slate-500 border-slate-200 hover:border-teal-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* sort */}
        <div className="relative">
          <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="pl-8 pr-8 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-700 focus:border-teal-500 transition-all appearance-none cursor-pointer"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="amount_desc">Amount: High → Low</option>
            <option value="amount_asc">Amount: Low → High</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
      </div>

      {/* ── table ── */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm animate-pulse">
              Loading transactions…
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Customer Name
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Package Name
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Payment Amount
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Payment Status
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Refund Status
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Booking Status
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Cancellation Date
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Refund Date
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                    Timeline
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map((transaction) => (
                  <tr key={transaction._id} className="hover:bg-slate-50/60 transition-colors">
                    {/* customer */}
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900 text-sm leading-tight">
                        {customerName(transaction)}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {transaction.user?.email || "—"}
                      </p>
                    </td>

                    {/* package name */}
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-900 text-sm leading-tight">
                        {packageName(transaction)}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                        {transaction.booking?.package?.duration || ""}
                      </p>
                    </td>

                    {/* payment amount */}
                    <td className="px-6 py-5 font-black text-slate-900">
                      ₹{fmtAmount(transaction.amount)}
                    </td>

                    {/* payment status */}
                    <td className="px-6 py-5">
                      <StatusBadge status={getPaymentStatus(transaction)} />
                    </td>

                    {/* refund status */}
                    <td className="px-6 py-5 text-sm font-bold">
                      {transaction.booking?.refund_status ? (
                        <StatusBadge status={transaction.booking.refund_status} />
                      ) : transaction.refundStatus === "refunded" ? (
                        <StatusBadge status="refunded" />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* booking status */}
                    <td className="px-6 py-5">
                      {transaction.booking?.bookingStatus ? (
                        <StatusBadge status={transaction.booking.bookingStatus} />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* cancellation date */}
                    <td className="px-6 py-5 text-xs font-bold text-slate-600">
                      {transaction.booking?.cancelledAt ? fmtDateOnly(transaction.booking.cancelledAt) : "—"}
                    </td>

                    {/* refund date */}
                    <td className="px-6 py-5 text-xs font-bold text-slate-600">
                      {transaction.booking?.refunded_at ? fmtDateOnly(transaction.booking.refunded_at) : "—"}
                    </td>

                    {/* timeline action */}
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => openLifecycleModal(transaction)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-teal-600 hover:text-white rounded-xl font-bold text-xs text-slate-700 transition-all shadow-sm cursor-pointer"
                      >
                        <Eye size={12} />
                        Lifecycle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && payments.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <CreditCard size={48} className="text-slate-200" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
              No transactions found.
            </p>
          </div>
        )}
      </div>

      {/* row count */}
      {!loading && payments.length > 0 && (
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-right">
          Showing {payments.length} record{payments.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* TIMELINE DETAILS MODAL */}
      {showLifecycleModal && (
        <LifecycleModal
          transaction={selectedTransaction}
          onClose={() => setShowLifecycleModal(false)}
        />
      )}
    </div>
  );
};

export default AdminPayments;
