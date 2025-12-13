import React, { useRef, useState, useEffect } from "react";
import { useAuthContext, getAuthToken } from "../../contexts/AuthContext";
import { ConfirmModal } from "../common/ConfirmModal";
import {
  FiEye,
  FiEyeOff,
  FiHardDrive,
  FiLoader,
  FiKey,
  FiCheckCircle,
  FiAlertCircle,
  FiLogOut,
  FiDownload,
  FiUpload,
  FiX,
  FiTrash2,
  FiAlertTriangle,
  FiChevronRight,
  FiChevronDown
} from "react-icons/fi";

// API requests use relative URLs - Vite proxy handles forwarding in dev
const API_BASE_URL = '';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

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
          <FiEyeOff className="h-5 w-5" />
        ) : (
          <FiEye className="h-5 w-5" />
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
        const response = await fetch('/api/watchlist/stats', {
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
        <FiHardDrive className="h-4 w-4 text-brand-primary" />
        Storage Info
      </h3>
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <FiLoader className="animate-spin h-5 w-5 text-brand-primary" />
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

  // Wipe Watchlist state
  // Wipe/Delete state
  const [isDangerZoneExpanded, setIsDangerZoneExpanded] = useState(false);
  const [showDangerConfirm, setShowDangerConfirm] = useState(false);
  const [dangerAction, setDangerAction] = useState<"wipe" | "delete">("wipe");
  const [confirmationText, setConfirmationText] = useState("");
  const [isProcessingDanger, setIsProcessingDanger] = useState(false);

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

  const handleDangerAction = async () => {
    const requiredText = dangerAction === "wipe" ? "delete my watchlist" : "delete my account";
    if (confirmationText !== requiredText) return;

    setIsProcessingDanger(true);
    try {
      const token = getAuthToken();

      if (dangerAction === "wipe") {
        const response = await fetch(`${API_BASE_URL}/api/watchlist`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to wipe watchlist");

        setShowDangerConfirm(false);
        onClose();
        window.location.reload();
      } else {
        const response = await fetch(`${API_BASE_URL}/api/auth`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to delete account");

        logout();
        onClose();
        setShowDangerConfirm(false);
      }
    } catch (error) {
      console.error(`Failed to ${dangerAction}:`, error);
      alert(`Failed to ${dangerAction === "wipe" ? "wipe watchlist" : "delete account"}. Please try again.`);
    } finally {
      setIsProcessingDanger(false);
    }
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
            <FiX />
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
                  <FiKey className="h-4 w-4" />
                  Change Password
                </button>
              ) : (
                <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
                  {/* Status Messages */}
                  {passwordError && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <FiAlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-red-400 text-sm">{passwordError}</p>
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="flex items-start gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <FiCheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
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
                              <FiLoader className="animate-spin h-4 w-4" />
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
                <FiLogOut className="h-5 w-5" />
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
                <FiDownload className="h-5 w-5" />
                Export
              </button>
              <button
                onClick={handleImportClick}
                className="flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <FiUpload className="h-5 w-5" />
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
          <section className="pt-4 border-t border-white/10">
            <button
              onClick={() => setIsDangerZoneExpanded(!isDangerZoneExpanded)}
              className="w-full flex items-center justify-between text-left mb-3 group"
            >
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 group-hover:text-red-400 transition-colors">
                <FiAlertTriangle className="h-4 w-4 text-red-500" />
                Danger Zone
              </h3>
              {isDangerZoneExpanded ? (
                <FiChevronDown className="h-4 w-4 text-brand-text-dim" />
              ) : (
                <FiChevronRight className="h-4 w-4 text-brand-text-dim" />
              )}
            </button>

            {isDangerZoneExpanded && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-fadeIn">
                <p className="text-sm text-brand-text-dim mb-4">
                  These actions are permanent and cannot be undone.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setDangerAction("wipe");
                      setShowDangerConfirm(true);
                      setConfirmationText("");
                    }}
                    className="w-full py-2.5 px-4 rounded-lg font-semibold transition-colors bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center gap-2"
                  >
                    <FiTrash2 className="h-4 w-4" />
                    Wipe Watchlist
                  </button>
                  <button
                    onClick={() => {
                      setDangerAction("delete");
                      setShowDangerConfirm(true);
                      setConfirmationText("");
                    }}
                    className="w-full py-2.5 px-4 rounded-lg font-semibold transition-colors bg-white/5 hover:bg-red-500/20 text-red-500 border border-red-500/30 hover:border-red-500/50 flex items-center justify-center gap-2"
                  >
                    <FiTrash2 className="h-4 w-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            )}
          </section>

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

      {/* Danger Confirmation Modal - Nested */}
      {showDangerConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-brand-surface border border-red-500/30 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fadeIn">
            <h3 className="text-xl font-bold text-white mb-2">
              {dangerAction === "wipe" ? "Wipe Watchlist?" : "Delete Account?"}
            </h3>
            <p className="text-brand-text-dim text-sm mb-6">
              This action cannot be undone. This will permanently delete your {dangerAction === "wipe" ? "entire watchlist history" : "account and all associated data"}.
            </p>

            <div className="mb-6">
              <label className="block text-xs text-brand-text-dim mb-2">
                Type <span className="text-white font-mono bg-white/10 px-1 rounded">
                  {dangerAction === "wipe" ? "delete my watchlist" : "delete my account"}
                </span> to confirm
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
                placeholder={dangerAction === "wipe" ? "delete my watchlist" : "delete my account"}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDangerConfirm(false)}
                className="flex-1 py-2 rounded-lg font-medium text-brand-text-dim hover:text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDangerAction}
                disabled={
                  confirmationText !== (dangerAction === "wipe" ? "delete my watchlist" : "delete my account") ||
                  isProcessingDanger
                }
                className="flex-1 py-2 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isProcessingDanger ? (
                  <>
                    <FiLoader className="animate-spin h-4 w-4" />
                    Deleting...
                  </>
                ) : (
                  "Delete everything"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
