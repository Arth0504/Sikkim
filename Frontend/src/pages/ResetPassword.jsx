import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Lock, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import API from "../services/api";
import { showSuccess, showError } from "../utils/toast";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { password, confirmPassword } = form;

    if (!password || !confirmPassword) {
      showError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post(`/users/reset-password/${token}`, { password });
      showSuccess(res.data.message || "Password updated successfully! ✅");
      navigate("/login");
    } catch (err) {
      showError(err.response?.data?.message || "Reset link invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white border border-slate-200 p-10 md:p-14 rounded-[2.5rem] shadow-2xl shadow-slate-200/50">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-teal-600/20">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Set New Password</h1>
          <p className="text-slate-500 font-medium">Please enter your new password to complete the reset.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-teal-900/10 active:scale-95 w-full mt-4 disabled:bg-teal-600/50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={18} /> Updating Password...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Update Password <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <Link
            to="/login"
            className="text-sm font-black uppercase tracking-widest text-teal-600 hover:text-teal-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
