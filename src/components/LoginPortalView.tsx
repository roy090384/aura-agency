import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Sun,
  Moon,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Users,
  Radar,
  Scale
} from 'lucide-react';
import { Language } from '../types/player';
import stadiumBg from '../assets/images/match_floodlights_stadium_1794074974336.jpg';

interface LoginPortalViewProps {
  language: Language;
  onToggleLanguage: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  diagnostic: {
    type: string;
    title: string;
    titleHe: string;
    message: string;
    messageHe: string;
    fixSteps: string[];
    fixStepsHe: string[];
    consoleUrl?: string;
  } | null;
  onLoginWithGoogle: () => Promise<void>;
  onLoginWithEmail: (email: string, pass: string) => Promise<void>;
  onResetPassword?: (email: string) => Promise<void>;
  onContinueLocal: () => void;
  isSyncing: boolean;
}

export const LoginPortalView: React.FC<LoginPortalViewProps> = ({
  language,
  onToggleLanguage,
  isDarkMode,
  setIsDarkMode,
  diagnostic,
  onLoginWithGoogle,
  onLoginWithEmail,
  onResetPassword,
  onContinueLocal,
  isSyncing
}) => {
  const isHe = language === 'he';
  const currentHostname =
    typeof window !== 'undefined' ? window.location.hostname : 'aura-agency.vercel.app';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(currentHostname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setLocalError(isHe ? 'נא להזין כתובת אימייל וסיסמה' : 'Please enter both email and password');
      return;
    }
    setLocalError(null);
    setLocalSuccess(null);
    try {
      await onLoginWithEmail(email.trim(), password);
    } catch (err: any) {
      const code = err?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setLocalError(isHe ? 'אימייל או סיסמה שגויים.' : 'Invalid email or password.');
      } else if (code === 'auth/too-many-requests') {
        setLocalError(
          isHe
            ? 'בוצעו יותר מדי ניסיונות התחברות. נסו שוב בעוד מספר דקות.'
            : 'Too many sign-in attempts. Please wait a few minutes and try again.'
        );
      } else if (code === 'auth/operation-not-allowed') {
        setLocalError(
          isHe
            ? 'ספק Email/Password אינו מופעל כרגע ב-Firebase Console.'
            : 'Email/Password sign-in is not enabled in Authentication settings.'
        );
      } else {
        setLocalError(err?.message || (isHe ? 'שגיאה בהתחברות למערכת' : 'Unable to sign in'));
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setLocalError(
        isHe
          ? 'הזינו את כתובת האימייל שלכם כדי לקבל קישור לאיפוס סיסמה'
          : 'Enter your email address above to receive a password reset link'
      );
      return;
    }
    if (!onResetPassword) return;
    setLocalError(null);
    setLocalSuccess(null);
    setIsResettingPassword(true);
    try {
      await onResetPassword(email.trim());
      setLocalSuccess(
        isHe
          ? 'נשלח מייל לאיפוס סיסמה (מומלץ לבדוק גם בתיקיית הספאם).'
          : 'Password reset link sent. Please check your inbox.'
      );
    } catch (err: any) {
      setLocalError(
        err?.message || (isHe ? 'שגיאה בשליחת מייל האיפוס' : 'Failed to send reset email')
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleGoogleClick = async () => {
    setLocalError(null);
    setLocalSuccess(null);
    try {
      await onLoginWithGoogle();
    } catch {
      // Diagnostic banner is updated in parent state
    }
  };

  const highlights = [
    {
      icon: Users,
      title: isHe ? 'ניהול סגלים והתראות חוזים' : 'Unified Rosters & Contract Radar',
      desc: isHe
        ? 'מעקב בזמן אמת אחר סגלי נשים, גברים, חוזים מסתיימים וימי הולדת.'
        : 'Live oversight across women’s & men’s rosters, expirations, and renewals.'
    },
    {
      icon: Radar,
      title: isHe ? 'סקאוטינג וצינור עסקאות' : 'Scouting & Deal Pipeline',
      desc: isHe
        ? 'תיעוד משאים ומתנים, מועמדים זרים, תיקי וידאו ולוחות משא ומתן.'
        : 'Structured deal stages, foreign targets, video dossiers, and contact logs.'
    },
    {
      icon: Scale,
      title: isHe ? 'מחשבון דמי השבחה ואימון FIFA' : 'FIFA Training & Solidarity Suite',
      desc: isHe
        ? 'הערכת פיצויי אימון וחלונות העברה קרובים בהתאם לתקנון הבינלאומי.'
        : 'Automated compensation breakdowns synchronized with transfer windows.'
    }
  ];

  const DirectionalArrow = isHe ? ArrowLeft : ArrowRight;

  return (
    <div
      dir={isHe ? 'rtl' : 'ltr'}
      className={`min-h-screen w-full flex flex-col lg:flex-row bg-[#F7F8FA] dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased ${
        isHe ? 'font-hebrew' : 'font-sans'
      }`}
    >
      {/* Left Brand Editorial Panel */}
      <aside className="hidden lg:flex lg:w-[46%] xl:w-[45%] relative overflow-hidden bg-[#0B1117] text-white flex-col justify-between p-10 xl:p-14 shrink-0">
        {/* Stadium Photography Backdrop */}
        <img
          src={stadiumBg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-35 scale-105 select-none pointer-events-none"
        />
        {/* Executive Obsidian & Gold Atmospheric Gradient */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-[#070B10]/95 via-[#0B1219]/85 to-[#121914]/90"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-amber-400/12 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute top-16 -right-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"
        />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="rounded-xl bg-white px-3 py-2 shadow-lg border border-white/25 shrink-0">
            <img
              src="/assets/aistudio/Brit_gold_c815fbe0.png"
              alt="BRIT SPORT GROUP"
              referrerPolicy="no-referrer"
              className="h-9 w-auto object-contain"
            />
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-wide text-white">BRIT SPORT GROUP</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-amber-300/90 font-semibold mt-0.5">
              {isHe ? 'מערכת ניהול סוכנות' : 'AGENCY WORKSPACE'}
            </div>
          </div>
        </div>

        {/* Editorial Headline & Capability Rows */}
        <div className="relative z-10 space-y-8 my-auto py-8 max-w-lg">
          <div className="space-y-3">
            <h1 className="text-3xl xl:text-[38px] font-extrabold tracking-tight leading-[1.15] text-white">
              {isHe
                ? 'ניהול שחקנים, חוזים והעברות במקום אחד'
                : 'Executive Talent & Transfer Management'}
            </h1>
            <p className="text-sm xl:text-[15px] leading-relaxed text-slate-300/90">
              {isHe
                ? 'סביבת העבודה הפרטית של הסוכנות לניהול שוטף של סגלים, עסקאות, סקאוטינג ורגולציית FIFA.'
                : 'Private agency workspace for rosters, contract expirations, live scouting pipelines, and international compliance.'}
            </p>
          </div>

          <div className="border-y border-white/12 divide-y divide-white/10">
            {highlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="py-4 flex items-start gap-3.5">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-white/8 border border-white/12 flex items-center justify-center text-amber-300 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-white leading-snug">{item.title}</h2>
                    <p className="text-xs text-slate-300/80 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quiet Legal/Domain Attribution */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-2">
          <span>
            {isHe
              ? 'מסגרת עבודה תואמת תקנות FIFA ו-UEFA'
              : 'FIFA & UEFA Licensed Management Framework'}
          </span>
          <span className="font-mono text-[11px] text-slate-400/80">BRIT CRM</span>
        </div>
      </aside>

      {/* Right Sign-In Workspace */}
      <main className="flex-1 flex flex-col justify-between px-5 sm:px-10 lg:px-14 xl:px-20 py-6 sm:py-8">
        {/* Top Utility Bar */}
        <div className="flex items-center justify-between gap-4">
          {/* Compact Mobile Brand Identity */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="rounded-lg bg-white px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0">
              <img
                src="/assets/aistudio/Brit_gold_c815fbe0.png"
                alt="BRIT SPORT GROUP"
                referrerPolicy="no-referrer"
                className="h-7 w-auto object-contain"
              />
            </div>
            <div>
              <div className="text-xs font-extrabold tracking-wide text-slate-900 dark:text-white">
                BRIT SPORT GROUP
              </div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 font-semibold">
                {isHe ? 'פורטל סוכנות' : 'AGENCY PORTAL'}
              </div>
            </div>
          </div>

          <div className="hidden lg:block" />

          {/* Language & Theme Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleLanguage}
              className="h-10 px-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label={isHe ? 'Switch to English' : 'החלף לעברית'}
            >
              {isHe ? 'EN' : 'עב'}
            </button>
            <button
              type="button"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="h-10 w-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              aria-label={
                isDarkMode
                  ? isHe
                    ? 'מעבר למצב בהיר'
                    : 'Switch to light theme'
                  : isHe
                    ? 'מעבר למצב כהה'
                    : 'Switch to dark theme'
              }
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Centered Sign-In Form Container */}
        <div className="w-full max-w-[430px] mx-auto my-auto py-8 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">
              {isHe ? 'התחברות למערכת הסוכנות' : 'Welcome back'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {isHe
                ? 'התחברו כדי לגשת לסביבת העבודה המשותפת של BRIT SPORT GROUP.'
                : 'Sign in to access your shared BRIT SPORT GROUP CRM workspace.'}
            </p>
          </div>

          {/* Inline Auth Diagnostic Banner */}
          {diagnostic && (
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-500/35 bg-amber-50/90 dark:bg-amber-950/35 text-amber-950 dark:text-amber-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-amber-900 dark:text-amber-300">
                    {isHe ? diagnostic.titleHe : diagnostic.title}
                  </h3>
                  <p className="text-xs leading-relaxed opacity-90">
                    {isHe ? diagnostic.messageHe : diagnostic.message}
                  </p>
                </div>
              </div>

              {diagnostic.type === 'unauthorized-domain' && (
                <div className="pt-2.5 border-t border-amber-200 dark:border-amber-800/50 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {isHe ? 'דומיין האתר להוספה:' : 'Website domain to authorize:'}
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 font-mono text-xs select-all text-amber-900 dark:text-amber-300 truncate">
                      {currentHostname}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyDomain}
                      className="h-8 px-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 shrink-0"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copied ? (isHe ? 'הועתק' : 'Copied') : isHe ? 'העתק' : 'Copy'}</span>
                    </button>
                  </div>

                  {diagnostic.consoleUrl && (
                    <a
                      href={diagnostic.consoleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
                    >
                      <span>{isHe ? 'פתיחת הגדרות דומיין' : 'Open Firebase Domain Settings'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Primary Google Sign-In CTA */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={isSyncing}
            className="w-full h-11 px-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-xs transition-all flex items-center justify-center gap-3 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{isHe ? 'המשך עם חשבון Google' : 'Continue with Google'}</span>
          </button>

          {/* Hairline Divider */}
          <div className="relative flex items-center py-0.5">
            <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isHe ? 'או התחברות עם אימייל צוות' : 'or sign in with team email'}
            </span>
            <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
          </div>

          {/* Email & Password Form */}
          <form onSubmit={handleSubmitEmail} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {isHe ? 'כתובת אימייל' : 'Email address'}
              </label>
              <div className="relative">
                <Mail
                  className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 pointer-events-none ${
                    isHe ? 'right-3.5' : 'left-3.5'
                  }`}
                />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@britsport.com"
                  className={`w-full h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                    isHe ? 'pr-10 pl-3.5' : 'pl-10 pr-3.5'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  {isHe ? 'סיסמה' : 'Password'}
                </label>
                {onResetPassword && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isResettingPassword}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline disabled:opacity-60"
                  >
                    {isResettingPassword
                      ? isHe
                        ? 'שולח...'
                        : 'Sending...'
                      : isHe
                        ? 'שכחתי סיסמה'
                        : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock
                  className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 pointer-events-none ${
                    isHe ? 'right-3.5' : 'left-3.5'
                  }`}
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${
                    isHe ? 'pr-10 pl-11' : 'pl-10 pr-11'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword
                      ? isHe
                        ? 'הסתר סיסמה'
                        : 'Hide password'
                      : isHe
                        ? 'הצג סיסמה'
                        : 'Show password'
                  }
                  className={`absolute top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ${
                    isHe ? 'left-2' : 'right-2'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {localError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs font-medium text-rose-700 dark:text-rose-300"
              >
                {localError}
              </div>
            )}

            {localSuccess && (
              <div
                role="status"
                className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-medium text-emerald-700 dark:text-emerald-300"
              >
                {localSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={isSyncing}
              className="w-full h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>{isHe ? 'התחברות למערכת' : 'Sign in'}</span>
            </button>
          </form>

          {/* Subtle Offline / Local Mode Fallback */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isHe ? 'מעדיפים לעבוד מקומית במכשיר זה?' : 'Working offline on this device?'}
            </span>
            <button
              type="button"
              onClick={onContinueLocal}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors py-1.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <span>{isHe ? 'כניסה במצב מקומי' : 'Continue offline'}</span>
              <DirectionalArrow className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quiet Footer */}
        <div className="text-center lg:text-start text-[11px] text-slate-400 dark:text-slate-500">
          <span>
            {isHe
              ? 'גישה מורשית לצוות הסוכנות בלבד · BRIT SPORT GROUP'
              : 'Authorized agency personnel only · BRIT SPORT GROUP'}
          </span>
        </div>
      </main>
    </div>
  );
};
