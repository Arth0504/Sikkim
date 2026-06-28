import { useEffect, useState } from "react";
import { Star, Check, X, Trash2, Search, MessageSquare, AlertCircle } from "lucide-react";
import API from "../utils/api";
import { showSuccess, showError } from "../utils/toast";

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await API.get("/reviews/admin/all");
      setReviews(res.data);
    } catch (err) {
      showError(err.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reviewId, newStatus) => {
    try {
      const res = await API.put(`/reviews/admin/${reviewId}/status`, { isApproved: newStatus });
      showSuccess(res.data.message);
      // Update state locally
      setReviews((prev) =>
        prev.map((r) => (r._id === reviewId ? { ...r, isApproved: newStatus } : r))
      );
    } catch (err) {
      showError(err.response?.data?.message || "Failed to update review status");
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review permanently?")) return;
    try {
      await API.delete(`/reviews/admin/${reviewId}`);
      showSuccess("Review deleted successfully ✅");
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (err) {
      showError(err.response?.data?.message || "Failed to delete review");
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const searchLower = search.toLowerCase();
    const pkgName = r.package?.name?.toLowerCase() || "";
    const userName = r.user?.name?.toLowerCase() || "";
    const userEmail = r.user?.email?.toLowerCase() || "";
    const comment = r.comment?.toLowerCase() || "";
    return pkgName.includes(searchLower) || userName.includes(searchLower) || userEmail.includes(searchLower) || comment.includes(searchLower);
  });

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Review Moderation</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">
            Approve, reject, or delete package reviews left by travelers
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center shadow-sm space-y-4">
          <MessageSquare className="mx-auto text-slate-300" size={48} />
          <p className="text-lg font-black text-slate-700">No Reviews Found</p>
          <p className="text-sm font-bold text-slate-500">
            {search ? "No reviews matched your search criteria." : "No traveler reviews have been submitted yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75">
                  <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400">Package</th>
                  <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400">Traveler</th>
                  <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400">Rating</th>
                  <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400">Comment</th>
                  <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400">Status</th>
                  <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReviews.map((review) => (
                  <tr key={review._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 align-top">
                      <div className="font-black text-slate-900">{review.package?.name || "Deleted Package"}</div>
                      <div className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-wider">
                        ID: {review.package?._id || "N/A"}
                      </div>
                    </td>
                    <td className="p-6 align-top">
                      <div className="font-bold text-slate-800">{review.user?.name || "Unknown"}</div>
                      <div className="text-xs text-slate-500 font-semibold">{review.user?.email || "N/A"}</div>
                    </td>
                    <td className="p-6 align-top">
                      <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-xl w-fit font-black text-sm border border-amber-100">
                        <Star size={14} className="fill-current" />
                        {review.rating}
                      </div>
                    </td>
                    <td className="p-6 align-top max-w-md">
                      <p className="text-slate-600 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                        {review.comment}
                      </p>
                      <div className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                        Submitted: {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-6 align-top">
                      {review.isApproved ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-black uppercase tracking-wider rounded-full">
                          <Check size={12} /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black uppercase tracking-wider rounded-full">
                          <AlertCircle size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="p-6 align-top text-right">
                      <div className="flex items-center justify-end gap-2">
                        {review.isApproved ? (
                          <button
                            onClick={() => handleStatusChange(review._id, false)}
                            title="Reject/Hide Review"
                            className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 rounded-xl transition-all"
                          >
                            <X size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(review._id, true)}
                            title="Approve Review"
                            className="p-2 bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white rounded-xl transition-all shadow-sm"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(review._id)}
                          title="Delete Permanently"
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
