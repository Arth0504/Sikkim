import { useEffect, useState } from "react";
import { 
  Compass, Coins, Calendar, User, CheckCircle, RefreshCcw, 
  AlertCircle, ShieldCheck, XCircle, Edit, MapPin, Eye, X, BookOpen, MessageSquare
} from "lucide-react";
import API from "../services/api";
import { showSuccess, showError } from "../utils/toast";

const AdminCustomRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  
  // Modal states
  const [selectedReq, setSelectedReq] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [price, setPrice] = useState(0);
  const [itinerary, setItinerary] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/reservations");
      setRequests(res.data || []);
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const openDetailsModal = (req) => {
    setSelectedReq(req);
    setRemarks(req.adminRemarks || "");
    setPrice(req.estimatedPrice || 0);
    setItinerary(req.aiGeneratedPlan?.itinerary || []);
    setShowModal(true);
  };

  const handleItineraryChange = (index, field, value) => {
    const updated = [...itinerary];
    updated[index][field] = value;
    setItinerary(updated);
  };

  const submitApproval = async (statusVal) => {
    if (!selectedReq) return;
    
    setActionLoadingId(selectedReq._id);
    try {
      const updatedPlan = {
        ...selectedReq.aiGeneratedPlan,
        itinerary: itinerary
      };

      const payload = {
        status: statusVal,
        adminRemarks: remarks,
        estimatedPrice: Number(price),
        aiGeneratedPlan: updatedPlan
      };

      await API.put(`/admin/reservations/${selectedReq._id}`, payload);
      showSuccess(`Custom Tour Request ${statusVal} successfully!`);
      setShowModal(false);
      fetchReservations();
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
          <h1 className="text-3xl font-black text-slate-900">Custom Tour <span className="text-teal-600">Requests</span></h1>
          <p className="text-slate-500 font-medium">Manage and approve customized AI itineraries requested by users.</p>
        </div>
        <button 
          onClick={fetchReservations} 
          className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-teal-600 transition-all shadow-sm cursor-pointer animate-fade-in"
        >
          <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCcw size={40} className="text-teal-600 animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-20 text-center flex flex-col items-center">
          <CheckCircle className="text-teal-500 mb-6" size={64} />
          <p className="text-slate-900 font-black text-2xl mb-2">Queue Clear!</p>
          <p className="text-slate-400 font-medium">No custom tour requests found in the system.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">User & Plan Name</th>
                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Specifications</th>
                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Financials</th>
                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-6 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {requests.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* User & Title */}
                      <td className="px-6 py-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">ID: {r._id}</p>
                          <p className="text-slate-900 font-bold text-base leading-none">{r.aiGeneratedPlan?.name || "Custom Tour"}</p>
                          <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <User size={12} className="text-teal-600" /> {r.user?.name || "Guest User"} ({r.user?.email || ""})
                          </p>
                        </div>
                      </td>

                      {/* Specs */}
                      <td className="px-6 py-6">
                        <div className="space-y-1.5 text-xs font-bold text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-teal-600" />
                            <span>Region: {r.region}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-teal-600" />
                            <span>Duration: {r.aiGeneratedPlan?.duration}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Compass size={13} className="text-teal-600" />
                            <span className="capitalize">Interest: {r.interests}</span>
                          </div>
                        </div>
                      </td>

                      {/* Financials */}
                      <td className="px-6 py-6">
                        <div>
                          <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest block">Estimated Price</span>
                          <span className="text-teal-600 font-black text-base">₹{r.estimatedPrice}</span>
                          <span className="text-[10px] text-slate-400 block font-bold mt-0.5">Budget Preference: <span className="capitalize">{r.budget}</span></span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-6">
                        <div className="space-y-1.5">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border inline-block ${
                            r.status === "Approved" ? "bg-teal-50 border-teal-200 text-teal-600" :
                            r.status === "Pending" ? "bg-amber-50 border-amber-200 text-amber-600 animate-pulse" :
                            "bg-red-50 border-red-200 text-red-500"
                          }`}>
                            {r.status}
                          </span>
                          {r.booking && (
                            <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border bg-emerald-50 border-emerald-200 text-emerald-600 block w-max">
                              Booking Created
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-6 text-right">
                        <button
                          onClick={() => openDetailsModal(r)}
                          className="inline-flex items-center gap-1 px-4 py-2.5 bg-teal-50 hover:bg-teal-600 text-teal-600 hover:text-white border border-teal-100 font-bold rounded-xl transition-all duration-300 text-[10px] uppercase tracking-widest cursor-pointer shadow-sm shadow-teal-600/5"
                        >
                          <Edit size={12} />
                          Review & Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Review & Approve Modal */}
      {showModal && selectedReq && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-teal-50 border border-teal-100 text-teal-700 text-[9px] font-black uppercase tracking-widest rounded-full mb-1">
                  Custom Tour Review
                </span>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">
                  {selectedReq.aiGeneratedPlan?.name}
                </h3>
                <p className="text-slate-400 font-bold text-[10px] mt-0.5">Requested by: {selectedReq.user?.name} ({selectedReq.user?.email})</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content Split Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              {/* Left Column: Form Adjustments */}
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <Coins size={14} className="text-teal-600" /> Pricing & Specifications
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Target Budget</label>
                    <input value={selectedReq.budget} readOnly className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-700 font-bold capitalize cursor-not-allowed text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Region</label>
                    <input value={selectedReq.region} readOnly className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-700 font-bold cursor-not-allowed text-xs" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-teal-600 flex items-center gap-1">Estimated Cost (INR)</label>
                  <input 
                    type="number" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl px-4 py-3 outline-none text-slate-900 font-black text-sm" 
                  />
                  <p className="text-[9px] font-bold text-slate-400">Modify this estimate to adjust the pricing before approving.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <MessageSquare size={12} className="text-teal-600" /> Admin remarks
                  </label>
                  <textarea 
                    value={remarks} 
                    onChange={(e) => setRemarks(e.target.value)} 
                    rows={4}
                    placeholder="Enter remarks for approval or rejection reason..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl px-4 py-3 outline-none text-slate-900 font-medium text-xs resize-none" 
                  />
                </div>
              </div>

              {/* Right Column: Itinerary Details & Modification */}
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <BookOpen size={14} className="text-teal-600" /> Itinerary schedule
                </h4>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 border border-slate-100 p-4 rounded-2xl bg-slate-50/50">
                  {itinerary.map((day, idx) => (
                    <div key={day.day} className="space-y-2 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-teal-600">Day {day.day}</span>
                      <input 
                        type="text" 
                        value={day.title} 
                        onChange={(e) => handleItineraryChange(idx, "title", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-teal-600"
                        placeholder="Day Title"
                      />
                      <textarea 
                        value={day.description} 
                        onChange={(e) => handleItineraryChange(idx, "description", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-slate-500 outline-none focus:border-teal-600 resize-none"
                        rows={2}
                        placeholder="Day Description"
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="flex gap-4 border-t border-slate-100 pt-6 justify-end items-center">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-3 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold rounded-xl transition-all text-xs uppercase tracking-widest cursor-pointer"
              >
                Close
              </button>
              
              {selectedReq.status === "Pending" && (
                <>
                  <button
                    onClick={() => submitApproval("Rejected")}
                    disabled={actionLoadingId === selectedReq._id}
                    className="inline-flex items-center gap-1.5 px-6 py-3 bg-red-50 hover:bg-red-600 text-red-500 hover:text-white border border-red-100 font-bold rounded-xl transition-all text-xs uppercase tracking-widest cursor-pointer disabled:opacity-50"
                  >
                    Reject Tour
                  </button>
                  <button
                    onClick={() => submitApproval("Approved")}
                    disabled={actionLoadingId === selectedReq._id}
                    className="inline-flex items-center gap-1.5 px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all text-xs uppercase tracking-widest cursor-pointer disabled:opacity-50 shadow-lg shadow-teal-600/10"
                  >
                    Approve Tour
                  </button>
                </>
              )}

              {selectedReq.status !== "Pending" && (
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Processed ({selectedReq.status})
                </span>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomRequests;
