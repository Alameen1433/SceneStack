import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
    type ReactNode,
} from "react";

// API requests use relative URLs - Vite proxy handles forwarding in dev
const API_BASE_URL = '';

interface User {
    id: string;
    email: string;
    isDemo?: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<boolean>;
    register: (email: string, password: string, inviteCode: string) => Promise<boolean>;
    logout: () => void;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "scenestack_token";
const USER_KEY = "scenestack_user";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem(USER_KEY);
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState<string | null>(() => {
        return localStorage.getItem(TOKEN_KEY);
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isAuthenticated = !!token && !!user;

    // Verify token on mount
    useEffect(() => {
        const verifyToken = async () => {
            const savedToken = localStorage.getItem(TOKEN_KEY);
            if (!savedToken) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${savedToken}` },
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                    setToken(savedToken);
                } else {
                    // Token invalid, clear storage
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem(USER_KEY);
                    setUser(null);
                    setToken(null);
                }
            } catch (err) {
                console.error("Token verification failed:", err);
            } finally {
                setIsLoading(false);
            }
        };

        verifyToken();
    }, []);

    const login = useCallback(async (email: string, password: string): Promise<boolean> => {
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem(TOKEN_KEY, data.token);
                localStorage.setItem(USER_KEY, JSON.stringify(data.user));
                setToken(data.token);
                setUser(data.user);
                return true;
            } else {
                setError(data.message || "Login failed");
                return false;
            }
        } catch {
            setError("Network error. Please try again.");
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(
        async (email: string, password: string, inviteCode: string): Promise<boolean> => {
            setError(null);
            setIsLoading(true);

            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password, inviteCode }),
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem(TOKEN_KEY, data.token);
                    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
                    setToken(data.token);
                    setUser(data.user);
                    return true;
                } else {
                    setError(data.message || "Registration failed");
                    return false;
                }
            } catch {
                setError("Network error. Please try again.");
                return false;
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value = useMemo(
        () => ({
            user,
            token,
            isAuthenticated,
            isLoading,
            error,
            login,
            register,
            logout,
            clearError,
        }),
        [user, token, isAuthenticated, isLoading, error, login, register, logout, clearError]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuthContext = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
};

// eslint-disable-next-line react-refresh/only-export-components
export const getAuthToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};
