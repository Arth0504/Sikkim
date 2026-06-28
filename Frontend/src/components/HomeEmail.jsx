import { useState } from "react";
import { Send, User, Mail, Phone, BookOpen, MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import API from "../services/api";
import { showSuccess, showError } from "../utils/toast";

const HomeEmail = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    
    if (!form.email.trim()) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email address";
    }

    if (!form.phone.trim()) {
      e.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(form.phone.trim())) {
      e.phone = "Phone number must be exactly 10 digits";
    }

    if (!form.subject.trim()) e.subject = "Subject is required";
    if (!form.message.trim()) e.message = "Message is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || loading) return;
    setLoading(true);
    setSuccessMsg("");
    try {
      const res = await API.post("/queries", form);
      setSuccessMsg(res.data.message || "Your query has been submitted successfully. Our team will contact you within 24 hours.");
      showSuccess("Query submitted successfully! ✅");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      showError(err?.response?.data?.message || "Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 md:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-teal-600/10 skew-x-12 translate-x-1/2" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* LEFT: COPY */}
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
                Have a <span className="text-teal-400">Query?</span>
              </h2>
              <p className="text-lg text-slate-400 font-medium leading-relaxed mb-6">
                Planning a spiritual journey or need help choosing the right package? Drop us a message and our team will respond within 24 hours.
              </p>
              
              {successMsg && (
                <div className="bg-teal-500/15 border border-teal-500/30 rounded-2xl p-6 flex items-start gap-4 text-teal-300 animate-fadeIn mt-6">
                  <CheckCircle2 size={24} className="text-teal-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white mb-1">Submitted Successfully</h4>
                    <p className="text-sm leading-relaxed">{successMsg}</p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: FORM */}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Name */}
              <div>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your Name"
                    className={`w-full bg-white/10 border ${errors.name ? "border-red-400" : "border-white/10"} rounded-2xl py-4 pl-12 pr-5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all font-medium`}
                  />
                </div>
                {errors.name && <p className="text-red-400 text-xs font-bold mt-1 ml-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Email */}
                <div>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Email Address"
                      className={`w-full bg-white/10 border ${errors.email ? "border-red-400" : "border-white/10"} rounded-2xl py-4 pl-12 pr-5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all font-medium`}
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-xs font-bold mt-1 ml-1">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Phone Number (10 digits)"
                      className={`w-full bg-white/10 border ${errors.phone ? "border-red-400" : "border-white/10"} rounded-2xl py-4 pl-12 pr-5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all font-medium`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-400 text-xs font-bold mt-1 ml-1">{errors.phone}</p>}
                </div>
              </div>

              {/* Subject */}
              <div>
                <div className="relative">
                  <BookOpen size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="Subject / Topic"
                    className={`w-full bg-white/10 border ${errors.subject ? "border-red-400" : "border-white/10"} rounded-2xl py-4 pl-12 pr-5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all font-medium`}
                  />
                </div>
                {errors.subject && <p className="text-red-400 text-xs font-bold mt-1 ml-1">{errors.subject}</p>}
              </div>

              {/* Message */}
              <div>
                <div className="relative">
                  <MessageSquare size={18} className="absolute left-4 top-4 text-slate-500 pointer-events-none" />
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Your message or query..."
                    className={`w-full bg-white/10 border ${errors.message ? "border-red-400" : "border-white/10"} rounded-2xl py-4 pl-12 pr-5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all font-medium resize-none`}
                  />
                </div>
                {errors.message && <p className="text-red-400 text-xs font-bold mt-1 ml-1">{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 w-full px-10 py-5 bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all duration-300 active:scale-95 shadow-lg shadow-teal-500/25"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {loading ? "Submitting Query..." : "Submit Query"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeEmail;
