import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, ArrowRight } from "lucide-react";
import API from "../services/api";
import { showSuccess, showError } from "../utils/toast";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await API.post("/users/login", form);
      sessionStorage.setItem("userToken", res.data.token);
      sessionStorage.setItem("role", "user");
      if (rememberMe) {
        localStorage.setItem("userToken", res.data.token);
        localStorage.setItem("role", "user");
      } else {
        localStorage.removeItem("userToken");
        localStorage.removeItem("role");
      }
      showSuccess("Welcome Back! 🏔️");
      navigate("/");
    } catch (err) {
      showError(err.response?.data?.message || "Invalid credentials ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (typeof window.google === "undefined") {
      showError("Google Sign-In is not loaded yet. Please try again in a moment. ❌");
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1028723652834-mockclientid.apps.googleusercontent.com";
    console.log("[GOOGLE OAUTH] VITE_GOOGLE_CLIENT_ID loaded in Login.jsx:", clientId);

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "email profile openid",
      callback: async (tokenResponse) => {
        console.log("[GOOGLE OAUTH] Google credential response in Login.jsx:", tokenResponse);
        if (tokenResponse && tokenResponse.access_token) {
          setLoading(true);
          try {
            const res = await API.post("/users/google-login", {
              accessToken: tokenResponse.access_token,
            });
            sessionStorage.setItem("userToken", res.data.token);
            sessionStorage.setItem("role", "user");
            if (rememberMe) {
              localStorage.setItem("userToken", res.data.token);
              localStorage.setItem("role", "user");
            }
            showSuccess("Welcome Back! 🏔️");
            navigate("/");
          } catch (err) {
            showError(err.response?.data?.message || "Google Login Failed ❌");
          } finally {
            setLoading(false);
          }
        }
      },
    });

    client.requestAccessToken();
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white border border-slate-200 p-10 md:p-14 rounded-[2.5rem] shadow-2xl shadow-slate-200/50">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-teal-600/20">
            <LogIn size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Welcome Back</h1>
          <p className="text-slate-500 font-medium">Continue your spiritual journey with Monastery360</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              required
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:border-[#0d9488] focus:ring-4 focus:ring-[#0d9488]/10 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
              required
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest pt-2">
            <label className="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 accent-teal-600" 
              />
              Remember Me
            </label>
            <Link to="/forgot-password" className="text-teal-600 hover:text-teal-700 transition-colors">Forgot Password?</Link>
          </div>

          <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-teal-900/10 active:scale-95 w-full mt-4 cursor-pointer">
            {loading ? "Authenticating..." : (
              <span className="flex items-center justify-center gap-2">
                Sign In <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-xs font-black uppercase tracking-widest text-slate-400">or</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button 
          type="button" 
          onClick={handleGoogleLogin} 
          disabled={loading} 
          className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl transition-all duration-300 shadow-sm active:scale-95 w-full cursor-pointer hover:shadow-md hover:border-slate-300"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.23 2.705 1.258 6.66l3.99 3.105z"
            />
            <path
              fill="#34A853"
              d="M16.04 15.345c-1.07.727-2.43 1.164-4.04 1.164a7.07 7.07 0 0 1-6.734-4.855l-3.995 3.1A12 12 0 0 0 12 24c3.218 0 6.136-1.055 8.327-2.873l-4.287-5.782z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.273c0-.818-.08-1.609-.218-2.373H12v4.51h6.473a5.545 5.545 0 0 1-2.409 3.636l4.286 5.782c2.51-2.31 3.96-5.709 3.96-9.555z"
            />
            <path
              fill="#FBBC05"
              d="M5.257 11.645a6.974 6.974 0 0 1-.368-2.25c0-.79.13-1.554.368-2.25l-3.99-3.105A11.956 11.956 0 0 0 0 12c0 2.218.6 4.3 1.636 6.082l3.621-4.437z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="mt-12 pt-8 border-t border-slate-100 text-center">
          <p className="text-sm font-medium text-slate-500 mb-6">New to Monastery360?</p>
          <Link to="/register" className="text-sm font-black uppercase tracking-widest text-teal-600 hover:text-teal-700 transition-colors flex items-center justify-center gap-2">
            Create an Account <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;