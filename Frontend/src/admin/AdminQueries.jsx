import { useEffect, useState, useCallback } from "react";
import {
  MessageSquare,
  Mail,
  MailOpen,
  User,
  Phone,
  Search,
  Filter,
  CheckCircle,
  RefreshCcw,
  Send,
  X,
  Clock,
  BookOpen,
  ArrowRight,
  Eye,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import API from "../services/api";
import { showSuccess, showError } from "../utils/toast";

const AdminQueries = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [closing, setClosing] = useState(false);

  // Fetch queries
  const fetchQueries = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (search.trim()) params.append("search", search.trim());

      const res = await API.get(`/admin/queries?${params.toString()}`);
      setQueries(res.data || []);
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to load queries");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  // Open details modal & transition status NEW -> IN_PROGRESS
  const handleOpenDetails = async (queryId) => {
    try {
      // Fetch details which triggers NEW -> IN_PROGRESS transition on backend
      const res = await API.get(`/admin/queries/${queryId}`);
      setSelectedQuery(res.data);
      setReplyText("");
      // Refresh list to show status updates
      fetchQueries();
    } catch (err) {
      showError("Failed to fetch query details");
    }
  };

  // Submit reply
  const handleSendReply = async () => {
    if (!replyText.trim()) {
      showError("Reply message cannot be empty");
      return;
    }

    try {
      setReplying(true);
      const res = await API.put(`/admin/queries/${selectedQuery._id}/reply`, {
        reply: replyText,
      });
      showSuccess("Reply sent and email delivered successfully! ✅");
      setSelectedQuery(res.data.query);
      setReplyText("");
      fetchQueries();
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  // Close query
  const handleCloseQuery = async () => {
    try {
      setClosing(true);
      const res = await API.put(`/admin/queries/${selectedQuery._id}/status`, {
        status: "CLOSED",
      });
      showSuccess("Query marked as CLOSED ✅");
      setSelectedQuery(res.data.query);
      fetchQueries();
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to close query");
    } finally {
      setClosing(false);
    }
  };

  // Toggle read status
  const handleToggleReadStatus = async (queryId, currentReadStatus) => {
    try {
      const res = await API.put(`/admin/queries/${queryId}/toggle-read`, {
        isAdminRead: !currentReadStatus,
      });
      showSuccess(`Query marked as ${!currentReadStatus ? "Read" : "Unread"} ✅`);
      if (selectedQuery && selectedQuery._id === queryId) {
        setSelectedQuery(res.data.query);
      }
      fetchQueries();
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to toggle read status");
    }
  };

  // Helper date formatter
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            Query <span className="text-teal-600">Management</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Track inquiries, manage timelines, and reply to customer questions.
          </p>
        </div>
        <button
          onClick={fetchQueries}
          className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-teal-600 hover:border-teal-300 transition-all shadow-sm flex items-center gap-2 font-bold text-xs uppercase tracking-widest"
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* CONTROLS SEARCH / FILTER */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, subject..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-sm font-medium text-slate-900 transition-all"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {["ALL", "NEW", "IN_PROGRESS", "REPLIED", "CLOSED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                statusFilter === status
                  ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/10"
                  : "bg-white text-slate-500 border-slate-200 hover:border-teal-400"
              }`}
            >
              {status === "IN_PROGRESS" ? "IN PROGRESS" : status}
            </button>
          ))}
        </div>
      </div>

      {/* QUERIES LIST */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="animate-spin text-teal-600" size={40} />
        </div>
      ) : queries.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-20 text-center flex flex-col items-center gap-4">
          <CheckCircle2 className="text-emerald-500" size={60} />
          <h3 className="text-xl font-black text-slate-900">Inbox Clean!</h3>
          <p className="text-slate-400 font-medium">No queries match the selected filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-8"></th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Ref ID</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Details</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-1/3">Subject & Message</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {queries.map((q) => (
                  <tr key={q._id} className={`hover:bg-slate-50/50 transition-colors ${!q.isAdminRead ? "bg-slate-50/50 font-semibold" : ""}`}>
                    <td className="px-6 py-6 text-center whitespace-nowrap">
                      <span
                        className={`inline-block w-2.5 h-2.5 rounded-full ${
                          q.isAdminRead ? "bg-slate-200" : "bg-blue-500 animate-pulse"
                        }`}
                        title={q.isAdminRead ? "Read" : "Unread"}
                      />
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm font-bold text-slate-500">
                      {formatDate(q.createdAt)}
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-sm font-mono font-bold text-teal-600">
                      {q.referenceId || "N/A"}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
                          {q.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{q.name}</p>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">{q.email}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{q.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-bold text-slate-900 text-sm mb-1 leading-tight">{q.subject}</p>
                      <p className="text-xs text-slate-500 leading-normal truncate max-w-sm">"{q.message}"</p>
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          q.status === "NEW"
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : q.status === "IN_PROGRESS"
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : q.status === "REPLIED"
                            ? "bg-teal-50 border-teal-200 text-teal-700"
                            : "bg-slate-100 border-slate-300 text-slate-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            q.status === "NEW"
                              ? "bg-blue-500"
                              : q.status === "IN_PROGRESS"
                              ? "bg-amber-500"
                              : q.status === "REPLIED"
                              ? "bg-teal-500"
                              : "bg-slate-500"
                          }`}
                        />
                        {q.status === "IN_PROGRESS" ? "IN PROGRESS" : q.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => handleToggleReadStatus(q._id, q.isAdminRead)}
                        className={`inline-flex items-center justify-center p-2 rounded-xl transition-all border ${
                          q.isAdminRead
                            ? "bg-slate-50 border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-200"
                            : "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                        }`}
                        title={q.isAdminRead ? "Mark as Unread" : "Mark as Read"}
                      >
                        {q.isAdminRead ? <MailOpen size={14} /> : <Mail size={14} />}
                      </button>
                      <button
                        onClick={() => handleOpenDetails(q._id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-teal-600 hover:text-white rounded-xl font-bold text-xs text-slate-700 transition-all"
                      >
                        <Eye size={14} />
                        View & Reply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL & REPLY MODAL */}
      {selectedQuery && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fadeIn">
            {/* Modal Header */}
            <div className="p-8 bg-slate-900 text-white flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">
                  Customer Inquiry Details
                </span>
                <h2 className="text-2xl font-black mt-1">{selectedQuery.subject}</h2>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs font-mono text-slate-300 bg-white/10 px-2 py-0.5 rounded">
                    Ref ID: {selectedQuery.referenceId || "N/A"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                      selectedQuery.isAdminRead ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"
                    }`}>
                      {selectedQuery.isAdminRead ? "Read" : "Unread"}
                    </span>
                    <button
                      onClick={() => handleToggleReadStatus(selectedQuery._id, selectedQuery.isAdminRead)}
                      className="text-xs text-teal-400 hover:text-teal-300 font-bold transition-all underline"
                    >
                      Mark as {selectedQuery.isAdminRead ? "Unread" : "Read"}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedQuery(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Query info + Reply */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                    Inquiry Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Customer Name</p>
                      <p className="font-bold text-slate-800">{selectedQuery.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Phone Number</p>
                      <p className="font-bold text-slate-800">{selectedQuery.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Email Address</p>
                      <p className="font-bold text-slate-800">{selectedQuery.email}</p>
                    </div>
                  </div>
                  <hr className="border-slate-200/60 my-4" />
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1.5">Original Message</p>
                    <p className="text-slate-700 leading-relaxed font-medium bg-white rounded-xl p-4 border border-slate-100 italic">
                      "{selectedQuery.message}"
                    </p>
                  </div>
                </div>

                {/* Acknowledgement Status Card */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                    Acknowledgement Email Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest">Ack Sent Timestamp</p>
                      <p className="font-bold text-slate-800 mt-1">
                        {selectedQuery.acknowledgementEmailSentAt ? formatDate(selectedQuery.acknowledgementEmailSentAt) : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest">Email Delivery Status</p>
                      <div className="mt-1">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            selectedQuery.acknowledgementEmailStatus === "DELIVERED"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : selectedQuery.acknowledgementEmailStatus === "FAILED"
                              ? "bg-rose-50 border-rose-200 text-rose-700"
                              : "bg-amber-50 border-amber-200 text-amber-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              selectedQuery.acknowledgementEmailStatus === "DELIVERED"
                                ? "bg-emerald-500"
                                : selectedQuery.acknowledgementEmailStatus === "FAILED"
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            }`}
                          />
                          {selectedQuery.acknowledgementEmailStatus || "PENDING"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reply History Timeline */}
                {selectedQuery.replies && selectedQuery.replies.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Reply History ({selectedQuery.replies.length})
                    </h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {selectedQuery.replies.map((reply, idx) => (
                        <div key={idx} className="bg-teal-50/40 border border-teal-100 rounded-2xl p-5 space-y-2">
                          <div className="flex justify-between items-start flex-wrap gap-2 text-[10px] text-teal-700 font-bold uppercase tracking-wider">
                            <span>Reply #{idx + 1} by {reply.sender || "Admin"}</span>
                            <div className="flex items-center gap-2 text-slate-500">
                              <span>Sent: {formatDate(reply.sentAt)}</span>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black tracking-widest border ${
                                reply.emailStatus === "DELIVERED"
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                  : "bg-rose-50 border-rose-200 text-rose-700"
                              }`}>
                                {reply.emailStatus || "DELIVERED"}
                              </span>
                            </div>
                          </div>
                          <p className="text-slate-700 text-sm leading-relaxed font-semibold">"{reply.message}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedQuery.adminReply ? (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Reply History (Legacy)
                    </h3>
                    <div className="bg-teal-50/40 border border-teal-100 rounded-2xl p-5 space-y-2">
                      <div className="flex justify-between items-start text-[10px] text-teal-700 font-bold uppercase tracking-wider">
                        <span>Admin Reply (Legacy)</span>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed font-semibold">"{selectedQuery.adminReply}"</p>
                    </div>
                  </div>
                ) : null}

                {/* Reply section */}
                {selectedQuery.status !== "CLOSED" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                        Compose Reply Response
                      </label>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your email reply response here..."
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/50 transition-all text-slate-800 resize-none font-medium"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={handleSendReply}
                        disabled={replying || !replyText.trim()}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl text-xs uppercase tracking-widest disabled:opacity-50 transition-all"
                      >
                        {replying ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Send Email Reply
                      </button>
                      <button
                        onClick={handleCloseQuery}
                        disabled={closing}
                        className="inline-flex items-center gap-1.5 px-6 py-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all"
                      >
                        {closing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                        Close Case
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-start gap-4 text-emerald-800">
                    <CheckCircle2 size={24} className="text-emerald-500 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-emerald-950 mb-1">Query Resolved</h4>
                      <p className="text-xs leading-relaxed font-medium">
                        This query has been marked as closed. No further replies can be sent.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Timeline */}
              <div className="lg:col-span-5 border-l border-slate-100 lg:pl-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">
                  Case Activity Timeline
                </h3>
                <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 pb-4">
                  {selectedQuery.timeline &&
                    selectedQuery.timeline.map((event, idx) => (
                      <div key={idx} className="relative pl-8">
                        {/* Dot icon indicator */}
                        <div className="absolute -left-[11px] top-1 bg-white border-2 border-teal-500 rounded-full w-5 h-5 flex items-center justify-center">
                          <div className="bg-teal-500 rounded-full w-2 h-2" />
                        </div>
                        <div>
                          <p className="font-black text-slate-800 text-xs uppercase tracking-wider">
                            {event.status}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                            {formatDate(event.timestamp)}
                          </p>
                          {event.notes && (
                            <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed max-w-xs truncate italic">
                              "{event.notes}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQueries;
