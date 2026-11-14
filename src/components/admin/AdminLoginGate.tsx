import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Phone,
  ArrowLeft,
} from 'lucide-react';

interface AdminLoginGateProps {
  onSuccess?: () => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({ onSuccess }) => {
  const {
    needsInitialSetup,
    setupSuperAdmin,
    loginWithCredentials,
    requestPasswordReset,
    resetPasswordWithToken,
    setCurrentRoute,
  } = useApp();

  type AuthMode = 'login' | 'forgot' | 'reset';
  const [mode, setMode] = useState<AuthMode>('login');

  // Login State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Initial Super Admin Setup State
  const [setupName, setSetupName] = useState('');
  const [setupUsername, setSetupUsername] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPhone, setSetupPhone] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');

  // Recovery State
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newRecoveryPassword, setNewRecoveryPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your username or email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    try {
      const res = await loginWithCredentials(identifier.trim(), password);
      if (res.success) {
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.error || 'Authentication failed. Check your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (!setupName.trim() || !setupUsername.trim() || !setupEmail.trim()) {
      setErrorMessage('Full name, username, and email address are required.');
      return;
    }
    if (setupPassword !== setupConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await setupSuperAdmin({
        name: setupName.trim(),
        username: setupUsername.trim(),
        email: setupEmail.trim(),
        phone: setupPhone.trim(),
        password: setupPassword,
      });
      if (res.success) {
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.error || 'Unable to create initial Super Admin account.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unexpected error during initial setup.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    if (!recoveryIdentifier.trim()) {
      setErrorMessage('Enter your email address or username.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestPasswordReset(recoveryIdentifier.trim());
      if (res.success) {
        setInfoMessage(
          res.message ||
            'If an active account matches that identifier, contact your Super Admin for your single-use recovery token and enter it below.'
        );
        setMode('reset');
      } else {
        setErrorMessage(res.error || 'Could not process recovery request.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetWithTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    if (!recoveryToken.trim() || !newRecoveryPassword) {
      setErrorMessage('Recovery token and new password are required.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPasswordWithToken(recoveryToken.trim(), newRecoveryPassword);
      if (res.success) {
        setInfoMessage(res.message || 'Password updated. You can now sign in with your new credentials.');
        setRecoveryToken('');
        setNewRecoveryPassword('');
        setPassword('');
        setMode('login');
      } else {
        setErrorMessage(res.error || 'Invalid or expired recovery token.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-16 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Top Bar Navigation */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white block leading-tight">Airflow Climate Solutions</span>
            <span className="text-[10px] text-slate-400 font-mono">Authenticated Staff Gateway</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCurrentRoute('/')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Return to Live Website</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex p-2.5 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-200 mb-2">
              {needsInitialSetup ? (
                <KeyRound className="w-5 h-5 text-amber-400" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <h2 className="text-xl font-extrabold text-white font-heading">
              {needsInitialSetup
                ? 'Initial Super Admin Setup'
                : mode === 'login'
                ? 'Staff Account Sign In'
                : mode === 'forgot'
                ? 'Password Recovery'
                : 'Reset Password with Token'}
            </h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              {needsInitialSetup
                ? 'No active Super Admin account has been configured yet. Create the primary Super Admin credentials to initialize access control.'
                : mode === 'login'
                ? 'Sign in with your personal username or email and password. Your dashboard and permissions are determined by your assigned role.'
                : mode === 'forgot'
                ? 'Request account recovery guidance or enter a single-use recovery token provided by your Super Admin.'
                : 'Enter the single-use recovery token issued by your Super Admin and choose a strong new password.'}
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl flex items-start gap-2.5 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{errorMessage}</div>
            </div>
          )}

          {infoMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-start gap-2.5 text-emerald-200 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{infoMessage}</div>
            </div>
          )}

          {/* MODE A: INITIAL SUPER ADMIN SETUP */}
          {needsInitialSetup && (
            <form onSubmit={handleSetupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={setupName}
                    onChange={(e) => setSetupName(e.target.value)}
                    placeholder="Primary Administrator"
                    className="w-full bg-slate-950 text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 text-xs focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={setupUsername}
                    onChange={(e) => setSetupUsername(e.target.value)}
                    placeholder="superadmin"
                    autoComplete="username"
                    className="w-full bg-slate-950 text-white px-3 py-2 rounded-xl border border-slate-700 text-xs font-mono focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={setupPhone}
                      onChange={(e) => setSetupPhone(e.target.value)}
                      placeholder="(800) 555-0199"
                      className="w-full bg-slate-950 text-white pl-8 pr-3 py-2 rounded-xl border border-slate-700 text-xs focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Work Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    placeholder="admin@company.com"
                    autoComplete="email"
                    className="w-full bg-slate-950 text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 text-xs focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    placeholder="Min 8 chars, upper/lower & number"
                    autoComplete="new-password"
                    className="w-full bg-slate-950 text-white pl-9 pr-10 py-2 rounded-xl border border-slate-700 text-xs focus:border-amber-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={setupConfirmPassword}
                    onChange={(e) => setSetupConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className="w-full bg-slate-950 text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 text-xs focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                    <span>Initializing Super Admin...</span>
                  </>
                ) : (
                  <>
                    <span>Create Super Admin Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE B: STANDARD INDIVIDUAL CREDENTIALS SIGN IN */}
          {!needsInitialSetup && mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Username or Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="username or email@company.com"
                    required
                    autoComplete="username"
                    className="w-full bg-slate-950 text-white pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setInfoMessage(null);
                      setMode('forgot');
                    }}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full bg-slate-950 text-white pl-9 pr-10 py-2.5 rounded-xl border border-slate-700 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE C: PASSWORD RECOVERY REQUEST */}
          {!needsInitialSetup && mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Account Username or Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={recoveryIdentifier}
                    onChange={(e) => setRecoveryIdentifier(e.target.value)}
                    placeholder="username or email@company.com"
                    required
                    className="w-full bg-slate-950 text-white pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Submit Recovery Request</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center justify-between pt-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setInfoMessage(null);
                    setMode('login');
                  }}
                  className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setMode('reset');
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                >
                  I have a recovery token →
                </button>
              </div>
            </form>
          )}

          {/* MODE D: RESET PASSWORD USING TOKEN */}
          {!needsInitialSetup && mode === 'reset' && (
            <form onSubmit={handleResetWithTokenSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Single-Use Recovery Token
                </label>
                <input
                  type="text"
                  value={recoveryToken}
                  onChange={(e) => setRecoveryToken(e.target.value)}
                  placeholder="Paste recovery token issued by Super Admin"
                  required
                  className="w-full bg-slate-950 text-white px-3 py-2.5 rounded-xl border border-slate-700 text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newRecoveryPassword}
                    onChange={(e) => setNewRecoveryPassword(e.target.value)}
                    placeholder="Min 8 chars, upper/lower & number"
                    required
                    className="w-full bg-slate-950 text-white pl-9 pr-10 py-2.5 rounded-xl border border-slate-700 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Update Password</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setInfoMessage(null);
                  setMode('login');
                }}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}
        </div>

        {/* Security Footer Notice */}
        <div className="mt-4 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-slate-600" />
          <span>Individual Credentials · Scrypt Password Hashing · Server-Enforced RBAC</span>
        </div>
      </div>
    </div>
  );
};
