import { useEffect, useState } from "react";
import { ShieldAlert, Save, RefreshCcw } from "lucide-react";
import API from "../services/api";
import { showSuccess, showError } from "../utils/toast";

const AdminPolicy = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchPolicy = async () => {
    try {
      setFetching(true);
      const res = await API.get("/policy");
      if (res.data) {
        setTitle(res.data.title || "");
        setDescription(res.data.description || "");
      }
    } catch (err) {
      showError("Failed to load policy");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const savePolicy = async () => {
    if (!title.trim() || !description.trim()) {
      showError("Please fill in both title and description");
      return;
    }
    try {
      setLoading(true);
      await API.post("/policy", { title, description });
      showSuccess("Policy updated successfully");
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to update policy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Cancellation <span className="text-teal-600">Policy</span></h1>
          <p className="text-slate-500 font-medium">Define the terms for bookings, cancellations, and refunds.</p>
        </div>
        <button 
          onClick={fetchPolicy} 
          className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-teal-600 transition-all shadow-sm"
        >
          <RefreshCcw size={20} className={fetching ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10 space-y-8">
        <div className="flex items-start gap-4 p-6 bg-teal-50 border border-teal-100 rounded-2xl">
          <ShieldAlert className="text-teal-600 shrink-0" size={24} />
          <p className="text-slate-600 text-sm font-medium leading-relaxed">
            This policy is critical as it will be displayed to all users during the booking checkout. Please ensure the terms are clear, fair, and legally compliant.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Policy Title</label>
            <input 
              className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              placeholder="e.g. Terms & Conditions of Cancellation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Policy Description</label>
            <textarea 
              className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium min-h-[300px]"
              placeholder="Detail out the cancellation stages, refund percentages, and timelines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={12}
            />
          </div>

          <div className="flex justify-end pt-4">
            <button 
              onClick={savePolicy} 
              className="inline-flex items-center justify-center gap-2 px-12 py-4 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-teal-900/10 active:scale-95"
              disabled={loading}
            >
              {loading ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPolicy;
