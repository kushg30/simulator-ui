// src/AuthPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from "./firebase";
import { useAuth } from "./context/AuthContext";
import "./AuthPage.css";

/* ── Firebase error → human-readable message ──────────── */
function parseFirebaseError(code) {
  switch (code) {
    case "auth/email-already-in-use":   return "This email is already registered. Try signing in.";
    case "auth/user-not-found":         return "No account found with this email.";
    case "auth/wrong-password":         return "Incorrect password. Please try again.";
    case "auth/invalid-credential":     return "Incorrect email or password. Please try again.";
    case "auth/too-many-requests":      return "Too many attempts. Please wait a moment and try again.";
    case "auth/invalid-email":          return "Enter a valid email address.";
    case "auth/popup-closed-by-user":   return "Google sign-in was cancelled.";
    case "auth/network-request-failed": return "Network error. Check your connection.";
    default:                            return "Something went wrong. Please try again.";
  }
}

/* ── Validation helpers ────────────────────────────────── */
const validators = {
  email: (v) => {
    if (!v) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
    return "";
  },
  username: (v) => {
    if (!v) return "Username is required.";
    if (v.length < 3) return "Username must be at least 3 characters.";
    if (v.length > 20) return "Username must be under 20 characters.";
    if (!/^[a-zA-Z0-9_]+$/.test(v)) return "Only letters, numbers, and underscores.";
    return "";
  },
  password: (v) => {
    if (!v) return "Password is required.";
    if (v.length < 8) return "Must be at least 8 characters.";
    if (!/[A-Z]/.test(v)) return "Include at least one uppercase letter.";
    if (!/[0-9]/.test(v)) return "Include at least one number.";
    return "";
  },
  confirm: (v, pw) => {
    if (!v) return "Please confirm your password.";
    if (v !== pw) return "Passwords do not match.";
    return "";
  },
};

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8)          s++;
  if (pw.length >= 12)         s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: s, label: "Weak",   color: "#ef4444" };
  if (s <= 3) return { score: s, label: "Fair",   color: "#f59e0b" };
  if (s === 4) return { score: s, label: "Good",  color: "#22c55e" };
  return       { score: s, label: "Strong", color: "#10b981" };
}

/* ── Eye Icon ──────────────────────────────────────────── */
function EyeIcon({ visible }) {
  return visible ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

/* ── Field Component ───────────────────────────────────── */
function Field({ label, id, type = "text", value, onChange, onBlur, error, touched, placeholder, rightSlot }) {
  const hasError   = touched && error;
  const hasSuccess = touched && !error && value;
  return (
    <div className={`field-group ${hasError ? "field-error" : ""} ${hasSuccess ? "field-success" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field-input-wrap">
        <input
          id={id} type={type} value={value}
          onChange={onChange} onBlur={onBlur}
          placeholder={placeholder} autoComplete={id}
        />
        {rightSlot && <div className="field-right">{rightSlot}</div>}
        {hasSuccess && !rightSlot && (
          <div className="field-check">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        )}
      </div>
      {hasError && <span className="field-msg">{error}</span>}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────── */
export default function AuthPage() {
  const navigate       = useNavigate();
  const { user }       = useAuth();
  const [mode, setMode] = useState("login");

  // If already logged in → redirect immediately
  useEffect(() => { if (user) navigate("/", { replace: true }); }, [user, navigate]);

  // Form state
  const [email,    setEmail]    = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [showCfm,  setShowCfm]  = useState(false);
  const [touched,  setTouched]  = useState({});

  // Status
  const [loading,   setLoading]   = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [globalErr, setGlobalErr] = useState("");

  const touch    = (f) => setTouched((t) => ({ ...t, [f]: true }));
  const touchAll = () => setTouched({ email: true, username: true, password: true, confirm: true });

  // Reset on mode switch
  useEffect(() => {
    setEmail(""); setUsername(""); setPassword(""); setConfirm("");
    setTouched({}); setSuccess(false); setGlobalErr("");
    setShowPw(false); setShowCfm(false);
  }, [mode]);

  const errors = {
    email:    validators.email(email),
    username: mode === "signup" ? validators.username(username) : "",
    password: validators.password(password),
    confirm:  mode === "signup" ? validators.confirm(confirm, password) : "",
  };

  const isValid =
    !errors.email && !errors.password &&
    (mode === "login" || (!errors.username && !errors.confirm));

  const strength = getPasswordStrength(password);

  /* ── Email submit ──────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    touchAll();
    if (!isValid) return;
    setLoading(true);
    setGlobalErr("");
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, username);
      } else {
        await signInWithEmail(email, password);
      }
      setSuccess(true);
      setTimeout(() => navigate("/"), 900);
    } catch (err) {
      setGlobalErr(parseFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  };

  /* ── Google submit ─────────────────────────────────── */
  const handleGoogle = async () => {
    setLoading(true);
    setGlobalErr("");
    try {
      await signInWithGoogle();
      // AuthContext listener fires → user state updates → useEffect redirects
    } catch (err) {
      setGlobalErr(parseFirebaseError(err.code));
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-grid"></div>
        <div className="auth-orb orb1"></div>
        <div className="auth-orb orb2"></div>
      </div>

      <a href="/" className="auth-logo">
        <span className="logo-biz">BIZ</span>
        <span className="logo-sim">SIMULATE</span>
      </a>

      <div className="auth-card">

        <div className="auth-toggle">
          <button type="button" className={mode === "login"  ? "toggle-active" : ""} onClick={() => setMode("login")}>Sign In</button>
          <button type="button" className={mode === "signup" ? "toggle-active" : ""} onClick={() => setMode("signup")}>Create Account</button>
        </div>

        <h2 className="auth-title">
          {mode === "login" ? "Welcome back" : "Join BizSimulate"}
        </h2>
        <p className="auth-subtitle">
          {mode === "login" ? "Sign in to continue your simulation." : "Start your MBA simulation journey today."}
        </p>

        {/* Global Firebase error */}
        {globalErr && (
          <div className="global-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:16,height:16,flexShrink:0}}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {globalErr}
          </div>
        )}

        {/* Google */}
        <button type="button" className="btn-google" onClick={handleGoogle} disabled={loading}>
          <svg className="google-icon" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {mode === "login" ? "Continue with Google" : "Sign up with Google"}
        </button>

        <div className="auth-divider"><span>or continue with email</span></div>

        <form onSubmit={handleSubmit} noValidate>
          <Field label="Email Address" id="email" type="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            onBlur={() => touch("email")} error={errors.email}
            touched={touched.email} placeholder="you@university.edu" />

          {mode === "signup" && (
            <Field label="Username" id="username"
              value={username} onChange={(e) => setUsername(e.target.value)}
              onBlur={() => touch("username")} error={errors.username}
              touched={touched.username} placeholder="e.g. alex_mba2026" />
          )}

          <Field label="Password" id="password"
            type={showPw ? "text" : "password"}
            value={password} onChange={(e) => setPassword(e.target.value)}
            onBlur={() => touch("password")} error={errors.password}
            touched={touched.password} placeholder="Min. 8 chars, 1 uppercase, 1 number"
            rightSlot={
              <button type="button" className="eye-btn" onClick={() => setShowPw(v => !v)} aria-label="Toggle password">
                <EyeIcon visible={showPw} />
              </button>
            }
          />

          {mode === "signup" && password && (
            <div className="strength-bar-wrap">
              <div className="strength-bar">
                {[1,2,3,4,5].map(n => (
                  <div key={n} className="strength-seg"
                    style={{ background: n <= strength.score ? strength.color : "rgba(255,255,255,0.08)" }} />
                ))}
              </div>
              <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
            </div>
          )}

          {mode === "signup" && (
            <Field label="Confirm Password" id="confirm"
              type={showCfm ? "text" : "password"}
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => touch("confirm")} error={errors.confirm}
              touched={touched.confirm} placeholder="Re-enter your password"
              rightSlot={
                <button type="button" className="eye-btn" onClick={() => setShowCfm(v => !v)} aria-label="Toggle confirm">
                  <EyeIcon visible={showCfm} />
                </button>
              }
            />
          )}

          {mode === "login" && (
            <div className="forgot-row">
              <button type="button" className="forgot-link">Forgot password?</button>
            </div>
          )}

          <button type="submit"
            className={`btn-submit ${success ? "btn-success" : ""}`}
            disabled={loading || success}>
            {success ? (
              <>
                <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {mode === "login" ? "Signing in…" : "Account created!"}
              </>
            ) : loading ? (
              <><span className="spinner"></span>{mode === "login" ? "Signing in…" : "Creating account…"}</>
            ) : (
              mode === "login" ? "Sign In →" : "Create Account →"
            )}
          </button>

          {mode === "signup" && (
            <p className="auth-terms">
              By creating an account you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </p>
          )}
        </form>

        <p className="auth-switch">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button type="button" className="switch-link"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
