import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  Mail, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { Language } from '../types/player';
import { TRANSLATIONS } from '../translations/translations';
import firebaseConfig from '../../firebase-applet-config.json';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
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
  onLoginAnonymously: () => Promise<void>;
  isSyncing: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  language,
  diagnostic,
  onLoginWithGoogle,
  onLoginWithEmail,
  onLoginAnonymously,
  isSyncing
}) => {
  if (!isOpen) return null;

  const isHe = language === 'he';
  const t = TRANSLATIONS[language];
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'aura-agency.vercel.app';

  const [activeTab, setActiveTab] = useState<'google' | 'email' | 'agent'>('google');
  const [email, setEmail] = useState('roy090384@gmail.com');
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(currentHostname);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError(isHe ? 'נא להזין אימייל וסיסמה' : 'Please provide both email and password');
      return;
    }
    setLocalError(null);
    try {
      await onLoginWithEmail(email, password);
      onClose();
    } catch (err: any) {
      setLocalError(err?.message || (isHe ? 'שגיאה בהתחברות' : 'Authentication failed'));
    }
  };

  const handleGoogleClick = async () => {
    setLocalError(null);
    try {
      await onLoginWithGoogle();
      onClose();
    } catch (err: any) {
      // Diagnostic will update automatically in parent
    }
  };

  const handleAgentClick = async () => {
    setLocalError(null);
    try {
      await onLoginAnonymously();
      onClose();
    } catch (err: any) {
      setLocalError(err?.message || (isHe ? 'שגיאה בהתחברות' : 'Anonymous login failed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]"
        dir={isHe ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isHe ? 'חיבור למסד הנתונים בענן (Firebase)' : 'Connect to Firebase Cloud Database'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isHe ? `פרויקט: ${firebaseConfig.projectId}` : `Project: ${firebaseConfig.projectId}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto">

          {/* Diagnostic Banner if error occurred */}
          {diagnostic && (
            <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50/90 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                    {isHe ? diagnostic.titleHe : diagnostic.title}
                  </h4>
                  <p className="text-xs leading-relaxed opacity-90">
                    {isHe ? diagnostic.messageHe : diagnostic.message}
                  </p>
                </div>
              </div>

              {/* Authorized Domain Step Guide */}
              {diagnostic.type === 'unauthorized-domain' && (
                <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-800/50 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    {isHe ? 'דומיין האתר שלך להוספה:' : 'Your Website Domain to Add:'}
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 py-1 px-2.5 rounded-md bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 font-mono text-xs select-all text-amber-900 dark:text-amber-300">
                      {currentHostname}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyDomain}
                      className="py-1 px-2.5 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? (isHe ? 'הועתק!' : 'Copied!') : (isHe ? 'העתק' : 'Copy')}</span>
                    </button>
                  </div>

                  <div className="text-[11px] space-y-1 text-slate-600 dark:text-slate-400 pt-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {isHe ? 'כיצד לתקן ב-30 שניות ב-Firebase Console:' : 'How to fix in 30 seconds in Firebase Console:'}
                    </p>
                    <ol className="list-decimal list-inside space-y-0.5 text-[11px] opacity-90 pl-1">
                      {(isHe ? diagnostic.fixStepsHe : diagnostic.fixSteps).map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {diagnostic.consoleUrl && (
                    <a
                      href={diagnostic.consoleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-2xs mt-1"
                    >
                      <span>{isHe ? 'פתח את הגדרות הדומיין ב-Firebase' : 'Open Firebase Console Settings'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab Selector */}
          <div className="grid grid-cols-3 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('google')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'google'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Google</span>
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'email'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{isHe ? 'אימייל וסיסמה' : 'Email'}</span>
            </button>
            <button
              onClick={() => setActiveTab('agent')}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'agent'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isHe ? 'חיבור מהיר' : '1-Click'}</span>
            </button>
          </div>

          {/* TAB 1: Google OAuth */}
          {activeTab === 'google' && (
            <div className="space-y-3 py-2">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {isHe
                  ? 'התחבר באמצעות חשבון ה-Google שלך כדי לסנכרן את כל נתוני השחקנים, הסקאוטינג והמעקב ישירות לענן של Firebase.'
                  : 'Sign in with your Google account to sync all players, scouting prospects, and player tracker stats directly to Firebase.'}
              </p>

              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isSyncing}
                className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-2xs transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>{isHe ? 'התחבר עם Google' : 'Sign in with Google'}</span>
              </button>
            </div>
          )}

          {/* TAB 2: Email & Password */}
          {activeTab === 'email' && (
            <form onSubmit={handleSubmitEmail} className="space-y-3 py-1">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                {isHe
                  ? '💡 חיבור באימייל פועל בכל דומיין ללא תלות באישור דומיין ב-Google OAuth.'
                  : '💡 Direct email sign-in bypasses domain authorization checks and works on any custom domain.'}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isHe ? 'כתובת אימייל' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className={`w-4 h-4 text-slate-400 absolute top-2.5 ${isHe ? 'right-3' : 'left-3'}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="agent@aura-agency.com"
                    className={`w-full py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden ${isHe ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isHe ? 'סיסמה' : 'Password'}
                </label>
                <div className="relative">
                  <Lock className={`w-4 h-4 text-slate-400 absolute top-2.5 ${isHe ? 'right-3' : 'left-3'}`} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className={`w-full py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden ${isHe ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
                  />
                </div>
              </div>

              {localError && (
                <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {localError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSyncing}
                className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span>{isHe ? 'התחבר / צור חשבון' : 'Sign In / Connect'}</span>
              </button>
            </form>
          )}

          {/* TAB 3: 1-Click Agent Sync */}
          {activeTab === 'agent' && (
            <div className="space-y-3 py-2">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {isHe
                  ? 'התחבר באופן מיידי ללא סיסמה. מתחבר מיידית למסד הנתונים בענן ומאפשר סנכרון שחקנים ונתונים באופן שקוף.'
                  : 'Instantly connect with a secure agent session. Allows instant cloud sync with zero configuration.'}
              </p>

              <button
                type="button"
                onClick={handleAgentClick}
                disabled={isSyncing}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{isHe ? 'התחבר ב-1-Click למסד הנתונים' : '1-Click Agent Session'}</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between text-xs text-slate-500">
          <span>{isHe ? 'אבטחת Zero-Trust ב-Firestore' : 'Zero-Trust Firestore Security'}</span>
          <button
            onClick={onClose}
            className="py-1 px-3 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors font-semibold"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};
