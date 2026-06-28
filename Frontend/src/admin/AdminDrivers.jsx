import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, X, Phone, Truck, ShieldAlert } from "lucide-react";
import API from "../services/api";
import { showSuccess, showError } from "../utils/toast";

const emptyForm = {
  name: "",
  phone: "",
  vehicleNumber: "",
  vehicleType: "",
  status: "available",
};

const AdminDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/drivers");
      setDrivers(res.data || []);
    } catch (err) {
      console.error("Failed to load drivers:", err);
      showError("Failed to fetch drivers list.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.vehicleNumber.trim() || !form.vehicleType.trim()) {
      showError("All fields are required.");
      return;
    }
    
    // Simple 10-digit validation for phone (standard in the system)
    if (!/^\d{10}$/.test(form.phone.trim())) {
      showError("Mobile number must be exactly 10 digits.");
      return;
    }

    try {
      if (editingId) {
        await API.put(`/admin/drivers/${editingId}`, form);
        showSuccess("Driver details updated! 🚙");
      } else {
        await API.post("/admin/drivers", form);
        showSuccess("New driver added successfully! 🚗");
      }
      resetForm();
      loadDrivers();
    } catch (err) {
      showError(err.response?.data?.message || "Failed to save driver details.");
    }
  };

  const handleEdit = (driver) => {
    setEditingId(driver._id);
    setForm({
      name: driver.name || "",
      phone: driver.phone || "",
      vehicleNumber: driver.vehicleNumber || "",
      vehicleType: driver.vehicleType || "",
      status: driver.status || "available",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this driver? All active booking references will be unassigned.")) return;
    try {
      await API.delete(`/admin/drivers/${id}`);
      showSuccess("Driver deleted successfully. 🗑️");
      loadDrivers();
    } catch (err) {
      showError("Failed to delete driver.");
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Driver <span className="text-teal-600">Allocation Portal</span></h1>
          <p className="text-slate-500 font-medium">Add, update, and manage drivers and transport resources.</p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            showForm 
              ? "bg-slate-200 text-slate-600 hover:bg-slate-300" 
              : "bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20 active:scale-95"
          }`}
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? "Cancel" : "Add New Driver"}
        </button>
      </div>

      {/* CRUD Form */}
      {showForm && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Driver Name</label>
                <input 
                  name="name" 
                  placeholder="e.g. Tashi Dorjee" 
                  value={form.name} 
                  onChange={handleChange} 
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Contact Phone</label>
                <input 
                  name="phone" 
                  placeholder="e.g. 9876543210" 
                  value={form.phone} 
                  onChange={handleChange} 
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Vehicle Registration Number</label>
                <input 
                  name="vehicleNumber" 
                  placeholder="e.g. SK-01-T-5421" 
                  value={form.vehicleNumber} 
                  onChange={handleChange} 
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Vehicle Model / Type</label>
                <input 
                  name="vehicleType" 
                  placeholder="e.g. Innova Crysta (SUV)" 
                  value={form.vehicleType} 
                  onChange={handleChange} 
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Driver Availability Status</label>
                <select 
                  name="status" 
                  value={form.status} 
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 font-medium"
                >
                  <option value="available">🟢 Available for Allocation</option>
                  <option value="busy">🟡 Busy / Engaged in Journey</option>
                  <option value="inactive">🔴 Inactive / Leave</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-4 gap-3">
              <button 
                type="button" 
                onClick={resetForm}
                className="px-6 py-3 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl transition-all uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-10 py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-teal-900/10 active:scale-95 text-xs uppercase tracking-wider"
              >
                {editingId ? "Update Details" : "Register Driver"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Drivers List Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest">Loading transport registry...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Driver Name</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Phone</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Vehicle Type & Reg No</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Availability</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {drivers.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-teal-600">
                          <Truck size={20} />
                        </div>
                        <span className="font-bold text-slate-900">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-slate-600 flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {d.phone}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{d.vehicleType}</p>
                        <p className="text-xs text-slate-400 mt-1">{d.vehicleNumber}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        d.status === "available" ? "bg-emerald-50 border-emerald-200 text-emerald-600" :
                        d.status === "busy" ? "bg-amber-50 border-amber-200 text-amber-600" :
                        "bg-red-50 border-red-200 text-red-600"
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => handleEdit(d)} className="p-2.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-teal-600 hover:text-white transition-all">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(d._id)} className="p-2.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && drivers.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center">
            <ShieldAlert size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest">No drivers registered yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDrivers;
