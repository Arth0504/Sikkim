import React, { useEffect, useState } from "react";
import {
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  IndianRupee,
  Loader2,
  Calendar,
} from "lucide-react";
import API from "../services/api";

const STATUS_CFG = {
  PAYMENT_SUCCESS: {
    label: "Payment Success",
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-700",
    dot: "bg-teal-500",
    icon: CheckCircle,
    desc: "The customer has successfully completed the payment.",
  },
  CANCELLATION_REQUESTED: {
    label: "Cancellation Requested",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
    icon: Clock,
    desc: "Cancellation request was initiated by the customer or admin.",
  },
  CANCELLATION_APPROVED: {
    label: "Cancellation Approved",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
    icon: XCircle,
    desc: "Cancellation request was approved by the system or admin.",
  },
  REFUND_PENDING: {
    label: "Refund Pending",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
    icon: Clock,
    desc: "Refund processes have been initialized and are pending verification.",
  },
  REFUND_PROCESSED: {
    label: "Refund Processed",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    icon: IndianRupee,
    desc: "Refund has been processed successfully to the source account.",
  },
  REFUND_FAILED: {
    label: "Refund Failed",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
    icon: AlertCircle,
    desc: "Refund attempt failed. Please check payment provider dashboard.",
  },
  BOOKING_CANCELLED: {
    label: "Booking Cancelled",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
    icon: XCircle,
    desc: "The booking has been officially marked as cancelled.",
  },
};

const fmtAmount = (amt) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amt ?? 0);

const LifecycleModal = ({ transaction, onClose }) => {
  const [lifecycle, setLifecycle] = useState([]);
  const [loading, setLoading] = useState(true);

  // Requirement 8: Add console debugging for transaction
  useEffect(() => {
    console.log("LifecycleModal transaction prop:", transaction);
  }, [transaction]);

  useEffect(() => {
    const fetchLifecycle = async () => {
      if (!transaction?._id) return;
      setLoading(true);
      try {
        const res = await API.get(`/admin/transactions/${transaction._id}/lifecycle`);
        setLifecycle(res.data || []);
      } catch (err) {
        console.error("Failed to fetch transaction lifecycle", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLifecycle();
  }, [transaction]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all border border-slate-100/50">
        {/* Header */}
        <div className="p-8 bg-slate-950 text-white flex justify-between items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">
              Transaction Lifecycle
            </span>
            <h2 className="text-xl font-black mt-1">Timeline details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all relative z-10 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal content */}
        <div className="p-8 overflow-y-auto flex-1 space-y-6">
          {/* Info section */}
          {transaction && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Payment ID:</span>
                <span className="font-mono text-slate-800 font-bold truncate max-w-[200px]">
                  {transaction._id}
                </span>
              </div>
              {transaction.booking && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Booking ID:</span>
                    <span className="font-mono text-slate-800 font-bold truncate max-w-[200px]">
                      {transaction.booking._id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Customer:</span>
                    <span className="text-slate-800 font-black">
                      {transaction.booking.firstName} {transaction.booking.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Package:</span>
                    <span className="text-slate-800 font-bold">
                      {transaction.booking.package?.name || "—"}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Total Amount:</span>
                <span className="text-teal-600 font-black">
                  ₹{fmtAmount(transaction.amount || transaction.booking?.totalAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Timeline steps */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
              Event History
            </h4>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="animate-spin text-teal-600" size={30} />
              </div>
            ) : lifecycle.length === 0 ? (
              // Requirement 7: If lifecycle array is empty, show "No lifecycle events found"
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
                <AlertCircle size={24} className="text-amber-500 mx-auto mb-2 animate-bounce" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  No lifecycle events found
                </p>
              </div>
            ) : (
              <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 pb-4">
                {lifecycle.map((status, idx) => {
                  const cfg = STATUS_CFG[status] ?? {
                    label: status,
                    bg: "bg-slate-50",
                    border: "border-slate-200",
                    text: "text-slate-700",
                    dot: "bg-slate-400",
                    icon: AlertCircle,
                    desc: "An event occurred in the transaction lifecycle.",
                  };
                  const IconComponent = cfg.icon;

                  return (
                    <div key={idx} className="relative pl-8 animate-fadeIn">
                      {/* Dot indicator */}
                      <div
                        className="absolute -left-[11px] top-1 bg-white border-2 rounded-full w-5 h-5 flex items-center justify-center transition-all duration-300 hover:scale-110"
                        style={{ borderColor: cfg.dot ? undefined : "#94a3b8" }}
                      >
                        <div className={`rounded-full w-2 h-2 ${cfg.dot || "bg-slate-400"}`} />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.border} ${cfg.text}`}
                          >
                            <IconComponent size={10} />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500">
                          {cfg.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifecycleModal;
