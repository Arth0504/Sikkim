import { useEffect, useState } from "react";
import { Check, X, User, Package, Calendar, Eye, Download } from "lucide-react";
import API from "../services/api";
import { showSuccess, showError } from "../utils/toast";

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
    loadDrivers();
  }, []);

  const loadDrivers = () => {
    API.get("/admin/drivers")
      .then((res) => {
        setDrivers(res.data || []);
      })
      .catch((err) => console.error(err));
  };

  const loadBookings = () => {
    API.get("/admin/bookings")
      .then((res) => {
        setBookings(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  const handleConfirm = async (id) => {
    try {
      await API.put(`/bookings/${id}/status`, { bookingStatus: "confirmed" });
      showSuccess("Booking Confirmed! ✅");
      loadBookings();
    } catch (err) {
      showError("Confirmation Failed!");
    }
  };

  const handleAssignDriver = async (bookingId, driverId) => {
    try {
      const res = await API.put(`/admin/bookings/${bookingId}/assign-driver`, { driverId: driverId || null });
      showSuccess(res.data.message || "Driver assigned successfully!");
      loadBookings();
      loadDrivers();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to assign driver");
    }
  };

  const handleCancel = async (booking) => {
    const isPaidOnline = booking.paymentMethod === "online" && booking.paymentStatus === "paid";
    const confirmMessage = isPaidOnline
      ? "Are you sure you want to cancel this booking? This will automatically process a refund through Razorpay."
      : "Are you sure you want to cancel this booking?";

    if (!window.confirm(confirmMessage)) return;

    try {
      if (isPaidOnline) {
        await API.put(`/bookings/cancel/${booking._id}`);
        showSuccess("Booking Cancelled and Refund Processed! 💸");
      } else {
        await API.put(`/bookings/${booking._id}/status`, { bookingStatus: "cancelled" });
        showSuccess("Booking Cancelled! 🚫");
      }
      loadBookings();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Action Failed!");
    }
  };

  const handlePaymentUpdate = async (id, status) => {
    try {
      await API.put(`/bookings/${id}/status`, { paymentStatus: status });
      showSuccess("Payment Status Updated! 💰");
      loadBookings();
    } catch (err) {
      showError("Action Failed!");
    }
  };

  const handleResendEmail = async (bookingId) => {
    try {
      await API.post(`/admin/bookings/${bookingId}/resend-invoice`);
      showSuccess("Invoice Email Resent successfully! 📩");
      loadBookings();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to resend invoice email");
    }
  };

  const handleDownloadPdf = async (bookingId) => {
    try {
      const res = await API.get(`/invoice/${bookingId}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `invoice_${bookingId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(link.href);
      showSuccess("PDF Invoice downloaded successfully! 📄");
    } catch (err) {
      console.error("Failed to download invoice:", err);
      showError("Failed to download PDF invoice");
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest">Loading Bookings...</div>;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-slate-900">User <span className="text-teal-600">Bookings</span></h1>
        <p className="text-slate-500 font-medium">Review and manage travel reservations across the platform.</p>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Traveler</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Package</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Amount</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Status & Payment</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bookings.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                        {b.passportPhoto ? <img src={`http://localhost:8519${b.passportPhoto}`} className="w-full h-full object-cover" /> : <User size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-none">{b.firstName} {b.lastName}</p>
                        <p className="text-xs text-slate-400 mt-1">{b.mobile}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                      <Package size={16} className="text-teal-500" />
                      {b.package?.name || "Unknown Package"}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-black text-slate-900">₹{b.totalAmount}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2 items-start">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        b.bookingStatus === "confirmed" ? "bg-teal-50 border-teal-200 text-teal-600" : 
                        b.bookingStatus === "cancelled" ? "bg-red-50 border-red-200 text-red-600" : 
                        "bg-amber-50 border-amber-200 text-amber-600"
                      }`}>
                        Booking: {b.bookingStatus}
                      </span>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        b.paymentStatus === "paid" ? "bg-emerald-50 border-emerald-200 text-emerald-600" : 
                        b.paymentStatus === "refunded" ? "bg-purple-50 border-purple-200 text-purple-600" : 
                        b.paymentStatus === "failed" ? "bg-red-50 border-red-200 text-red-600" : 
                        "bg-orange-50 border-orange-200 text-orange-600"
                      }`}>
                        {b.paymentMethod === 'cash' ? 'Cash' : 'Online'}: {b.paymentStatus || 'pending'}
                      </span>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        b.emailSent ? "bg-teal-50 border-teal-200 text-teal-600" : "bg-slate-50 border-slate-200 text-slate-500"
                      }`}>
                        Email: {b.emailSent ? "Sent ✅" : "Not Sent ❌"}
                      </span>
                      {b.cancelStatus && b.cancelStatus !== "none" && (
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          b.cancelStatus === "pending" ? "bg-orange-50 border-orange-200 text-orange-600" :
                          b.cancelStatus === "rejected" ? "bg-rose-50 border-rose-200 text-rose-600" :
                          "bg-emerald-50 border-emerald-200 text-emerald-600"
                        }`}>
                          Refund: {b.cancelStatus}
                        </span>
                      )}
                      {b.paymentStatus === "refunded" && (
                        <div className="text-[9px] text-slate-500 font-medium space-y-0.5 mt-1 border-t border-slate-100 pt-1.5 w-full">
                          <p><span className="font-bold">Refund ID:</span> <span className="font-mono">{b.refund_id || "N/A"}</span></p>
                          <p><span className="font-bold">Refund Amount:</span> ₹{b.refund_amount || 0}</p>
                          <p><span className="font-bold">Refund Status:</span> {b.refund_status || "Processed"}</p>
                          {b.refunded_at && <p><span className="font-bold">Refund Date:</span> {new Date(b.refunded_at).toLocaleDateString()}</p>}
                        </div>
                      )}
                      {b.bookingStatus === "confirmed" && (
                        <div className="mt-2 pt-2 border-t border-slate-100 w-full text-xs">
                          <span className="font-bold text-slate-400">Driver: </span>
                          {b.driver ? (
                            <span className="text-teal-600 font-extrabold">
                              {drivers.find(d => d._id === (b.driver._id || b.driver))?.name || "Assigned"}
                            </span>
                          ) : (
                            <span className="text-amber-500 italic">Unassigned</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-2 flex-wrap max-w-[150px]">
                      {b.bookingStatus === "pending" && (
                        <button 
                          onClick={() => handleConfirm(b._id)}
                          className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white transition-all shadow-sm text-xs font-bold"
                          title="Confirm Booking"
                        >
                          Confirm
                        </button>
                      )}
                      {b.bookingStatus !== "cancelled" && (
                        <button 
                          onClick={() => handleCancel(b)}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm text-xs font-bold"
                          title="Cancel Booking"
                        >
                          Cancel
                        </button>
                      )}
                      {b.paymentStatus === "pending" && b.bookingStatus !== "cancelled" && (
                        <button 
                          onClick={() => handlePaymentUpdate(b._id, 'paid')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm text-xs font-bold w-full mt-1 text-center"
                          title="Mark as Paid"
                        >
                          Mark Paid
                        </button>
                      )}
                      {b.paymentStatus === "paid" && b.bookingStatus !== "cancelled" && (
                        <button 
                          onClick={() => handlePaymentUpdate(b._id, 'pending')}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm text-xs font-bold w-full mt-1 text-center"
                          title="Mark as Unpaid"
                        >
                          Mark Unpaid
                        </button>
                      )}
                       {(b.paymentStatus === "paid" || b.bookingStatus === "confirmed" || b.bookingStatus === "cancelled") && (
                        <button 
                          onClick={() => handleDownloadPdf(b._id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm text-xs font-bold w-full mt-1 text-center flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Download Invoice PDF"
                        >
                          <Download size={12} /> Invoice PDF
                        </button>
                      )}
                      {(b.bookingStatus === "confirmed" || b.paymentStatus === "paid") && (
                        <button
                          onClick={() => handleResendEmail(b._id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm text-xs font-bold w-full mt-1 text-center cursor-pointer"
                          title="Resend Invoice Email"
                        >
                          Resend Email
                        </button>
                      )}
                      {b.bookingStatus === "confirmed" && (
                        <div className="w-full mt-2">
                          <select
                            value={b.driver?._id || b.driver || ""}
                            onChange={(e) => handleAssignDriver(b._id, e.target.value)}
                            className="w-full text-[11px] font-bold bg-slate-50 border border-slate-200 rounded px-2 py-1.5 outline-none text-slate-700 cursor-pointer hover:border-teal-500 transition-colors"
                          >
                            <option value="">-- Assign Driver --</option>
                            {b.driver && (
                              <option key={b.driver._id || b.driver} value={b.driver._id || b.driver}>
                                {drivers.find(d => d._id === (b.driver._id || b.driver))?.name || "Assigned Driver"} (Current)
                              </option>
                            )}
                            {drivers
                              .filter(d => d.status === "available" && String(d._id) !== String(b.driver?._id || b.driver))
                              .map(d => (
                                <option key={d._id} value={d._id}>
                                  {d.name} ({d.vehicleType})
                                </option>
                              ))
                            }
                          </select>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {bookings.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center">
            <Package size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest">No bookings found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
