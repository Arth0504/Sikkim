import { useEffect, useState } from "react";
import { 
  CreditCard, Calendar, User, CheckCircle, RefreshCcw, AlertCircle, Package as PackageIcon, ShieldAlert, Clock
} from "lucide-react";
import API from "../services/api";
import { showSuccess, showError } from "../utils/toast";

const AdminCancelRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchCancelRequests = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/cancel-requests");
      setRequests(res.data || []);
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCancelRequests();
  }, []);

  const approveRefund = async (bookingId) => {
    if (!window.confirm("Approve refund as per policy and cancel booking? This triggers the Razorpay refund.")) return;

    try {
      setActionLoadingId(bookingId);
      const res = await API.put(`/admin/bookings/${bookingId}/refund`);
      showSuccess(`Refund Approved! Refund ID: ${res.data.booking?.refund_id || "N/A"} of ₹${res.data.refundAmount}`);
      fetchCancelRequests();
    } catch (err) {
      showError(err?.response?.data?.message || "Refund failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const rejectCancelRequest = async (bookingId) => {
    if (!window.confirm("Reject cancellation request and keep booking confirmed? No refund will be generated.")) return;

    try {
      setActionLoadingId(bookingId);
      await API.put(`/admin/bookings/${bookingId}/reject-refund`);
      showSuccess("Cancellation request rejected successfully. Rejection email sent.");
      fetchCancelRequests();
    } catch (err) {
      showError(err?.response?.data?.message || "Action failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Cancel <span className="text-teal-600">Requests</span></h1>
          <p className="text-slate-500 font-medium">Process pending cancellation and refund requests from travelers.</p>
        </div>
        <button 
          onClick={fetchCancelRequests} 
          className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-teal-600 transition-all shadow-sm cursor-pointer"
        >
          <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCcw size={40} className="text-teal-600 animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-20 text-center flex flex-col items-center">
          <CheckCircle className="text-teal-500 mb-6" size={64} />
          <p className="text-slate-900 font-black text-2xl mb-2">Queue Clear!</p>
          <p className="text-slate-400 font-medium">There are no pending cancellation requests at the moment.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Booking & Traveler</th>
                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Timeline Dates</th>
                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Cancellation Reason</th>
                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Financials & Status</th>
                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {requests.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* Booking & Traveler Details */}
                      <td className="px-6 py-6">
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">ID: {b._id}</p>
                          <p className="text-slate-900 font-bold text-base leading-none">{b.firstName} {b.lastName}</p>
                          <p className="text-[10px] font-bold text-slate-400">{b.user?.email || ""}</p>
                          <div className="inline-flex items-center gap-1.5 text-teal-600 text-[10px] font-black uppercase tracking-widest pt-1">
                            <PackageIcon size={12} /> {b.package?.name || "Unknown Package"}
                          </div>
                        </div>
                      </td>
                      
                      {/* Timeline Dates */}
                      <td className="px-6 py-6">
                        <div className="space-y-2 text-xs font-bold text-slate-500">
                          <div className="flex items-center gap-2" title="Travel Start Date">
                            <Calendar size={14} className="text-teal-500" />
                            <span>Travel: {b.travelStartDate ? new Date(b.travelStartDate).toLocaleDateString("en-IN") : "-"}</span>
                          </div>
                          <div className="flex items-center gap-2" title="Cancellation Requested Date">
                            <Clock size={14} className="text-red-500" />
                            <span>Request: {b.cancellationRequestedAt ? new Date(b.cancellationRequestedAt).toLocaleDateString("en-IN") : (b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : "-")}</span>
                          </div>
                        </div>
                      </td>
                      
                      {/* Cancellation Reason */}
                      <td className="px-6 py-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 max-w-xs">
                          <p className="text-slate-600 text-xs italic leading-relaxed whitespace-pre-wrap">
                            "{b.cancellationReason || b.cancelReason || "No reason provided"}"
                          </p>
                        </div>
                      </td>
                      
                      {/* Financials & Status */}
                      <td className="px-6 py-6">
                        <div className="space-y-2">
                          <div>
                            <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest block">Amount Paid</span>
                            <span className="text-slate-950 font-black text-sm">₹{b.totalAmount}</span>
                          </div>
                          
                          <div>
                            <span className="text-teal-600 text-[9px] font-black uppercase tracking-widest block">Refund Eligible</span>
                            <span className="text-teal-600 font-black text-sm">₹{b.eligibleRefund ?? 0}</span>
                            <span className="text-[10px] font-bold text-slate-400 ml-1">({b.refundPercent ?? 0}%)</span>
                          </div>

                          <div className="flex gap-1.5 pt-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                              b.paymentStatus === "paid" ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-red-50 border-red-200 text-red-600"
                            }`}>
                              {b.paymentStatus}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border bg-orange-50 border-orange-200 text-orange-600">
                              {b.cancelStatus}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      {/* Actions */}
                      <td className="px-6 py-6 text-right">
                        <div className="flex flex-col gap-2 justify-end">
                          <button
                            onClick={() => approveRefund(b._id)}
                            disabled={actionLoadingId === b._id}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white border border-red-100 font-bold rounded-xl transition-all duration-300 text-[9px] uppercase tracking-widest cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoadingId === b._id ? <RefreshCcw size={12} className="animate-spin" /> : <CreditCard size={12} />}
                            Approve Refund
                          </button>
                          <button
                            onClick={() => rejectCancelRequest(b._id)}
                            disabled={actionLoadingId === b._id}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-800 text-slate-600 hover:text-white border border-slate-200 font-bold rounded-xl transition-all duration-300 text-[9px] uppercase tracking-widest cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reject Request
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 bg-amber-50 border border-amber-100 rounded-2xl">
            <AlertCircle size={24} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-amber-900 text-sm font-black uppercase tracking-widest mb-1">Administrative Note</p>
              <p className="text-slate-600 text-xs font-medium leading-relaxed">
                Approve Refund triggers dynamic calculations and processes refunds through Razorpay. Reject Request denies cancellation and sets status to rejected. Refund policies scale based on requested dates.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCancelRequests;
