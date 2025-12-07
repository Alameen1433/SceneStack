import React, { useRef, useState, useEffect } from "react";
import { useAuthContext, getAuthToken } from "../../contexts/AuthContext";
import { ConfirmModal } from "../common/ConfirmModal";

// API requests use relative URLs - Vite proxy handles forwarding in dev
const API_BASE_URL = '';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

// Password input with show/hide toggle
const PasswordInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
}> = ({ value, onChange, required, minLength }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 pr-10 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-primary transition-colors"
        required={required}
        minLength={minLength}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-brand-text-dim hover:text-white transition-colors"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  );
};

// Storage Stats component
const StorageStats: React.FC = () => {
  const [stats, setStats] = useState<{
    user: { itemCount: number };
    collection: { totalDocuments: number; storageSize: number; avgObjSize: number };
    database: { name: string; dataSize: number };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = getAuthToken();
        const response = await fetch('/api/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError('Unable to load storage info');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <section className="pt-4 border-t border-white/10">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
        Storage Info
      </h3>
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <svg className="animate-spin h-5 w-5 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-xs text-brand-text-dim">Your Items</p>
            <p className="text-lg font-bold text-white">{stats.user.itemCount}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-xs text-brand-text-dim">Storage Used</p>
            <p className="text-lg font-bold text-white">{formatBytes(stats.database.dataSize)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 col-span-2">
            <p className="text-xs text-brand-text-dim">Database</p>
            <p className="text-sm font-medium text-white">{stats.database.name}</p>
            <p className="text-xs text-brand-text-dim mt-1">
              {stats.collection.totalDocuments} total items in collection
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onExport,
  onImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, logout } = useAuthContext();

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match. Please make sure both fields are identical.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from your current password.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/api/auth/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess(true);
        resetPasswordForm();
      } else {
        setPasswordError(data.message || "Failed to change password. Please try again.");
      }
    } catch {
      setPasswordError("Unable to connect to the server. Please check your connection and try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleClosePasswordForm = () => {
    setShowPasswordForm(false);
    resetPasswordForm();
    setPasswordSuccess(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl w-full max-w-md p-6 text-brand-text-light max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-brand-text-dim hover:text-white transition-colors text-2xl leading-none p-1 hover:bg-white/10 rounded-lg"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Account Section */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-text-dim mb-3">
              Account
            </h3>
            <div className="bg-black/30 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white text-lg font-bold">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{user?.email}</p>
                  <p className="text-sm text-brand-text-dim">Logged in</p>
                </div>
              </div>

              {/* Change Password Toggle */}
              {!showPasswordForm ? (
                <button
                  onClick={() => { setShowPasswordForm(true); setPasswordSuccess(false); }}
                  className="w-full mt-4 py-2 px-4 rounded-lg font-medium transition-colors bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Change Password
                </button>
              ) : (
                <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
                  {/* Status Messages */}
                  {passwordError && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-400 text-sm">{passwordError}</p>
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="flex items-start gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-green-400 text-sm font-medium">Password updated successfully!</p>
                        <p className="text-green-400/70 text-xs mt-1">Your new password is now active. Use it the next time you log in.</p>
                      </div>
                    </div>
                  )}

                  {!passwordSuccess && (
                    <>
                      <div>
                        <label className="block text-xs text-brand-text-dim mb-1.5">Current Password</label>
                        <PasswordInput
                          value={currentPassword}
                          onChange={setCurrentPassword}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-brand-text-dim mb-1.5">New Password</label>
                        <PasswordInput
                          value={newPassword}
                          onChange={setNewPassword}
                          required
                          minLength={6}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-brand-text-dim mb-1.5">Confirm New Password</label>
                        <PasswordInput
                          value={confirmPassword}
                          onChange={setConfirmPassword}
                          required
                          minLength={6}
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleClosePasswordForm}
                          className="flex-1 py-2 px-4 rounded-lg font-medium transition-colors bg-white/10 hover:bg-white/20 text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isChangingPassword}
                          className="flex-1 py-2 px-4 rounded-lg font-medium transition-colors bg-brand-primary hover:bg-brand-secondary text-white disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isChangingPassword ? (
                            <>
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Updating...
                            </>
                          ) : (
                            "Update Password"
                          )}
                        </button>
                      </div>
                    </>
                  )}

                  {passwordSuccess && (
                    <button
                      type="button"
                      onClick={handleClosePasswordForm}
                      className="w-full py-2 px-4 rounded-lg font-medium transition-colors bg-white/10 hover:bg-white/20 text-white"
                    >
                      Done
                    </button>
                  )}
                </form>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full mt-3 py-2 px-4 rounded-lg font-semibold transition-colors bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </section>

          {/* Backup & Transfer Section */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-text-dim mb-3">
              Backup & Transfer
            </h3>
            <p className="text-sm text-brand-text-dim mb-4">
              Export your watchlist to a file for backup, or import from a previous export.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onExport}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all bg-brand-primary hover:bg-brand-secondary text-white flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
              <button
                onClick={handleImportClick}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={onImport}
                accept="application/json,.json"
                className="hidden"
                aria-hidden="true"
              />
            </div>
          </section>

          {/* Storage Stats */}
          <StorageStats />

          {/* App Info */}
          <section className="pt-4 border-t border-white/10">
            <p className="text-center text-xs text-brand-text-dim">
              SceneStack v1.0 • Your personal watchlist tracker
            </p>
          </section>
        </div>
      </div>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign Out"
        cancelText="Cancel"
        confirmStyle="danger"
        onConfirm={() => {
          logout();
          onClose();
          setShowLogoutConfirm(false);
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};
