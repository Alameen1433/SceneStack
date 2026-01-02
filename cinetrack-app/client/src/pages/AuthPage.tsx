import React, { useState, useCallback } from "react";
import { useAuthContext } from "../contexts/AuthContext";
import { FiEye, FiEyeOff, FiAlertCircle, FiLoader } from "react-icons/fi";

const PasswordInput: React.FC<{
    id: string;
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    hasError?: boolean;
}> = ({ id, value, onChange, onBlur, hasError }) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <input
                id={id}
                type={showPassword ? "text" : "password"}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                className={`w-full px-4 py-3 pr-12 bg-black/40 border rounded-lg text-white placeholder:text-brand-text-muted focus:outline-none focus:ring-1 transition-all ${hasError
                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
                    : "border-white/5 focus:border-brand-primary/50 focus:ring-brand-primary/30"
                    }`}
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-text-dim hover:text-white transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
            >
                {showPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                ) : (
                    <FiEye className="h-5 w-5" />
                )}
            </button>
        </div >
    );
};

export const AuthPage: React.FC = () => {
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    const [fieldErrors, setFieldErrors] = useState<{
        email?: string;
        password?: string;
        inviteCode?: string;
    }>({});
    const [touched, setTouched] = useState<{
        email?: boolean;
        password?: boolean;
        inviteCode?: boolean;
    }>({});

    const { login, register, error, clearError } = useAuthContext();

    const validateEmail = (value: string): string | undefined => {
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email format";
        return undefined;
    };

    const validatePassword = (value: string): string | undefined => {
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        return undefined;
    };

    const validateInviteCode = (value: string): string | undefined => {
        if (mode === "register" && !value) return "Invite code is required";
        return undefined;
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (touched.email) {
            setFieldErrors(prev => ({ ...prev, email: validateEmail(value) }));
        }
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        if (touched.password) {
            setFieldErrors(prev => ({ ...prev, password: validatePassword(value) }));
        }
    };

    const handleInviteCodeChange = (value: string) => {
        setInviteCode(value);
        if (touched.inviteCode) {
            setFieldErrors(prev => ({ ...prev, inviteCode: validateInviteCode(value) }));
        }
    };

    const handleBlur = (field: "email" | "password" | "inviteCode") => {
        setTouched(prev => ({ ...prev, [field]: true }));
        if (field === "email") setFieldErrors(prev => ({ ...prev, email: validateEmail(email) }));
        if (field === "password") setFieldErrors(prev => ({ ...prev, password: validatePassword(password) }));
        if (field === "inviteCode") setFieldErrors(prev => ({ ...prev, inviteCode: validateInviteCode(inviteCode) }));
    };

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();

            const emailError = validateEmail(email);
            const passwordError = validatePassword(password);
            const inviteCodeError = mode === "register" ? validateInviteCode(inviteCode) : undefined;

            setFieldErrors({ email: emailError, password: passwordError, inviteCode: inviteCodeError });
            setTouched({ email: true, password: true, inviteCode: true });

            if (emailError || passwordError || (mode === "register" && inviteCodeError)) {
                return;
            }

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
        setFieldErrors({});
        setTouched({});
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { clientX, clientY } = e;
        setMousePosition({ x: clientX, y: clientY });
    };

    return (
        <div
            className="min-h-screen bg-brand-bg flex items-center justify-center p-4 py-8"
            onMouseMove={handleMouseMove}
        >
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 animate-gradient-slow bg-gradient-radial will-change-[background-position]" />
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-primary/20 rounded-full blur-[120px] animate-float-slow will-change-transform" />
                <div className="hidden sm:block absolute bottom-0 right-1/4 w-80 h-80 bg-brand-secondary/15 rounded-full blur-[100px] animate-float-reverse will-change-transform" />
                <div className="hidden md:block absolute top-1/2 left-1/2 w-72 h-72 bg-brand-primary/12 rounded-full blur-[100px] animate-float-medium will-change-transform" />
                <div
                    className="hidden md:block absolute w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[150px] pointer-events-none transition-all duration-500 ease-out will-change-[left,top]"
                    style={{
                        left: `${mousePosition.x}px`,
                        top: `${mousePosition.y}px`,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
                <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />
            </div>

            {/* Auth Card */}
            <div className="relative w-full max-w-md">
                {/* Cinema Card */}
                <div className="backdrop-blur-md bg-brand-surface/80 border border-brand-primary/10 rounded-2xl p-8 shadow-2xl shadow-black/50">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <h1 className="font-display text-5xl tracking-wide text-white">
                            SCENE<span className="text-brand-primary">STACK</span>
                        </h1>
                        <p className="text-brand-text-dim mt-2 text-sm tracking-wider uppercase">Tracking the shows you'll definitely finish… eventually… probably not.</p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex bg-black/40 rounded-lg p-1 mb-6">
                        <button
                            onClick={() => { setMode("login"); clearError(); }}
                            className={`flex-1 py-2.5 rounded-md text-sm font-medium tracking-wide transition-all duration-300 ${mode === "login"
                                ? "bg-brand-primary text-brand-bg shadow-lg shadow-brand-primary/20"
                                : "text-brand-text-dim hover:text-white"
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { setMode("register"); clearError(); }}
                            className={`flex-1 py-2.5 rounded-md text-sm font-medium tracking-wide transition-all duration-300 ${mode === "register"
                                ? "bg-brand-primary text-brand-bg shadow-lg shadow-brand-primary/20"
                                : "text-brand-text-dim hover:text-white"
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-2 animate-shake">
                            <FiAlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
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
                                onChange={(e) => handleEmailChange(e.target.value)}
                                onBlur={() => handleBlur("email")}
                                className={`w-full px-4 py-3 bg-black/40 border rounded-lg text-white placeholder:text-brand-text-muted focus:outline-none focus:ring-1 transition-all ${fieldErrors.email && touched.email
                                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
                                    : "border-white/5 focus:border-brand-primary/50 focus:ring-brand-primary/30"
                                    }`}
                            />
                            {fieldErrors.email && touched.email && (
                                <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm text-brand-text-dim mb-2">
                                Password
                            </label>
                            <PasswordInput
                                id="password"
                                value={password}
                                onChange={handlePasswordChange}
                                onBlur={() => handleBlur("password")}
                                hasError={!!(fieldErrors.password && touched.password)}
                            />
                            {fieldErrors.password && touched.password && (
                                <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>
                            )}
                        </div>

                        {mode === "register" && (
                            <div className="animate-slideDown space-y-3">
                                <div>
                                    <label htmlFor="inviteCode" className="block text-sm text-brand-text-dim mb-2">
                                        Invite Code
                                    </label>
                                    <input
                                        id="inviteCode"
                                        type="text"
                                        value={inviteCode}
                                        onChange={(e) => handleInviteCodeChange(e.target.value)}
                                        onBlur={() => handleBlur("inviteCode")}
                                        className={`w-full px-4 py-3 bg-black/40 border rounded-lg text-white placeholder:text-brand-text-muted focus:outline-none focus:ring-1 transition-all ${fieldErrors.inviteCode && touched.inviteCode
                                            ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
                                            : "border-white/5 focus:border-brand-primary/50 focus:ring-brand-primary/30"
                                            }`}
                                    />
                                    {fieldErrors.inviteCode && touched.inviteCode && (
                                        <p className="text-red-400 text-xs mt-1">{fieldErrors.inviteCode}</p>
                                    )}
                                </div>

                                {/* Invite code explanation */}
                                <p className="text-xs text-brand-text-muted">
                                    SceneStack is a personal project. Invite codes keep this instance private.
                                </p>

                                {/* Demo hint */}
                                <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-lg p-3">
                                    <p className="text-sm text-brand-primary">
                                        <span className="font-medium">Want to try it out?</span>{" "}
                                        Use demo code: <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono text-xs">DEMONOW</code>
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 mt-6 bg-brand-primary text-brand-bg font-semibold rounded-lg shadow-lg shadow-brand-primary/25 hover:bg-brand-secondary hover:shadow-brand-secondary/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <FiLoader className="animate-spin h-5 w-5" />
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
                                <button onClick={toggleMode} className="text-brand-primary hover:text-brand-secondary transition-colors font-medium">
                                    Sign up
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{" "}
                                <button onClick={toggleMode} className="text-brand-primary hover:text-brand-secondary transition-colors font-medium">
                                    Sign in
                                </button>
                            </>
                        )}
                    </p>
                </div>

                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[102%] h-[102%] bg-linear-to-b from-brand-primary/20 via-transparent to-transparent rounded-2xl blur-sm" />
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
          from { 
            opacity: 0; 
            transform: translate3d(0, -10px, 0);
          }
          to { 
            opacity: 1; 
            transform: translate3d(0, 0, 0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
          will-change: transform, opacity;
        }
        

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .bg-gradient-radial {
          background: radial-gradient(
            ellipse at 30% 20%, 
            rgba(212, 168, 85, 0.15) 0%, 
            rgba(10, 10, 11, 1) 35%,
            rgba(5, 5, 6, 1) 100%
          );
          background-size: 200% 200%;
        }
        .animate-gradient-slow {
          animation: gradientShift 20s ease infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 30px) scale(0.95); }
          66% { transform: translate(20px, -20px) scale(1.05); }
        }
        @keyframes floatMedium {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) translate(40px, 40px) scale(1.1); }
        }
        .animate-float-slow {
          animation: float 25s ease-in-out infinite;
        }
        .animate-float-reverse {
          animation: floatReverse 30s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: floatMedium 20s ease-in-out infinite;
        }
        
        @media (max-width: 768px) {
          .animate-float-slow {
            animation-duration: 15s;
          }
          .animate-gradient-slow {
            animation-duration: 12s;
          }
        }
      `}</style>
        </div>
    );
};
