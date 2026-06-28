import { useEffect, useRef, useState } from "react";
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Upload, Sparkles, Lightbulb, Compass, Info, Check, Loader2 } from "lucide-react";
import API from "../services/api";
import { showSuccess, showError } from "../utils/toast";
import imgUrl from "../utils/imgUrl";

const emptyForm = {
  name: "",
  duration: "",
  price: "",
  description: "",
  driverInfo: "",
  policies: "",
  itinerary: [],
};

const AdminPackages = () => {
  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef(null);

  // Phase 2A: Smart Package Creation Assistant
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { loadPackages(); }, []);

  useEffect(() => {
    return () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); };
  }, [preview]);

  const fetchAiSuggestions = async (nameVal) => {
    if (!nameVal || nameVal.trim().length < 3) return;
    try {
      setAiLoading(true);
      const res = await API.get(`/admin/assistant/suggest?name=${encodeURIComponent(nameVal)}`);
      setAiSuggestions(res.data);
    } catch (err) {
      console.error("AI assistant suggest error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (form.name && form.name.trim().length >= 3) {
        fetchAiSuggestions(form.name);
      } else {
        setAiSuggestions(null);
      }
    }, 750);

    return () => clearTimeout(delayDebounceFn);
  }, [form.name]);

  const loadPackages = () => {
    API.get("/packages").then((res) => setPackages(res.data)).catch(console.error);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
  };

  const handleItineraryChange = (index, field, value) => {
    const updated = [...form.itinerary];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, itinerary: updated });
  };

  const handleDaysChange = (e) => {
    const count = parseInt(e.target.value) || 0;
    let list = [...(form.itinerary || [])];
    if (count > list.length) {
      for (let i = list.length; i < count; i++) list.push({ day: i + 1, title: "", description: "" });
    } else {
      list = list.slice(0, count);
    }
    setForm({ ...form, itinerary: list });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.itinerary || form.itinerary.length === 0) {
      showError("Please add itinerary details for the package.");
      return;
    }
    const expectedDays = parseInt(form.duration);
    if (expectedDays && form.itinerary.length !== expectedDays) {
      showError(`Itinerary days (${form.itinerary.length}) must match package duration (${expectedDays} days).`);
      return;
    }
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("duration", form.duration);
      fd.append("price", form.price);
      fd.append("description", form.description);
      fd.append("driverInfo", form.driverInfo || "");
      fd.append("policies", form.policies || "");
      fd.append("itinerary", JSON.stringify(form.itinerary));
      if (imageFile) fd.append("image", imageFile);

      if (editingId) {
        await API.put(`/packages/${editingId}`, fd);
        showSuccess("Package Updated!");
      } else {
        await API.post("/packages", fd);
        showSuccess("Package Added!");
      }
      resetForm();
      loadPackages();
    } catch {
      showError("Failed to save package.");
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

  const handleEdit = (pkg) => {
    setEditingId(pkg._id);
    setForm({
      name: pkg.name || "",
      duration: pkg.duration || "",
      price: pkg.price || "",
      description: pkg.description || "",
      driverInfo: pkg.driverInfo || "",
      policies: pkg.policies || "",
      itinerary: pkg.itinerary || [],
    });
    setImageFile(null);
    setPreview(pkg.image ? imgUrl(pkg.image) : "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this package?")) {
      try {
        await API.delete(`/packages/${id}`);
        showSuccess("Deleted!");
        loadPackages();
      } catch {
        showError("Delete Failed!");
      }
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Tour <span className="text-teal-600">Packages</span></h1>
          <p className="text-slate-500 font-medium">Manage and organize spiritual journey offerings.</p>
        </div>
        <button
          onClick={() => { if (showForm) resetForm(); else setShowForm(true); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            showForm ? "bg-slate-200 text-slate-600 hover:bg-slate-300" : "bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20"
          }`}
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? "Cancel" : "Add New Package"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
          {/* Main Form Content */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Package Name</label>
                  <input name="name" placeholder="e.g. Sikkim Spiritual Escape" value={form.name} onChange={handleChange} required
                    className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Duration</label>
                  <input name="duration" placeholder="e.g. 5 Days / 4 Nights" value={form.duration} onChange={handleChange} required
                    className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Price (INR)</label>
                  <input name="price" type="number" placeholder="e.g. 15000" value={form.price} onChange={handleChange} required
                    className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium" />
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Package Image</label>
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
                <textarea name="description" placeholder="Tell travelers about this journey..." value={form.description} onChange={handleChange} required rows={4}
                  className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium min-h-[120px]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Driver Information</label>
                  <textarea name="driverInfo" placeholder="e.g. John Doe (+91 9876543210) - Innova Crysta" value={form.driverInfo || ""} onChange={handleChange} rows={3}
                    className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Policies</label>
                  <textarea name="policies" placeholder="e.g. No smoking. Strict cancellation policy." value={form.policies || ""} onChange={handleChange} rows={3}
                    className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium" />
                </div>
              </div>

              {/* Itinerary */}
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-900">Itinerary Plan</h3>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Number of Days</label>
                    <input type="number" min="0" max="30" value={form.itinerary?.length || 0} onChange={handleDaysChange}
                      className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-teal-600 text-center font-bold text-slate-900" />
                  </div>
                </div>
                {form.itinerary?.map((day, idx) => (
                  <div key={idx} className="bg-slate-50 p-6 rounded-2xl space-y-4 border border-slate-100">
                    <div className="text-sm font-black text-teal-600 uppercase tracking-widest mb-2">Day {day.day}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Title</label>
                        <input value={day.title || ""} onChange={(e) => handleItineraryChange(idx, "title", e.target.value)} placeholder="e.g. Arrival & Acclimatization"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-teal-600 transition-all text-sm font-medium text-slate-900" />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                        <textarea value={day.description || ""} onChange={(e) => handleItineraryChange(idx, "description", e.target.value)} placeholder="Detailed plan for the day..." rows={2}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-teal-600 transition-all text-sm font-medium text-slate-900 resize-none" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button type="submit"
                  className="inline-flex items-center justify-center gap-2 px-12 py-3 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-teal-900/10 active:scale-95">
                  {editingId ? "Update Package" : "Create Package"}
                </button>
              </div>
            </form>
          </div>

          {/* AI Suggestions Sidebar */}
          <div className="lg:col-span-1 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 p-8 space-y-6 self-start">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Sparkles className="text-teal-600 animate-pulse" size={22} />
              <h3 className="text-lg font-black text-slate-900">AI Package Assistant</h3>
            </div>
            
            {aiLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-teal-600" size={28} />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Analyzing destinations...</p>
              </div>
            ) : aiSuggestions ? (
              <div className="space-y-6 text-xs text-slate-600 leading-relaxed">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Detected Region</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-700 font-bold rounded-full">
                    <Compass size={14} /> {aiSuggestions.region}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Suggested Monasteries</span>
                  <div className="flex flex-wrap gap-1.5">
                    {aiSuggestions.suggestedMonasteries.map((mon, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setForm(f => ({
                            ...f,
                            description: f.description ? `${f.description}\nIncludes visit to ${mon}.` : `Includes visit to ${mon}.`
                          }));
                          showSuccess(`Suggested ${mon} added to description!`);
                        }}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 rounded-lg text-slate-700 transition-all text-left flex items-center gap-1 cursor-pointer"
                        title="Click to add to description"
                      >
                        <Plus size={10} /> {mon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Sightseeing Attractions</span>
                  <ul className="list-disc pl-4 space-y-1 font-medium">
                    {aiSuggestions.suggestedAttractions.map((att, i) => (
                      <li key={i}>{att}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Recommended Days</span>
                    <span className="font-bold text-slate-800">{aiSuggestions.suggestedDuration}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Estimated Cost</span>
                    <span className="font-bold text-teal-600">{aiSuggestions.suggestedPriceRange}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Best Season</span>
                  <span className="font-bold text-slate-800">{aiSuggestions.bestSeason}</span>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 text-[11px] text-amber-800 font-medium">
                  <Info size={16} className="text-amber-600 shrink-0" />
                  <span>{aiSuggestions.tips}</span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <Lightbulb size={36} className="mx-auto text-slate-200" />
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Type a package name (e.g. "North Sikkim Adventure") to get instant AI layout & destination planning suggestions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Package Details</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Duration</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400">Price</th>
                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {packages.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        {p.image ? (
                          <img src={imgUrl(p.image)} className="w-full h-full object-cover" alt={p.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={20} className="text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 leading-tight">{p.name}</p>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1 max-w-[200px]">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6"><span className="text-sm font-bold text-slate-600">{p.duration}</span></td>
                  <td className="px-8 py-6"><span className="text-sm font-black text-teal-600">₹{p.price}</span></td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => handleEdit(p)} className="p-2.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-teal-600 hover:text-white transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(p._id)} className="p-2.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {packages.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center">
            <ImageIcon size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest">No packages found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPackages;
