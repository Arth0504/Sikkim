import { useEffect, useState } from "react";
import { Bell, Search, Mail, Play, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import API from "../utils/api";
import { showSuccess, showError } from "../utils/toast";

const AdminReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sweeping, setSweeping] = useState(false);
  const [sendingManualId, setSendingManualId] = useState(null);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/reminders/stats");
      setReminders(res.data.reminders || []);
      setTotalSubscribers(res.data.totalSubscribers || 0);
    } catch (err) {
      showError(err.response?.data?.message || "Failed to load reminder statistics");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSweep = async () => {
    try {
      setSweeping(true);
      const res = await API.post("/admin/reminders/trigger");
      showSuccess(`Trigger completed! ${res.data.emailsSent} emails sent successfully.`);
      fetchReminders();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to trigger reminder sweep");
    } finally {
      setSweeping(false);
    }
  };

  const handleSendManual = async (reminderId) => {
    try {
      setSendingManualId(reminderId);
      const res = await API.post(`/admin/reminders/send-manual/${reminderId}`);
      showSuccess(res.data.message || "Manual email reminder sent successfully! 📩");
    } catch (err) {
      showError(err.response?.data?.message || "Failed to send manual reminder email");
    } finally {
      setSendingManualId(null);
    }
  };

  const filteredReminders = reminders.filter((r) => {
    const searchLower = search.toLowerCase();
    const festName = r.festival?.name?.toLowerCase() || "";
    const userName = r.user?.name?.toLowerCase() || "";
    const userEmail = r.user?.email?.toLowerCase() || "";
    const loc = r.festival?.location?.toLowerCase() || "";
    return festName.includes(searchLower) || userName.includes(searchLower) || userEmail.includes(searchLower) || loc.includes(searchLower);
  });

  return (
    <div className="space-y-8 p-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Festival Reminders</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">
            Monitor traveler reminder subscriptions and manually trigger notification emails
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={sweeping || loading}
            onClick={handleTriggerSweep}
            className="flex items-center gap-2 px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-md shadow-teal-600/10 disabled:opacity-50"
          >
            {sweeping ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Play size={14} className="fill-current" />
            )}
            Scan & Trigger Reminders
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex items-center gap-6">
          <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl">
            <Bell size={24} />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-950">{totalSubscribers}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Active Subscribers</div>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex items-center gap-6">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Mail size={24} />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-950">{reminders.length}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Total Subscriptions</div>
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex items-center gap-6 bg-slate-900 text-white border-none">
          <div className="p-4 bg-white/10 text-teal-400 rounded-2xl">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-teal-400">Interval Alerts</div>
            <div className="text-sm font-semibold text-slate-300 mt-1 leading-snug">Auto emails triggered 7, 3, and 1 day before the event date</div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex justify-end">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* TABLE SECTION */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center shadow-sm space-y-4">
          <AlertCircle className="mx-auto text-slate-300" size={48} />
          <p className="text-lg font-black text-slate-700">No subscriptions found</p>
          <p className="text-sm font-bold text-slate-500">
            {search ? "No subscriptions matched your search query." : "No traveler has subscribed to festival reminders yet."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75">
                  <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400">Traveler</th>
                  <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400">Festival</th>
                  <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400">Event Date</th>
                  <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400">Sent Intervals</th>
                  <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400">Status</th>
                  <th className="p-6 text-xs font-black uppercase tracking-wider text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReminders.map((reminder) => (
                  <tr key={reminder._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-6 align-top">
                      <div className="font-black text-slate-900">{reminder.user?.name || "Deleted User"}</div>
                      <div className="text-xs text-slate-500 font-semibold">{reminder.email || "N/A"}</div>
                    </td>
                    <td className="p-6 align-top">
                      <div className="font-bold text-slate-800">{reminder.festival?.name || "Deleted Festival"}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">
                        Location: {reminder.festival?.location || "Sikkim"} ({reminder.festival?.month || "N/A"})
                      </div>
                    </td>
                    <td className="p-6 align-top font-bold text-slate-700 text-sm">
                      {reminder.festival?.date ? (
                        new Date(reminder.festival.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })
                      ) : (
                        <span className="text-slate-400 italic font-semibold">Not Set</span>
                      )}
                    </td>
                    <td className="p-6 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {reminder.sentReminders && reminder.sentReminders.length > 0 ? (
                          reminder.sentReminders.map((days) => (
                            <span key={days} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-black uppercase tracking-wider rounded-md">
                              <CheckCircle2 size={10} /> {days}D Sent
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 font-bold italic">None</span>
                        )}
                      </div>
                    </td>
                    <td className="p-6 align-top">
                      {reminder.subscribed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-700 text-xs font-black uppercase tracking-wider rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black uppercase tracking-wider rounded-full">
                          Unsubscribed
                        </span>
                      )}
                    </td>
                    <td className="p-6 align-top text-right">
                      <button
                        disabled={sendingManualId === reminder._id}
                        onClick={() => handleSendManual(reminder._id)}
                        title="Send Alert Email Immediately"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm disabled:opacity-50"
                      >
                        {sendingManualId === reminder._id ? (
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <Mail size={12} />
                        )}
                        Send Email
                      </button>
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

export default AdminReminders;
