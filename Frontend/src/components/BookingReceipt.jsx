import { useRef } from "react";
import { X, Download, Printer, CheckCircle, MapPin, Calendar, Users, CreditCard, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

const BookingReceipt = ({ booking, onClose }) => {
  const receiptRef = useRef(null);
  const navigate = useNavigate();

  if (!booking) return null;

  const handleDownload = async () => {
    try {
      const res = await API.get(`/invoice/${booking._id}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `booking_receipt_${booking._id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Failed to download receipt PDF:", err);
    }
  };

  const handleDownloadItinerary = async () => {
    try {
      const res = await API.get(`/bookings/${booking._id}/itinerary/download`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `itinerary_${booking._id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Failed to download itinerary PDF:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-teal-600 rounded-t-[2.5rem] p-8 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle size={28} />
              <h2 className="text-2xl font-black">Booking Confirmed!</h2>
            </div>
            <p className="text-teal-100 text-sm font-medium">Your journey has been successfully reserved.</p>
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Receipt Body */}
        <div ref={receiptRef} className="p-8 md:p-10 space-y-8">
          {/* Booking ID */}
          <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-teal-500 mb-1">Booking Reference ID</p>
            <p className="font-black text-slate-900 text-sm break-all">{booking._id}</p>
          </div>

          {/* Traveler Info */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Primary Traveler</p>
            <div className="bg-slate-50 rounded-2xl p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Name</span>
                <span className="font-bold text-slate-900">{booking.firstName} {booking.lastName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Mobile</span>
                <span className="font-bold text-slate-900">{booking.mobile}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">ID Proof</span>
                <span className="font-bold text-slate-900">{booking.idProofType}: {booking.idProofNumber}</span>
              </div>
            </div>
          </div>

          {/* Journey Info */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Journey Details</p>
            <div className="bg-slate-50 rounded-2xl p-6 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-500 font-medium"><MapPin size={14} className="text-teal-500" /> Package</span>
                <span className="font-bold text-slate-900">{booking.package?.name || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-500 font-medium"><Calendar size={14} className="text-teal-500" /> Travel Date</span>
                <span className="font-bold text-slate-900">
                  {new Date(booking.travelStartDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-500 font-medium"><Users size={14} className="text-teal-500" /> Persons</span>
                <span className="font-bold text-slate-900">{booking.persons}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-500 font-medium"><Hash size={14} className="text-teal-500" /> Booked On</span>
                <span className="font-bold text-slate-900">
                  {booking.createdAt
                    ? new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                    : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
              {booking.paymentId && (
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-slate-500 font-medium"><CreditCard size={14} className="text-teal-500" /> Payment ID</span>
                  <span className="font-bold text-slate-900 text-xs break-all">{booking.paymentId}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-500 font-medium"><CreditCard size={14} className="text-teal-500" /> Payment Method</span>
                <span className="font-bold text-slate-900">{booking.paymentMethod === 'cash' ? 'Cash' : 'Online'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-slate-500 font-medium"><CreditCard size={14} className="text-teal-500" /> Payment Status</span>
                <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-teal-500 text-white">
                  {booking.paymentStatus || "success"}
                </span>
              </div>
              
              {booking.bookingStatus === "confirmed" && (
                booking.driver ? (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Driver Allocation</p>
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-xs text-slate-700 font-bold space-y-1">
                      <p><span className="text-emerald-700">Driver Name:</span> {booking.driver.name}</p>
                      <p><span className="text-emerald-700">Phone:</span> {booking.driver.phone}</p>
                      <p><span className="text-emerald-700">Vehicle:</span> {booking.driver.vehicleType} ({booking.driver.vehicleNumber})</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-slate-500 italic text-xs font-medium">
                      Driver details will be shared 24 hours before departure.
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Total */}
          <div className="bg-slate-900 rounded-2xl p-6 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Amount Paid</p>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                booking.bookingStatus === "confirmed" ? "bg-teal-500 text-white" : "bg-amber-500 text-white"
              }`}>
                {booking.bookingStatus}
              </span>
            </div>
            <div className="flex items-baseline gap-1 text-white">
              <span className="text-lg font-bold">₹</span>
              <span className="text-4xl font-black">{booking.totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 rounded-b-[2.5rem] p-6 border-t border-slate-100 flex items-center justify-end gap-3">
          {booking.bookingStatus === "confirmed" && (
            <>
              <button
                onClick={() => {
                  onClose();
                  navigate(`/itinerary/${booking._id}`);
                }}
                className="flex items-center gap-2 px-5 py-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white font-bold text-xs rounded-xl transition-all uppercase tracking-wider cursor-pointer"
              >
                View Itinerary
              </button>
              <button
                onClick={handleDownloadItinerary}
                className="flex items-center gap-2 px-5 py-3 bg-teal-50 hover:bg-teal-600 text-teal-600 hover:text-white font-bold text-xs rounded-xl transition-all uppercase tracking-wider cursor-pointer"
              >
                Download Itinerary PDF
              </button>
            </>
          )}
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all shadow-md uppercase tracking-wider cursor-pointer"
          >
            <Download size={14} /> Download PDF Receipt
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingReceipt;
