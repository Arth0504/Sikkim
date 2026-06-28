import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ShieldCheck, ArrowRight } from "lucide-react";
import API from "../services/api";
import { showSuccess, showError } from "../utils/toast";

const AdminLogin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/users/login", form);
      sessionStorage.setItem("adminToken", res.data.token);
      sessionStorage.setItem("role", "admin");
      showSuccess("Admin Access Granted! 🛡️");
      navigate("/admin/dashboard");
    } catch (err) {
      showError("Invalid Admin Credentials ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white border border-slate-200 p-10 md:p-14 rounded-[2.5rem] shadow-2xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Admin Portal</h1>
          <p className="text-slate-500 font-medium">Restricted access for platform administrators</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Admin Email</label>
            <input 
              type="email" 
              name="email" 
              required 
              onChange={handleChange} 
              className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              placeholder="admin@monastery360.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Secure Password</label>
            <input 
              type="password" 
              name="password" 
              required 
              onChange={handleChange} 
              className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all duration-300 w-full mt-4 shadow-none">
            {loading ? "Verifying..." : (
              <span className="flex items-center justify-center gap-2">
                Enter Dashboard <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
            Secure Administrator Session
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
