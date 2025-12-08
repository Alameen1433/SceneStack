import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReload = (): void => {
        window.location.reload();
    };

    handleReset = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
                    <div className="max-w-md w-full text-center">
                        {/* Error Icon */}
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-10 w-10 text-red-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        {/* Error Message */}
                        <h1 className="text-2xl font-bold text-white mb-2">
                            Something went wrong
                        </h1>
                        <p className="text-brand-text-dim mb-6">
                            An unexpected error occurred. Don't worry, your data is safe.
                        </p>

                        {/* Error Details (collapsed) */}
                        {this.state.error && (
                            <details className="mb-6 text-left bg-white/5 rounded-xl p-4">
                                <summary className="text-sm text-brand-text-dim cursor-pointer hover:text-white transition-colors">
                                    Technical details
                                </summary>
                                <pre className="mt-3 text-xs text-red-400 overflow-x-auto whitespace-pre-wrap break-words">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-3 rounded-xl font-semibold transition-all bg-white/10 hover:bg-white/20 text-white"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="px-6 py-3 rounded-xl font-semibold transition-all bg-brand-primary hover:bg-brand-secondary text-white"
                            >
                                Reload App
                            </button>
                        </div>

                        {/* Branding */}
                        <p className="mt-8 text-sm text-brand-text-dim">
                            Scene<span className="text-brand-secondary">Stack</span>
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
