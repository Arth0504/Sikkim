import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, CreditCard, ArrowLeft } from "lucide-react";
import API from "../services/api";
import { showSuccess, showError } from "../utils/toast";
import BookingReceipt from "../components/BookingReceipt";

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [paymentError, setPaymentError] = useState("");
  
  // State and Synchronous Locks for Duplicate Protection
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const paymentLock = useRef(false);

  useEffect(() => {
    // Load Razorpay SDK dynamically if not present
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => startPayment();
      document.body.appendChild(script);
    } else {
      startPayment();
    }
    // eslint-disable-next-line
  }, [bookingId]);

  const startPayment = async () => {
    // Synchronous Lock check
    if (paymentLock.current || paymentProcessing || paymentCompleted) {
      console.log("[Frontend Payment] Blocked duplicate startPayment invocation.");
      return;
    }

    paymentLock.current = true;
    setPaymentProcessing(true);
    setPaymentStarted(true);
    setPaymentError("");

    try {
      const role = sessionStorage.getItem("role");
      const token = sessionStorage.getItem("userToken") || localStorage.getItem("userToken");

      if (!token || role !== "user") {
        showError("Please login as a user first.");
        setPaymentProcessing(false);
        paymentLock.current = false;
        navigate("/login");
        return;
      }

      console.log(`[Frontend Payment] Initiating payment flow for bookingId: ${bookingId}`);

      // Fetch booking details first to get prefill information
      const bookingListRes = await API.get("/bookings/my");
      const booking = bookingListRes.data.find(b => b._id === bookingId);

      if (!booking) {
        showError("Booking details not found.");
        setPaymentProcessing(false);
        paymentLock.current = false;
        navigate("/my-bookings");
        return;
      }

      // Check if already paid
      if (booking.paymentStatus === "paid" || booking.paymentStatus === "success") {
        console.log("[Frontend Payment] Booking is already paid. Redirecting to confirmation receipt immediately.");
        setConfirmedBooking(booking);
        setPaymentCompleted(true);
        setPaymentProcessing(false);
        paymentLock.current = false;
        return;
      }

      console.log(`[Frontend Payment] Prefilling Razorpay checkout with traveler: ${booking.firstName} ${booking.lastName}, mobile: ${booking.mobile}`);

      // Create Razorpay order
      const res = await API.post("/payments/create-order", { bookingId });
      const { orderId, amount, key } = res.data;

      console.log(`[Frontend Payment] Order created on backend. Order ID: ${orderId}, Amount: ₹${amount}`);

      const options = {
        key,
        amount: Number(amount) * 100,
        currency: "INR",
        name: "Monastery360",
        description: "Spiritual Journey Booking",
        order_id: orderId,
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=80&h=80&fit=crop",

        handler: async function (response) {
          try {
            console.log(`[Frontend Payment] Payment signature received. Requesting verification...`);
            const verifyRes = await API.post("/payments/verify", {
              bookingId,
              razorpayOrderId: orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            console.log("[Frontend Payment] Signature verification succeeded. Booking confirmed.");
            showSuccess("Payment Successful! 🏔️ Your journey is confirmed.");
            
            setPaymentCompleted(true);
            setPaymentProcessing(false);

            const bookingRes = await API.get(`/bookings/my`);
            const paidBooking = bookingRes.data.find(b => b._id === bookingId);
            setConfirmedBooking(
              paidBooking
                ? { ...paidBooking, paymentId: response.razorpay_payment_id, paymentStatus: "success" }
                : { _id: bookingId, bookingStatus: "confirmed", paymentId: response.razorpay_payment_id, paymentStatus: "success", ...verifyRes.data }
            );
          } catch (err) {
            console.error("[Frontend Payment] Verification error:", err);
            setPaymentError(err?.response?.data?.message || "Payment verification failed.");
            setPaymentProcessing(false);
            paymentLock.current = false;
          }
        },

        modal: {
          ondismiss: function () {
            console.log("[Frontend Payment] Payment popup was closed/dismissed by user");
            setPaymentError("Payment was cancelled or dismissed. You can retry checkout below.");
            setPaymentProcessing(false);
            paymentLock.current = false;
          },
        },

        prefill: {
          name: `${booking.firstName || ""} ${booking.lastName || ""}`.trim() || "Guest Traveler",
          email: booking.user?.email || "traveler@example.com",
          contact: booking.mobile ? booking.mobile.replace(/\D/g, "").slice(-10) : "9999999999",
        },

        notes: {
          booking_id: bookingId,
        },

        theme: { color: "#0d9488" },
      };

      console.log("[Frontend Payment] Opening Razorpay checkout modal");
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response) {
        console.error(`[Frontend Payment] Payment failed: Code=${response.error.code}, Description=${response.error.description}`);
        setPaymentError(`Payment failed: ${response.error.description || "Unspecified gateway error"}`);
        setPaymentProcessing(false);
        paymentLock.current = false;
      });
      razorpay.open();
    } catch (err) {
      console.error("[Frontend Payment] Could not initiate payment flow:", err);
      setPaymentError(err?.response?.data?.message || "Could not initiate payment order. Please retry.");
      setPaymentStarted(false);
      setPaymentProcessing(false);
      paymentLock.current = false;
    }
  };

  // Show receipt after successful payment
  if (confirmedBooking) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 pb-24 flex items-center justify-center">
        <BookingReceipt
          booking={confirmedBooking}
          onClose={() => navigate("/my-bookings")}
        />
      </div>
    );
  }

  // Show Retry State when payment error occurs
  if (paymentError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 pt-32">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-12 text-center max-w-lg w-full space-y-8 shadow-2xl shadow-slate-200">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment Incomplete</h2>
            <p className="text-red-600 font-bold text-sm bg-red-50 py-3.5 px-4 rounded-xl border border-red-100 leading-relaxed text-center">
              {paymentError}
            </p>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-[11px] text-amber-800 font-medium text-left leading-relaxed">
              <span className="font-bold block uppercase tracking-wider mb-1">Razorpay Sandbox Warning:</span>
              International cards are not supported in test mode. Please prefill local details and choose UPI, local NetBanking, Wallet, or domestic cards to simulate payment.
            </div>
          </div>
          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={startPayment}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-all duration-300 w-full active:scale-95 shadow-md shadow-teal-600/10 cursor-pointer"
            >
              Retry Payment
            </button>
            <button
              onClick={() => navigate("/my-bookings")}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all duration-300 w-full active:scale-95 cursor-pointer"
            >
              Go to My Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 pt-32">
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-16 text-center max-w-lg w-full space-y-8">
        <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 mx-auto">
          <Loader2 size={40} className="animate-spin" />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {paymentStarted ? "Secure Payment Gateway Loading..." : "Preparing Your Booking..."}
          </h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Please do not refresh or press back. We are securely connecting to the payment gateway.
          </p>
          <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-4 text-[10px] text-teal-800 font-medium text-left leading-relaxed">
            <span className="font-bold block uppercase tracking-wider mb-1">Razorpay Test Mode Notice:</span>
            International cards are not supported. Clean mock credentials should be prefilled (UPI success@razorpay or domestic test cards) for validation testing.
          </div>
        </div>
        <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-6 text-xs font-black uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-teal-600" /> Secure
          </div>
          <div className="flex items-center gap-1.5">
            <CreditCard size={16} className="text-teal-600" /> SSL Encrypted
          </div>
        </div>
        <button
          onClick={() => navigate("/my-bookings")}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors mx-auto cursor-pointer"
        >
          <ArrowLeft size={14} /> Go to My Bookings
        </button>
      </div>
    </div>
  );
};

export default Payment;
