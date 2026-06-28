import { useEffect, useState } from "react";
import { Calendar, Users, CreditCard, Package, Loader2, ArrowRight, X, Star, MessageSquare, Download, Sparkles } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../services/api";
import { showSuccess, showError } from "../utils/toast";
import BookingReceipt from "../components/BookingReceipt";
import { BookingSkeleton } from "../components/SkeletonLoader";
import imgUrl from "../utils/imgUrl";

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activeTab, setActiveTab] = useState("bookings");
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const navigate = useNavigate();

  // Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewPackageId, setReviewPackageId] = useState(null);
  const [reviewPackageName, setReviewPackageName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReviewsMap, setUserReviewsMap] = useState({});

  const fetchBookings = async () => {
    try {
      const res = await API.get("/bookings/my");
      const fetchedBookings = res.data || [];
      setBookings(fetchedBookings);

      // Check review status for each confirmed booking's package in parallel
      const confirmedPkgs = fetchedBookings
        .filter(b => b.bookingStatus === "confirmed" && b.package)
        .map(b => b.package._id);

      const reviewChecks = {};
      await Promise.all(
        [...new Set(confirmedPkgs)].map(async (pkgId) => {
          try {
            const reviewRes = await API.get(`/reviews/package/${pkgId}`);
            reviewChecks[pkgId] = reviewRes.data.userReview || null;
          } catch (err) {
            console.error("Failed to check review status for package:", pkgId, err);
          }
        })
      );
      setUserReviewsMap(reviewChecks);
    } catch {
      showError("Failed to load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const res = await API.get("/packages/custom-builder/reservations");
      setReservations(res.data || []);
    } catch (err) {
      console.error("Failed to fetch reservations:", err);
    }
  };

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "reservations") {
      setActiveTab("reservations");
    }

    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchBookings(), fetchReservations()]);
      setLoading(false);
    };
    loadAll();
  }, [searchParams]);

  const handleDownloadItinerary = async (bookingId) => {
    try {
      const res = await API.get(`/bookings/${bookingId}/itinerary/download`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `itinerary_${bookingId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(link.href);
      showSuccess("Itinerary PDF downloaded successfully! 📄");
    } catch (err) {
      console.error("Failed to download itinerary PDF:", err);
      showError("Failed to download itinerary PDF");
    }
  };

  const triggerCancelModal = (bookingId) => {
    setCancelBookingId(bookingId);
    setCancellationReason("");
    setShowCancelModal(true);
  };

  const triggerReviewModal = (packageId, packageName) => {
    setReviewPackageId(packageId);
    setReviewPackageName(packageName);
    setFormRating(5);
    setFormComment("");
    setShowReviewModal(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!formRating) {
      showError("Please select a star rating.");
      return;
    }
    const trimmedComment = formComment.trim();
    if (trimmedComment.length < 10) {
      showError("Review comment must be at least 10 characters long.");
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await API.post("/reviews", {
        packageId: reviewPackageId,
        rating: formRating,
        comment: trimmedComment,
      });
      showSuccess(res.data.message || "Review submitted successfully! Approved comments are public.");
      
      setUserReviewsMap((prev) => ({
        ...prev,
        [reviewPackageId]: { rating: formRating, comment: trimmedComment }
      }));
      setShowReviewModal(false);
      await fetchBookings();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    const trimmedReason = cancellationReason.trim();
    if (!trimmedReason) {
      showError("Please enter a reason for cancellation.");
      return;
    }
    if (trimmedReason.length < 10) {
      showError("Reason for cancellation must be at least 10 characters long.");
      return;
    }
    if (trimmedReason.length > 250) {
      showError("Reason for cancellation cannot exceed 250 characters.");
      return;
    }

    setSubmittingCancel(true);
    try {
      const res = await API.put(`/bookings/${cancelBookingId}/cancel-request`, { cancellationReason });
      showSuccess(res.data.message || "Cancellation request submitted successfully.");
      
      // Reload booking list
      await fetchBookings();
      setShowCancelModal(false);
    } catch (err) {
      showError(err.response?.data?.message || "Failed to submit cancellation request.");
    } finally {
      setSubmittingCancel(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-24 page-fade-in">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">My <span className="text-teal-600">Journeys</span></h1>
          <p className="text-lg text-slate-500 max-w-2xl font-medium">Track your upcoming spiritual experiences and past adventures in Sikkim.</p>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-200 mb-10 text-[10px] font-black uppercase tracking-widest">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`pb-4 px-6 border-b-2 transition-all ${
              activeTab === "bookings"
                ? "border-teal-600 text-teal-600 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Official Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("reservations")}
            className={`pb-4 px-6 border-b-2 transition-all ${
              activeTab === "reservations"
                ? "border-teal-600 text-teal-600 font-extrabold"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            Custom Tour Requests ({reservations.length})
          </button>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="space-y-6">
              {Array(3).fill(0).map((_, i) => (
                <BookingSkeleton key={i} />
              ))}
            </div>
          ) : activeTab === "bookings" ? (
            bookings.length === 0 ? (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-20 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6">
                  <Package size={40} />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest mb-8">You haven't booked any journeys yet.</p>
                <button
                  onClick={() => navigate("/packages")}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-all active:scale-95"
                >
                  Explore Packages <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              bookings.map((b) => (
                <div key={b._id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 group">
                  <div className="w-full md:w-48 aspect-[4/3] rounded-2xl overflow-hidden shadow-md flex-shrink-0 bg-slate-100">
                    <img
                      src={imgUrl(b.package?.image)}
                      alt={b.package?.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&fit=crop"; }}
                    />
                  </div>

                  <div className="flex-1 w-full space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <h3 className="text-2xl font-black text-slate-900 group-hover:text-teal-600 transition-colors">
                        {b.package?.name || "Package"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          b.bookingStatus === "confirmed" ? "bg-teal-50 border-teal-200 text-teal-600" :
                          b.bookingStatus === "pending" ? "bg-amber-50 border-amber-200 text-amber-600" :
                          "bg-red-50 border-red-200 text-red-500"
                        }`}>
                          {b.bookingStatus}
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
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                        <Calendar size={16} className="text-teal-500" />
                        {new Date(b.travelStartDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                        <Users size={16} className="text-teal-500" />
                        {b.persons} {b.persons === 1 ? "Traveler" : "Travelers"}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                        <CreditCard size={16} className="text-teal-500" />
                        ₹{b.totalAmount}
                      </div>
                    </div>
                    {b.bookingStatus === "confirmed" && (
                      b.driver ? (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-2 text-xs font-bold text-slate-700">
                            <p className="text-emerald-700 font-extrabold text-[10px] uppercase tracking-wider">Allocated Driver Details</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
                              <p><span className="text-slate-400 font-medium">Driver Name:</span> {b.driver.name}</p>
                              <p><span className="text-slate-400 font-medium">Contact Phone:</span> {b.driver.phone}</p>
                              <p><span className="text-slate-400 font-medium">Vehicle Model:</span> {b.driver.vehicleType}</p>
                              <p><span className="text-slate-400 font-medium">Reg Number:</span> {b.driver.vehicleNumber}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 flex">
                          <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-full">
                            Driver Allocation Pending
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  <div className="w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8 flex-shrink-0 flex flex-col gap-3">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-teal-50 hover:bg-teal-600 text-teal-600 hover:text-white font-bold rounded-xl transition-all text-xs uppercase tracking-widest cursor-pointer"
                    >
                      View Receipt
                    </button>
                    {b.bookingStatus === "confirmed" && (
                      <>
                        <button
                          onClick={() => navigate(`/itinerary/${b._id}`)}
                          className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white font-bold rounded-xl transition-all text-xs uppercase tracking-widest cursor-pointer"
                        >
                          View Itinerary
                        </button>
                        <button
                          onClick={() => handleDownloadItinerary(b._id)}
                          className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-teal-50 hover:bg-teal-600 text-teal-600 hover:text-white font-bold rounded-xl transition-all text-xs uppercase tracking-widest cursor-pointer"
                        >
                          Download Itinerary PDF
                        </button>
                      </>
                    )}
                    {b.bookingStatus === "confirmed" && b.package && (
                      userReviewsMap[b.package._id] ? (
                        <span className="w-full md:w-auto text-center px-5 py-3 bg-emerald-50 text-emerald-600 font-bold rounded-xl text-xs uppercase tracking-widest border border-emerald-100/50">
                          Review Submitted ✓
                        </span>
                      ) : (
                        <button
                          onClick={() => triggerReviewModal(b.package._id, b.package.name)}
                          className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-amber-50 hover:bg-amber-600 text-amber-600 hover:text-white font-bold rounded-xl transition-all text-xs uppercase tracking-widest cursor-pointer"
                        >
                          Write Review
                        </button>
                      )
                    )}
                    {b.bookingStatus !== "cancelled" && b.cancelStatus !== "pending" && b.cancelStatus !== "approved" && b.cancelStatus !== "rejected" && (
                      <button
                        onClick={() => triggerCancelModal(b._id)}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white font-bold rounded-xl transition-all text-xs uppercase tracking-widest cursor-pointer"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              ))
            )
          ) : (
            /* CUSTOM RESERVATIONS LIST */
            reservations.length === 0 ? (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-20 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6">
                  <Package size={40} className="text-slate-300" />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest mb-8">You haven't requested any custom tours yet.</p>
                <button
                  onClick={() => navigate("/custom-builder")}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-all active:scale-95"
                >
                  Plan Custom Tour <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <div className="space-y-12">
                {/* APPROVED CUSTOM TOURS */}
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Sparkles className="text-teal-600 animate-pulse" size={20} />
                    Approved Custom Tours
                  </h2>
                  
                  {reservations.filter(r => r.status === "Approved").length === 0 ? (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-10 text-center text-slate-400 font-bold text-sm">
                      No approved custom tours found. Once the admin approves your request, it will appear here.
                    </div>
                  ) : (
                    reservations.filter(r => r.status === "Approved").map((r) => {
                      const packageId = r.customPackage?._id || (typeof r.customPackage === "string" ? r.customPackage : null);
                      return (
                        <div key={r._id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 group">
                          <div className="flex-1 w-full space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <h3 className="text-2xl font-black text-slate-900 group-hover:text-teal-600 transition-colors">
                                {r.aiGeneratedPlan?.name || `Custom ${r.interests} Tour`}
                              </h3>
                              <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-teal-50 border-teal-200 text-teal-600">
                                Approved
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-slate-500 border-b border-slate-50 pb-3">
                              <div><span className="text-slate-400 font-medium">Region:</span> {r.region}</div>
                              <div><span className="text-slate-400 font-medium">Duration:</span> {r.aiGeneratedPlan?.duration}</div>
                              <div><span className="text-slate-400 font-medium">Budget Class:</span> <span className="capitalize">{r.budget}</span></div>
                              <div><span className="text-slate-400 font-medium">Approved Price:</span> <span className="text-teal-600 font-black">₹{r.estimatedPrice}</span></div>
                            </div>

                            {r.adminRemarks && (
                              <div className="p-4 bg-teal-50/30 border border-teal-100/50 rounded-xl text-xs font-bold text-slate-600">
                                <span className="text-teal-700 block font-black uppercase tracking-widest text-[9px] mb-1">Admin Remarks:</span>
                                {r.adminRemarks}
                              </div>
                            )}
                          </div>

                          <div className="w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-8 flex-shrink-0 flex flex-col gap-3">
                            {!r.booking ? (
                              packageId ? (
                                <button
                                  onClick={() => navigate(`/booking/${packageId}`)}
                                  className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl shadow-lg transition-all text-xs uppercase tracking-widest cursor-pointer animate-bounce"
                                >
                                  Confirm & Book Now <ArrowRight size={14} />
                                </button>
                              ) : (
                                <div className="space-y-1 text-center md:text-right">
                                  <button
                                    disabled
                                    className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-slate-200 text-slate-400 font-bold rounded-xl text-xs uppercase tracking-widest cursor-not-allowed"
                                  >
                                    Confirm & Book Now
                                  </button>
                                  <p className="text-[10px] text-amber-600 font-bold">Package generation pending</p>
                                </div>
                              )
                            ) : (
                              <button
                                onClick={() => {
                                  setActiveTab("bookings");
                                  setSearchParams({});
                                }}
                                className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white font-bold rounded-xl transition-all text-xs uppercase tracking-widest cursor-pointer"
                              >
                                View Booking <ArrowRight size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* PENDING & REJECTED REQUESTS */}
                <div className="space-y-6">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Calendar className="text-slate-600" size={20} />
                    Pending & Rejected Requests
                  </h2>
                  
                  {reservations.filter(r => r.status !== "Approved").length === 0 ? (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-10 text-center text-slate-400 font-bold text-sm">
                      No pending or rejected requests found.
                    </div>
                  ) : (
                    reservations.filter(r => r.status !== "Approved").map((r) => (
                      <div key={r._id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 group">
                        <div className="flex-1 w-full space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <h3 className="text-2xl font-black text-slate-900 group-hover:text-teal-600 transition-colors">
                              {r.aiGeneratedPlan?.name || `Custom ${r.interests} Tour`}
                            </h3>
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              r.status === "Pending" ? "bg-amber-50 border-amber-200 text-amber-600 animate-pulse" :
                              "bg-red-50 border-red-200 text-red-500"
                            }`}>
                              {r.status === "Pending" ? "Awaiting Approval" : r.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-slate-500 border-b border-slate-50 pb-3">
                            <div><span className="text-slate-400 font-medium">Region:</span> {r.region}</div>
                            <div><span className="text-slate-400 font-medium">Duration:</span> {r.aiGeneratedPlan?.duration}</div>
                            <div><span className="text-slate-400 font-medium">Budget Class:</span> <span className="capitalize">{r.budget}</span></div>
                            <div><span className="text-slate-400 font-medium">Est. Price:</span> <span className="text-teal-600 font-black">₹{r.estimatedPrice}</span></div>
                          </div>

                          {r.adminRemarks && (
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600">
                              <span className="text-slate-400 block font-medium uppercase tracking-widest text-[9px] mb-1">Admin Remarks:</span>
                              {r.adminRemarks}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedBooking && (
        <BookingReceipt
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}

      {/* Cancellation Reason Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-10 md:p-12 max-w-lg w-full space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900">Reason for Cancellation</h3>
              <button 
                onClick={() => setShowCancelModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              Please enter your reason for cancellation below. Refund calculations will be based on the cancellation policy:
            </p>
            
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-800 font-bold space-y-1">
              <p>• 30+ Days prior = 90% Refund</p>
              <p>• 15-29 Days prior = 50% Refund</p>
              <p>• 7-14 Days prior = 25% Refund</p>
              <p>• Less than 7 Days prior = No Refund</p>
            </div>
            
            <form onSubmit={handleCancelSubmit} className="space-y-6">
              <div className="relative">
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Why are you cancelling your journey? (Minimum 10, maximum 250 characters)..."
                  rows={4}
                  maxLength={250}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 pb-10 outline-none focus:border-teal-500 focus:bg-white text-slate-900 placeholder:text-slate-400 font-medium transition-all resize-none text-sm leading-relaxed"
                  required
                />
                <div className={`absolute bottom-3 right-4 text-[10px] font-black tracking-widest ${
                  cancellationReason.trim().length >= 10 ? 'text-slate-400' : 'text-amber-500'
                }`}>
                  {cancellationReason.length} / 250
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3.5 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold rounded-xl transition-all text-xs uppercase tracking-widest cursor-pointer"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel || cancellationReason.trim().length < 10 || cancellationReason.trim().length > 250}
                  className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-100 disabled:cursor-not-allowed"
                >
                  {submittingCancel ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Submitting
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-10 md:p-12 max-w-lg w-full space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900">Write a Review</h3>
              <button 
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-slate-500 font-medium text-sm leading-relaxed">
              Share your spiritual adventure details for <span className="text-teal-600 font-bold">{reviewPackageName}</span>. Your feedback helps other travelers choose their journeys!
            </p>
            
            <form onSubmit={handleReviewSubmit} className="space-y-6">
              {/* Star Rating Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">Your Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormRating(star)}
                      className="text-amber-500 hover:scale-110 transition-transform duration-200"
                    >
                      <Star
                        size={32}
                        className={star <= formRating ? "fill-amber-500 text-amber-500" : "text-slate-300"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Input */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">Your Experience</label>
                <div className="relative">
                  <textarea
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Write details of the monasteries, accommodation, food, and Sikkim landscape... (Minimum 10 characters)"
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 outline-none focus:border-teal-500 focus:bg-white text-slate-900 placeholder:text-slate-400 font-medium transition-all resize-none text-sm leading-relaxed"
                    required
                  />
                  <div className={`absolute bottom-3 right-4 text-[10px] font-black tracking-widest ${
                    formComment.trim().length >= 10 ? 'text-slate-400' : 'text-amber-500'
                  }`}>
                    {formComment.length} chars
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-3.5 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold rounded-xl transition-all text-xs uppercase tracking-widest cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || formComment.trim().length < 10}
                  className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-100 disabled:cursor-not-allowed shadow-lg shadow-teal-600/10"
                >
                  {submittingReview ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Submitting
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
