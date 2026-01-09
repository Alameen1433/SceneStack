import { useRouteError } from 'react-router-dom';

export const PageLoader = () => (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-brand-primary/20 border-t-brand-primary animate-spin" />
            <p className="text-brand-text-dim animate-pulse">Loading...</p>
        </div>
    </div>
);

export const RouteErrorFallback = () => {
    const error = useRouteError() as Error;
    const isChunkError = error?.message?.includes('dynamically imported module') ||
        error?.message?.includes('Loading chunk');

    const handleRetry = () => window.location.reload();

    return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
            <div className="bg-brand-surface rounded-2xl p-8 max-w-md text-center border border-brand-primary/10">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                    <span className="text-3xl">📡</span>
                </div>
                <h2 className="text-xl font-semibold text-brand-text-light mb-2">
                    {isChunkError ? "Connection Lost" : "Something went wrong"}
                </h2>
                <p className="text-brand-text-dim mb-6">
                    {isChunkError
                        ? "Unable to load this page. Please check your internet connection and try again."
                        : "An unexpected error occurred. Please try refreshing the page."}
                </p>
                <button
                    onClick={handleRetry}
                    className="px-6 py-3 bg-brand-primary text-white rounded-xl font-medium hover:bg-brand-primary/90 transition-colors"
                >
                    Retry
                </button>
            </div>
        </div>
    );
};
