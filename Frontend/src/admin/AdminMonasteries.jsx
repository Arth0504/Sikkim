import { useEffect, useRef, useState } from "react";
import { Plus, Edit2, Trash2, X, MapPin, Upload } from "lucide-react";
import API from "../services/api";
import { showSuccess, showError } from "../utils/toast";
import imgUrl from "../utils/imgUrl";

const emptyForm = { name: "", location: "", history: "", rules: "", iframe360: "", featured: false };

const AdminMonasteries = () => {
  const [monasteries, setMonasteries] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadMonasteries(); }, []);

  useEffect(() => {
    return () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); };
  }, [preview]);

  const loadMonasteries = () => {
    API.get("/monasteries").then((res) => setMonasteries(res.data)).catch(console.error);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("location", form.location);
      fd.append("history", form.history || "");
      fd.append("rules", form.rules || "");
      fd.append("iframe360", form.iframe360 || "");
      fd.append("featured", form.featured);
      if (imageFile) fd.append("image", imageFile);

      if (editingId) {
        await API.put(`/monasteries/${editingId}`, fd);
        showSuccess("Monastery Updated!");
      } else {
        await API.post("/monasteries", fd);
        showSuccess("Monastery Added!");
      }
      resetForm();
      loadMonasteries();
    } catch {
      showError("Failed to Save!");
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setImageFile(null);
    setPreview("");
    setEditingId(null);
    setShowForm(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (m) => {
    setEditingId(m._id);
    setForm({
      name: m.name || "",
      location: m.location || "",
      history: m.history || "",
      rules: m.rules || "",
      iframe360: m.iframe360 || "",
      featured: m.featured || false,
    });
    setImageFile(null);
    setPreview(m.image ? imgUrl(m.image) : "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this monastery?")) {
      try {
        await API.delete(`/monasteries/${id}`);
        showSuccess("Deleted!");
        loadMonasteries();
      } catch {
        showError("Delete Failed!");
      }
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Manage <span className="text-teal-600">Monasteries</span></h1>
          <p className="text-slate-500 font-medium">Add and update sacred heritage sites in Sikkim.</p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            showForm ? "bg-slate-200 text-slate-600 hover:bg-slate-300" : "bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20"
          }`}
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? "Cancel" : "Add Monastery"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Monastery Name</label>
                <input name="name" placeholder="e.g. Rumtek Monastery" value={form.name} onChange={handleChange} required
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Location</label>
                <input name="location" placeholder="e.g. East Sikkim" value={form.location} onChange={handleChange} required
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium" />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Monastery Image</label>
              <div className="flex items-start gap-6">
                <label className="flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl px-5 py-6 cursor-pointer hover:border-teal-500 hover:bg-teal-50/30 transition-all">
                  <Upload size={22} className="text-slate-400" />
                  <span className="text-sm text-slate-500 font-medium">
                    {imageFile ? imageFile.name : "Click to upload (jpg, jpeg, png, webp · max 5MB)"}
                  </span>
                  <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleImageChange} />
                </label>
                {preview && (
                  <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                    <button type="button"
                      onClick={() => { setImageFile(null); setPreview(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">360° View Iframe Link (Optional)</label>
              <input name="iframe360" placeholder="https://..." value={form.iframe360} onChange={handleChange}
                className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium" />
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 max-w-xs">
              <input 
                type="checkbox" 
                name="featured" 
                id="featured" 
                checked={form.featured} 
                onChange={handleChange}
                className="w-5 h-5 text-teal-600 border-slate-200 rounded focus:ring-teal-500 cursor-pointer"
              />
              <label htmlFor="featured" className="text-xs font-black uppercase tracking-widest text-slate-700 cursor-pointer select-none">
                Featured Monastery
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">History & Significance</label>
              <textarea name="history" placeholder="Tell the story of this monastery..." value={form.history} onChange={handleChange} required rows={4}
                className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium min-h-[120px]" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Visitor Rules</label>
              <textarea name="rules" placeholder="Entry rules, dress code, photography..." value={form.rules} onChange={handleChange} required rows={2}
                className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium" />
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit"
                className="inline-flex items-center justify-center gap-2 px-12 py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-teal-900/10 active:scale-95">
                {editingId ? "Update Monastery" : "Add Monastery"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Monastery</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Location</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Featured</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {monasteries.map((m) => (
                <tr key={m._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        <img src={imgUrl(m.image)} className="w-full h-full object-cover" alt={m.name}
                          onError={(e) => { e.target.style.display = "none"; }} />
                      </div>
                      <p className="font-bold text-slate-900 leading-tight">{m.name}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                      <MapPin size={16} className="text-teal-500" /> {m.location}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {m.featured ? (
                      <span className="px-3 py-1 bg-teal-50 text-teal-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-teal-100">
                        Yes
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-slate-100">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => handleEdit(m)} className="p-2.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-teal-600 hover:text-white transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(m._id)} className="p-2.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {monasteries.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest">No monasteries found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMonasteries;
