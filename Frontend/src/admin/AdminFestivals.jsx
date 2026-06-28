import { useEffect, useRef, useState } from "react";
import { Plus, Edit2, Trash2, X, Calendar, Upload } from "lucide-react";
import API from "../services/api";
import { showSuccess, showError } from "../utils/toast";
import imgUrl from "../utils/imgUrl";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const CATEGORIES = ["cultural", "religious", "traditional", "tourism", "national"];

const emptyForm = { name: "", month: "", location: "", category: "cultural", description: "" };

const AdminFestivals = () => {
  const [festivals, setFestivals] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadFestivals(); }, []);

  useEffect(() => {
    return () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); };
  }, [preview]);

  const loadFestivals = () => {
    API.get("/admin/festivals")
      .then((res) => setFestivals(res.data))
      .catch(console.error);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
      fd.append("month", form.month);
      fd.append("location", form.location || "");
      fd.append("category", form.category || "cultural");
      fd.append("description", form.description);
      if (imageFile) fd.append("image", imageFile);

      if (editingId) {
        await API.put(`/admin/festivals/${editingId}`, fd);
        showSuccess("Festival Updated!");
      } else {
        await API.post("/admin/festivals", fd);
        showSuccess("Festival Added!");
      }
      resetForm();
      loadFestivals();
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

  const handleEdit = (f) => {
    setEditingId(f._id);
    setForm({
      name: f.name || "",
      month: f.month || "",
      location: f.location || "",
      category: f.category || "cultural",
      description: f.description || "",
    });
    setImageFile(null);
    setPreview(f.image ? imgUrl(f.image) : "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this festival?")) {
      try {
        await API.delete(`/admin/festivals/${id}`);
        showSuccess("Deleted!");
        loadFestivals();
      } catch {
        showError("Delete Failed!");
      }
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Manage <span className="text-teal-600">Festivals</span></h1>
          <p className="text-slate-500 font-medium">Update the cultural calendar of Sikkim.</p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            showForm ? "bg-slate-200 text-slate-600 hover:bg-slate-300" : "bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20"
          }`}
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? "Cancel" : "Add Festival"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Festival Name</label>
                <input name="name" placeholder="e.g. Losar Festival" value={form.name} onChange={handleChange} required
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Month</label>
                <select name="month" value={form.month} onChange={handleChange} required
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 font-medium">
                  <option value="">Select month</option>
                  {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Location</label>
                <input name="location" placeholder="e.g. Gangtok, Sikkim" value={form.location} onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                <select name="category" value={form.category} onChange={handleChange}
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 font-medium">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Festival Image</label>
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
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Description</label>
              <textarea name="description" placeholder="Share the significance and rituals..." value={form.description} onChange={handleChange} required rows={4}
                className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium min-h-[120px]" />
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit"
                className="inline-flex items-center justify-center gap-2 px-12 py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-teal-900/10 active:scale-95">
                {editingId ? "Update Festival" : "Add Festival"}
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
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Festival</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Month</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Category</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {festivals.map((f) => (
                <tr key={f._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        <img src={imgUrl(f.image)} className="w-full h-full object-cover" alt={f.name}
                          onError={(e) => { e.target.style.display = "none"; }} />
                      </div>
                      <p className="font-bold text-slate-900 leading-tight">{f.name}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                      <Calendar size={16} className="text-teal-500" /> {f.month}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-md">
                      {f.category}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => handleEdit(f)} className="p-2.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-teal-600 hover:text-white transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(f._id)} className="p-2.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {festivals.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest">No festivals found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFestivals;
