import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import API from "../services/api";
import { showSuccess, showError } from "../utils/toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showError("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/users/forgot-password", { email });
      showSuccess(res.data.message || "Reset link sent successfully! 🏔️");
      setEmail("");
    } catch (err) {
      showError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white border border-slate-200 p-10 md:p-14 rounded-[2.5rem] shadow-2xl shadow-slate-200/50">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-teal-600/20">
            <Mail size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Recover Password</h1>
          <p className="text-slate-500 font-medium">Enter your email and we'll send you a password reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                <Loader2 className="animate-spin" size={18} /> Sending Link...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Send Reset Link <ArrowRight size={18} />
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

export default ForgotPassword;
