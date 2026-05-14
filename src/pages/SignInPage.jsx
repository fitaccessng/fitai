import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser, registerUser, requestPasswordReset, resetPassword } from "../services/authService";
import { API_BASE_URL } from "../services/api";

const initialState = { full_name: "", email: "", password: "" };
const initialResetState = { email: "", token: "", password: "", confirmPassword: "" };

/**
 * REUSABLE BOTTOM SHEET
 * This handles the "Forgot Password" UI flow
 */
const BottomSheet = ({ isOpen, onClose, title, subtitle, children }) => {
  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      {/* Sliding Sheet */}
      <div 
        className={`fixed inset-x-0 bottom-0 z-50 flex justify-center transition-transform duration-500 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="w-full max-w-2xl rounded-t-[2.5rem] border-t border-stone-700/50 bg-stone-900 px-6 pb-12 pt-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="mx-auto mb-8 h-1.5 w-12 cursor-pointer rounded-full bg-stone-700/50 hover:bg-stone-600 transition-colors" onClick={onClose} />
          <div className="mb-8 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-500">{subtitle}</p>
            <h3 className="mt-1 text-3xl font-extrabold text-white">{title}</h3>
          </div>
          <div className="mx-auto max-w-md">{children}</div>
        </div>
      </div>
    </>
  );
};

/**
 * STYLED INPUT WITH PASSWORD TOGGLE
 * Integrated with the same props as your original code
 */
const FormInput = ({ label, type = "text", ...props }) => {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="block">
      <span className="mb-1.5 ml-1 block text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</span>
      <div className="relative">
        <input
          {...props}
          type={isPassword ? (visible ? "text" : "password") : type}
          className="w-full rounded-2xl border border-stone-700/50 bg-stone-800/40 px-4 py-3 text-sm text-white placeholder-stone-600 outline-none transition-all focus:border-amber-500/50 focus:bg-stone-800/60 focus:ring-4 focus:ring-amber-500/10"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-amber-500 transition-colors"
          >
            {visible ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.399 8.049 7.31 4.5 12 4.5c4.691 0 8.601 3.549 9.964 7.178.07.207.07.431 0 .639C20.601 15.951 16.69 19.5 12 19.5c-4.69 0-8.601-3.549-9.964-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        )}
      </div>
    </label>
  );
};

export default function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, login } = useAuth();

  // AUTH STATE
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // RESET STATE
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [resetForm, setResetForm] = useState(initialResetState);

  const redirectTo = useMemo(() => location.state?.from || "/app/dashboard", [location.state]);

  useEffect(() => {
    if (token) navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo, token]);

  useEffect(() => {
    const resetToken = searchParams.get("resetToken");
    if (resetToken) {
      setShowForgotPassword(true);
      setForgotSuccess("Reset token loaded. Please enter your new password.");
      setResetForm((curr) => ({ ...curr, token: resetToken }));
    }
  }, [searchParams]);

  const readErrorMessage = (err, fallback) => {
    if (err.code === "ERR_NETWORK") return `Backend unreachable at ${API_BASE_URL}.`;
    return err.response?.data?.detail || fallback;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = isRegister ? form : { email: form.email, password: form.password };
      const response = isRegister ? await registerUser(payload) : await loginUser(payload);
      login(response);
      navigate(isRegister ? "/app/onboarding" : redirectTo, { replace: true });
    } catch (err) {
      setError(readErrorMessage(err, "Authentication failed."));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");
    setForgotSuccess("");
    try {
      const response = await requestPasswordReset({ email: resetForm.email || form.email });
      setForgotSuccess(response.message);
      if (response.reset_token) setResetForm(c => ({ ...c, token: response.reset_token }));
    } catch (err) {
      setForgotError(readErrorMessage(err, "Failed to send reset email."));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (resetForm.password !== resetForm.confirmPassword) {
      setForgotError("Passwords do not match.");
      return;
    }
    setForgotLoading(true);
    try {
      const response = await resetPassword({ token: resetForm.token, password: resetForm.password });
      setShowForgotPassword(false);
      setSuccess(response.message);
      setSearchParams({}, { replace: true });
    } catch (err) {
      setForgotError(readErrorMessage(err, "Update failed."));
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-950 p-4">
      {/* ANIMATED BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-stone-950 via-stone-900 to-stone-950 opacity-100" />
        <div className="absolute inset-0 grid grid-cols-6 gap-8 p-12 opacity-10">
          {[...Array(18)].map((_, i) => (
            <div key={i} className="flex items-center justify-center animate-float" style={{ animationDelay: `${i * 0.3}s` }}>
              <span className="text-xl grayscale opacity-50">{["🏋️", "🥗", "⏰", "🍎", "💪", "📊"][i % 6]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* LOGIN CARD */}
      <div className="relative z-10 w-full max-w-md">
        <div className="overflow-hidden rounded-[2.5rem] border border-stone-800/60 bg-stone-900/40 p-8 shadow-2xl backdrop-blur-2xl">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-xl shadow-orange-500/20">
              <span className="text-2xl font-black text-stone-950">F</span>
            </div>
            <h1 className="text-2xl font-bold text-white">FitAi</h1>
            <p className="text-sm text-stone-500">Your Health, Optimized.</p>
          </div>

          <div className="mb-8 flex rounded-2xl bg-stone-800/50 p-1">
            <button onClick={() => setIsRegister(false)} className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${!isRegister ? "bg-stone-700 text-white shadow-lg" : "text-stone-500 hover:text-stone-300"}`}>Login</button>
            <button onClick={() => setIsRegister(true)} className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${isRegister ? "bg-stone-700 text-white shadow-lg" : "text-stone-500 hover:text-stone-300"}`}>Register</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && <FormInput label="Full Name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="John Doe" required />}
            <FormInput label="Email Address" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@example.com" required />
            <FormInput label="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••••" required />

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 text-xs text-stone-500 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="rounded border-stone-700 bg-stone-800 text-amber-500 focus:ring-0 focus:ring-offset-0" /> Remember Me
              </label>
              <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs font-bold text-amber-500 hover:text-amber-400">Forgot Password?</button>
            </div>

            {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">{error}</div>}
            {success && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">{success}</div>}

            <button disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 py-4 font-bold text-white shadow-lg shadow-orange-600/20 transition-all hover:brightness-110 active:scale-[0.98]">
              {loading ? "Authenticating..." : isRegister ? "Create Account" : "Sign In"}
            </button>
          </form>
        </div>
      </div>

      {/* BOTTOM SHEET FOR RECOVERY */}
      <BottomSheet isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} subtitle="Security" title="Account Recovery">
        <div className="space-y-6">
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <FormInput label="Account Email" value={resetForm.email} onChange={e => setResetForm({...resetForm, email: e.target.value})} placeholder="Enter your email" />
            <button disabled={forgotLoading} className="w-full rounded-xl border border-stone-700 bg-stone-800/50 py-3 text-sm font-bold text-white hover:bg-stone-800">
              {forgotLoading ? "Sending..." : "Request Reset Code"}
            </button>
          </form>

          <div className="relative flex items-center"><div className="flex-grow border-t border-stone-800"></div><span className="mx-4 text-[10px] font-black uppercase tracking-widest text-stone-600">Verification & Reset</span><div className="flex-grow border-t border-stone-800"></div></div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <FormInput label="Reset Token" value={resetForm.token} onChange={e => setResetForm({...resetForm, token: e.target.value})} placeholder="Paste token from email" required />
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="New Password" type="password" value={resetForm.password} onChange={e => setResetForm({...resetForm, password: e.target.value})} placeholder="••••••••" required />
              <FormInput label="Confirm Password" type="password" value={resetForm.confirmPassword} onChange={e => setResetForm({...resetForm, confirmPassword: e.target.value})} placeholder="••••••••" required />
            </div>
            {forgotError && <div className="rounded-xl bg-red-500/10 p-3 text-xs text-red-400">{forgotError}</div>}
            {forgotSuccess && <div className="rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-400">{forgotSuccess}</div>}
            <button disabled={forgotLoading} className="w-full rounded-2xl bg-white py-4 font-black text-stone-950 transition-all hover:bg-stone-200 active:scale-95">
              Update Password
            </button>
          </form>
        </div>
      </BottomSheet>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .animate-float { animation: float 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
