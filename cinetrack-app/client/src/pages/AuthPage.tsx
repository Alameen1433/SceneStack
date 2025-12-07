import React, { useState, useCallback } from "react";
import { useAuthContext } from "../contexts/AuthContext";

// Password input with show/hide toggle
const PasswordInput: React.FC<{
    id: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    minLength?: number;
}> = ({ id, value, onChange, required, minLength }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <input
                id={id}
                type={showPassword ? "text" : "password"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                minLength={minLength}
                className="w-full px-4 py-3 pr-12 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/50 transition-all"
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-text-dim hover:text-white transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
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

export const AuthPage: React.FC = () => {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login, register, error, clearError } = useAuthContext();

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setIsSubmitting(true);
            clearError();

            if (mode === "login") {
                await login(email, password);
            } else {
                await register(email, password, inviteCode);
            }

            setIsSubmitting(false);
        },
        [mode, email, password, inviteCode, login, register, clearError]
    );

    const toggleMode = () => {
        setMode(mode === "login" ? "register" : "login");
        clearError();
    };

    return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-brand-primary/20 to-transparent rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-brand-secondary/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            {/* Auth Card */}
            <div className="relative w-full max-w-md">
                {/* Glassmorphism Card */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-black tracking-tighter text-white">
                            Scene<span className="text-brand-secondary">Stack</span>
                        </h1>
                        <p className="text-brand-text-dim mt-2">Track your watchlist</p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-black/30 rounded-xl p-1 mb-6">
                        <button
                            onClick={() => { setMode("login"); clearError(); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${mode === "login"
                                ? "bg-brand-primary text-white shadow-lg"
                                : "text-brand-text-dim hover:text-white"
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { setMode("register"); clearError(); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${mode === "register"
                                ? "bg-brand-primary text-white shadow-lg"
                                : "text-brand-text-dim hover:text-white"
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-2 animate-shake">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm text-brand-text-dim mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/50 transition-all"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm text-brand-text-dim mb-2">
                                Password
                            </label>
                            <PasswordInput
                                id="password"
                                value={password}
                                onChange={setPassword}
                                required
                                minLength={6}
                            />
                        </div>

                        {mode === "register" && (
                            <div className="animate-slideDown">
                                <label htmlFor="inviteCode" className="block text-sm text-brand-text-dim mb-2">
                                    Invite Code
                                </label>
                                <input
                                    id="inviteCode"
                                    type="text"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    required={mode === "register"}
                                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/50 transition-all"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 mt-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold rounded-xl shadow-lg hover:shadow-brand-primary/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : mode === "login" ? (
                                "Sign In"
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-brand-text-dim text-sm mt-6">
                        {mode === "login" ? (
                            <>
                                Don't have an account?{" "}
                                <button onClick={toggleMode} className="text-brand-secondary hover:underline font-semibold">
                                    Sign up
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{" "}
                                <button onClick={toggleMode} className="text-brand-secondary hover:underline font-semibold">
                                    Sign in
                                </button>
                            </>
                        )}
                    </p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-brand-primary/10 via-transparent to-brand-secondary/10 rounded-full blur-3xl" />
            </div>

            {/* CSS Animations */}
            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
        </div>
    );
};
