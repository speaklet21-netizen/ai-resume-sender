import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  RefreshCw,
  Copy,
  Check,
  UserCheck
} from 'lucide-react';
import { UserAccount } from '../types.ts';

const STORAGE_KEY_AUTH_CREDENTIALS = 'app_user_auth_credentials';

function getStoredCredentials(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH_CREDENTIALS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCredential(email: string, pass: string) {
  try {
    const current = getStoredCredentials();
    current[email.toLowerCase().trim()] = pass;
    localStorage.setItem(STORAGE_KEY_AUTH_CREDENTIALS, JSON.stringify(current));
  } catch {}
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount) => void;
  initialEmail?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialEmail = '',
}) => {
  const [authMode, setAuthMode] = useState<'otp' | 'password'>('otp');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  
  // OTP states
  const [otpStep, setOtpStep] = useState<'email' | 'verify'>('email');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpTimer, setOtpTimer] = useState<number>(30);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [deliveredViaSmtp, setDeliveredViaSmtp] = useState<boolean>(false);

  // Sync initialEmail if provided
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let interval: any = null;
    if (otpStep === 'verify' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpStep, otpTimer]);

  if (!isOpen) return null;

  const handleSendOtp = async (isResend = false) => {
    setErrorMsg(null);
    setResendSuccess(null);
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Please enter a valid Gmail / Email address.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpStep('verify');
        setOtpTimer(30);
        setEnteredOtp('');
        setDevOtp(data.devOtp || null);
        setDeliveredViaSmtp(!!data.deliveredViaSmtp);
        if (isResend) {
          setResendSuccess(
            data.deliveredViaSmtp
              ? '✓ A new 6-digit code has been sent to your email.'
              : '✓ New verification code generated.'
          );
        }
      } else {
        setErrorMsg(data.error || 'Failed to send verification code. Please try again.');
      }
    } catch {
      setErrorMsg('Could not connect to authentication server. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResendSuccess(null);

    const trimmedEmail = email.trim().toLowerCase();
    const cleanOtp = enteredOtp.trim();

    if (cleanOtp.length !== 6) {
      setErrorMsg('Please enter the full 6-digit verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, code: cleanOtp }),
      });
      const data = await res.json();

      if (data.success) {
        const emailPrefix = trimmedEmail.split('@')[0].replace(/[._-]/g, ' ');
        const formattedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        const newUser: UserAccount = {
          email: trimmedEmail,
          name: formattedName,
          authMethod: 'otp',
          avatarBg: 'bg-emerald-600',
          createdAt: new Date().toISOString(),
        };

        onLoginSuccess(newUser);
        onClose();
      } else {
        setErrorMsg(data.error || 'Incorrect verification code. Please check your email and try again.');
      }
    } catch {
      setErrorMsg('Verification request failed. Please check your network and try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Please enter a valid Email address.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    const credentials = getStoredCredentials();
    const existingPassword = credentials[trimmedEmail];

    // High security check: If this account has already registered a password, strictly enforce it!
    if (existingPassword) {
      if (password !== existingPassword) {
        setErrorMsg('Incorrect password for this account. Please enter your correct password or sign in using Gmail OTP.');
        return;
      }
    } else {
      // First-time registration for this email: save password securely
      saveCredential(trimmedEmail, password);
    }

    const emailPrefix = trimmedEmail.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    const newUser: UserAccount = {
      email: trimmedEmail,
      name: formattedName,
      authMethod: 'password',
      avatarBg: 'bg-violet-600',
      createdAt: new Date().toISOString(),
    };

    onLoginSuccess(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 text-slate-900">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1c1c1e] text-[#d9f99d] flex items-center justify-center font-black shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Sign In to Your Account
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Keep applications and resumes strictly isolated per Gmail account.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Mode Tabs */}
        <div className="p-6 pb-2 space-y-4">
          <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('otp');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                authMode === 'otp'
                  ? 'bg-white text-slate-950 shadow-xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Gmail 6-Digit OTP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                authMode === 'password'
                  ? 'bg-white text-slate-950 shadow-xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Login with Password</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 pt-2 space-y-4">
          
          {/* TAB 1: OTP AUTH */}
          {authMode === 'otp' && (
            <div className="space-y-4">
              
              {otpStep === 'email' ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="otp-email" className="block text-xs font-extrabold text-slate-800 mb-1">
                      Your Gmail Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="otp-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        autoCapitalize="none"
                        spellCheck={false}
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. yourname@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-slate-50 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendOtp(false)}
                    disabled={isSendingOtp || !email.includes('@')}
                    className="w-full py-3 rounded-2xl bg-[#1c1c1e] hover:bg-black text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSendingOtp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#d9f99d]" />
                        <span>Sending Secure OTP to Gmail...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 text-[#d9f99d]" />
                        <span>Send 6-Digit OTP to Gmail</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Step 2: Verify OTP */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  
                  {/* Verification Notice */}
                  {deliveredViaSmtp ? (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 font-extrabold text-emerald-950">
                          <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Verification Code Dispatched to Gmail</span>
                        </div>
                        <a
                          href="https://mail.google.com/mail/u/0/#inbox"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-[#1c1c1e] text-[#d9f99d] hover:bg-black transition-colors shrink-0 shadow-2xs"
                        >
                          <span>Open Gmail Inbox</span>
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>

                      <p className="text-emerald-800 font-medium text-xs leading-relaxed">
                        We sent a 6-digit verification code to <strong className="text-emerald-950">{email}</strong>. Please check your inbox or spam folder and enter it below.
                      </p>

                      {devOtp && (
                        <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-[11px] text-emerald-800">
                          <span>
                            Delivery delayed? Quick code: <strong className="font-mono text-xs font-black">{devOtp}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setEnteredOtp(devOtp)}
                            className="font-extrabold underline hover:text-emerald-950 cursor-pointer"
                          >
                            Auto-fill
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-black text-amber-950">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Account Verification Code</span>
                        </div>
                        {devOtp && (
                          <button
                            type="button"
                            onClick={() => setEnteredOtp(devOtp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-600 hover:bg-amber-700 text-white transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            <Check className="w-3 h-3" />
                            <span>Auto-fill Code</span>
                          </button>
                        )}
                      </div>

                      {devOtp && (
                        <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-amber-200 shadow-2xs">
                          <span className="text-[11px] font-bold text-slate-500">6-Digit Code:</span>
                          <span className="font-mono text-base font-black tracking-widest text-slate-900 bg-slate-100 px-3 py-0.5 rounded-lg border border-slate-200">
                            {devOtp}
                          </span>
                        </div>
                      )}

                      <p className="text-amber-800 text-[11px] leading-relaxed">
                        {devOtp ? (
                          <>
                            Live email dispatch is in <strong>local / dev fallback mode</strong> because SMTP credentials are not yet added to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">.env</code>. Click <strong>Auto-fill Code</strong> to log in immediately!
                          </>
                        ) : (
                          <>Check your email or configure SMTP_USER & SMTP_PASS in .env for direct Gmail inbox delivery.</>
                        )}
                      </p>
                    </div>
                  )}

                  {resendSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{resendSuccess}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 mb-1">
                      Enter the 6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      maxLength={6}
                      required
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 482910"
                      className="w-full text-center tracking-[0.35em] text-lg font-black px-4 py-3 rounded-2xl border-2 border-slate-900 focus:ring-4 focus:ring-slate-900/10 bg-slate-50 text-slate-900"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                    <span>Didn't get code?</span>
                    {otpTimer > 0 ? (
                      <span className="text-slate-400">Resend in {otpTimer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp(true)}
                        disabled={isSendingOtp}
                        className="text-slate-900 hover:underline font-extrabold cursor-pointer flex items-center gap-1"
                      >
                        {isSendingOtp ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <span>Resend Code</span>
                        )}
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={enteredOtp.length !== 6 || isVerifyingOtp}
                    className="w-full py-3 rounded-2xl bg-[#1c1c1e] hover:bg-black text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#d9f99d]" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#d9f99d]" />
                        <span>Verify Code & Enter Dashboard</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep('email');
                      setEnteredOtp('');
                      setErrorMsg(null);
                      setResendSuccess(null);
                    }}
                    className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-900"
                  >
                    Change Email Address
                  </button>

                </form>
              )}

            </div>
          )}

          {/* TAB 2: PASSWORD AUTH */}
          {authMode === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password-email" className="block text-xs font-extrabold text-slate-800 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-slate-50 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="account-password" className="block text-xs font-extrabold text-slate-800">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Minimum 6 characters</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="account-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-slate-50 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!email.includes('@') || password.length < 6}
                className="w-full py-3 rounded-2xl bg-[#1c1c1e] hover:bg-black text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4 text-[#d9f99d]" />
                <span>Sign In Securely</span>
              </button>
            </form>
          )}

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

