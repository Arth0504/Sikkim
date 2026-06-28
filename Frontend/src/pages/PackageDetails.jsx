import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, CheckCircle, ArrowLeft, Loader2, Sparkles, Star, MessageSquare, Trash2, Edit3, Heart } from "lucide-react";
import API from "../services/api";
import imgUrl from "../utils/imgUrl";
import { showSuccess, showError } from "../utils/toast";
import { DetailSkeleton } from "../components/SkeletonLoader";

const DEFAULT_IMG = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee";

const PackageDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);

  // Review States
  const [reviews, setReviews] = useState([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [userReview, setUserReview] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Wishlist State
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const res = await API.get(`/reviews/package/${id}`);
      setReviews(res.data.reviews || []);
      setTotalReviews(res.data.totalReviews || 0);
      setAvgRating(res.data.avgRating || 0);
      setUserReview(res.data.userReview || null);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const checkWishlistStatus = async () => {
    const token = sessionStorage.getItem("userToken");
    if (!token) return;
    try {
      const res = await API.get("/wishlist");
      const wishlisted = res.data.some((item) => String(item.package?._id) === String(id));
      setIsInWishlist(wishlisted);
    } catch (err) {
      console.error("Failed to check wishlist status:", err);
    }
  };

  const handleWishlistToggle = async () => {
    const token = sessionStorage.getItem("userToken");
    if (!token) {
      showError("Please log in to add this package to your wishlist");
      navigate("/login");
      return;
    }
    try {
      setWishlistLoading(true);
      if (isInWishlist) {
        await API.delete(`/wishlist/${id}`);
        setIsInWishlist(false);
        showSuccess("Removed from Wishlist ❤️");
      } else {
        await API.post("/wishlist", { packageId: id });
        setIsInWishlist(true);
        showSuccess("Added to Wishlist ❤️");
      }
      window.dispatchEvent(new Event("wishlist-update"));
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!formComment.trim()) {
      showError("Please enter a comment");
      return;
    }
    try {
      setSubmittingReview(true);
      if (isEditing && userReview) {
        const res = await API.put(`/reviews/${userReview._id}`, { rating: formRating, comment: formComment });
        showSuccess(res.data.message || "Review updated successfully!");
      } else {
        const res = await API.post(`/reviews`, { packageId: id, rating: formRating, comment: formComment });
        showSuccess(res.data.message || "Review submitted successfully!");
      }
      setShowReviewForm(false);
      setIsEditing(false);
      setFormComment("");
      fetchReviews();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;
    try {
      await API.delete(`/reviews/${reviewId}`);
      showSuccess("Review deleted successfully ✅");
      fetchReviews();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete review");
    }
  };

  const handleStartEdit = () => {
    if (userReview) {
      setFormRating(userReview.rating);
      setFormComment(userReview.comment);
      setIsEditing(true);
      setShowReviewForm(true);
    }
  };

  useEffect(() => {
    API.get(`/packages/${id}`)
      .then((res) => {
        setPkg(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    fetchReviews();
    checkWishlistStatus();
  }, [id]);

  if (loading) return <DetailSkeleton />;

  if (!pkg) return (
    <div className="min-h-screen flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest">
      Package Not Found
    </div>
  );

  const parsePolicies = (policiesStr) => {
    if (!policiesStr) return [];
    return policiesStr
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^[•\-\*\d+\.\s]+/, ""));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HERO SECTION */}
      <div className="relative h-[70vh] min-h-[600px] overflow-hidden">
        <img src={imgUrl(pkg.image)} alt={pkg.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-end pb-20 px-6">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="flex items-center justify-between gap-4 mb-8">
              <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 text-white/70 hover:text-white font-bold uppercase tracking-widest text-xs transition-colors"
              >
                <ArrowLeft size={16} /> Back to Experiences
              </button>
              <button
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
                className={`flex items-center justify-center p-3 rounded-full transition-all duration-300 ${
                  isInWishlist 
                    ? "bg-rose-600 text-white shadow-xl shadow-rose-600/30 hover:bg-rose-700" 
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                }`}
                title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                {wishlistLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Heart size={20} className={isInWishlist ? "fill-current" : ""} />
                )}
              </button>
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                <Sparkles size={12} /> Curated Experience
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight">{pkg.name}</h1>
              <div className="flex flex-wrap items-center gap-6 text-white/80 font-bold uppercase tracking-[0.1em] text-sm">
                <span className="flex items-center gap-2"><Clock size={18} className="text-teal-500" /> {pkg.duration}</span>
                <span className="flex items-center gap-2"><MapPin size={18} className="text-teal-500" /> Sikkim Himalayas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8 space-y-12">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10 md:p-14">
              <h2 className="text-3xl font-black text-slate-900 mb-8">Experience Overview</h2>
              <p className="text-slate-600 text-lg leading-relaxed font-medium">
                {pkg.description}
              </p>
            </div>





            {pkg.policies && (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 p-10">
                <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">Policies & Guidelines</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {parsePolicies(pkg.policies).map((policy, idx) => (
                    <div key={idx} className="flex gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-teal-50/20 hover:border-teal-100/50 hover:shadow-md">
                      <CheckCircle className="text-teal-600 shrink-0 mt-0.5" size={18} />
                      <p className="text-slate-600 font-medium text-sm leading-relaxed">{policy}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REVIEWS SECTION */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10 md:p-14 space-y-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-900">Traveler Reviews</h3>
                  <p className="text-sm font-bold text-slate-500 mt-1">Real guest feedback and experiences</p>
                </div>
                
                {/* Stats Summary */}
                <div className="flex items-center gap-4 bg-teal-50/50 border border-teal-100/50 rounded-2xl px-6 py-4">
                  <div className="text-center">
                    <div className="text-3xl font-black text-slate-900 flex items-center justify-center gap-1">
                      <Star className="text-amber-500 fill-amber-500 shrink-0" size={24} />
                      {avgRating || "0.0"}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-0.5">
                      {totalReviews} {totalReviews === 1 ? "Review" : "Reviews"}
                    </div>
                  </div>
                </div>
              </div>

              {/* User Review Form / CTA */}
              {!userReview && !showReviewForm && (
                <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h4 className="text-lg font-black text-slate-800">Shared this experience?</h4>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      Only travelers who have completed a reservation can share their experience.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!sessionStorage.getItem("userToken")) {
                        showError("Please log in to write a review");
                        navigate("/login");
                      } else {
                        setShowReviewForm(true);
                        setIsEditing(false);
                        setFormRating(5);
                        setFormComment("");
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all shadow-md shrink-0"
                  >
                    <MessageSquare size={16} /> Write a Review
                  </button>
                </div>
              )}

              {/* Review Input Form */}
              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="bg-slate-50 border border-slate-200/50 rounded-3xl p-8 space-y-6">
                  <h4 className="text-xl font-black text-slate-955">{isEditing ? "Edit Your Review" : "Write Your Review"}</h4>
                  
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
                            size={28}
                            className={star <= formRating ? "fill-amber-500" : "text-slate-300"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Review Text */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">Your Experience</label>
                    <textarea
                      rows={4}
                      value={formComment}
                      onChange={(e) => setFormComment(e.target.value)}
                      placeholder="Tell future travelers about your tour, the guides, and monasteries..."
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-sm"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-5 py-3 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl transition-all uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold text-xs rounded-xl transition-all uppercase tracking-wider shadow-lg shadow-teal-600/10 flex items-center gap-2"
                    >
                      {submittingReview && <Loader2 size={14} className="animate-spin" />}
                      Submit Review
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-6">
                {/* Current User's Review (Approved or Pending) */}
                {userReview && (
                  <div className="bg-slate-50 border border-teal-200/50 rounded-[2rem] p-8 space-y-4 relative">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-black uppercase text-lg border border-teal-200">
                          {userReview.user?.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900">{userReview.user?.name || "You"}</span>
                            <span className="px-2 py-0.5 bg-teal-600 text-white text-[8px] font-black uppercase tracking-wider rounded-md">Your Review</span>
                            {!userReview.isApproved && (
                              <span className="px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase tracking-wider rounded-md">Pending Approval</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < userReview.rating ? "fill-amber-500 font-black text-amber-500" : "text-slate-300"}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Edit / Delete Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleStartEdit}
                          className="p-2 bg-white text-slate-600 border border-slate-100 hover:border-slate-200 hover:text-slate-900 rounded-xl transition-all shadow-sm"
                          title="Edit Review"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteReview(userReview._id)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"
                          title="Delete Review"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed italic">
                      "{userReview.comment}"
                    </p>
                  </div>
                )}

                {/* Other Approved Reviews */}
                {reviewsLoading ? (
                  <div className="space-y-6">
                    {Array(2).fill(0).map((_, i) => (
                      <div key={i} className="animate-pulse space-y-3 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-200 rounded-full shimmer" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-32 bg-slate-200 rounded shimmer" />
                            <div className="h-3 w-20 bg-slate-200 rounded shimmer" />
                          </div>
                        </div>
                        <div className="h-4 w-5/6 bg-slate-200 rounded shimmer pl-16" />
                      </div>
                    ))}
                  </div>
                ) : reviews.filter((r) => r._id !== userReview?._id).length === 0 ? (
                  !userReview && (
                    <div className="text-center py-12 bg-slate-50/50 border border-dashed border-slate-200 rounded-[2rem] space-y-3 p-8">
                      <MessageSquare className="mx-auto text-slate-300" size={40} />
                      <p className="text-slate-500 font-bold text-sm">No reviews yet for this package.</p>
                      <p className="text-xs text-slate-400 font-medium">Be the first to share your thoughts!</p>
                    </div>
                  )
                ) : (
                  <div className="space-y-6">
                    {reviews
                      .filter((r) => r._id !== userReview?._id)
                      .map((review) => (
                        <div key={review._id} className="border-b border-slate-100 pb-6 last:border-b-0 last:pb-0 space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-black uppercase text-lg border border-slate-200">
                              {review.user?.name?.charAt(0) || "G"}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{review.user?.name || "Guest Traveler"}</div>
                              <div className="flex items-center gap-1 mt-0.5 text-amber-500">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    size={14}
                                    className={i < review.rating ? "fill-amber-500 font-black text-amber-500" : "text-slate-300"}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 ml-auto">
                              {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                            </span>
                          </div>
                          <p className="text-slate-600 text-sm font-medium leading-relaxed pl-16">
                            {review.comment}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BOOKING WIDGET */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-6">
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10 space-y-8">
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Price per Traveler</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-slate-900">₹{pkg.price}</span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">/ All Inc.</span>
                  </div>
                </div>

                <ul className="space-y-4 pt-6 border-t border-slate-100">
                  {["Expert Local Guide", "Premium Stay", "All Meals Included", "Secure Transport"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                      <CheckCircle size={18} className="text-teal-500" /> {item}
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => navigate(`/booking/${pkg._id}`)}
                  className="inline-flex items-center justify-center gap-2 px-8 py-5 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-all duration-300 w-full shadow-2xl shadow-teal-600/20"
                >
                  Confirm Reservation
                </button>
              </div>

              <div className="p-8 rounded-3xl bg-slate-100 border border-slate-200 text-center">
                <p className="text-xs font-bold text-slate-500 mb-1">Secure Payment Processing</p>
                <div className="flex justify-center gap-3 grayscale opacity-50">
                  {/* Icons or text for payment methods can go here */}
                  <span className="text-[10px] font-black uppercase tracking-widest">Razorpay Protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageDetails;