import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { PageLoader, RouteErrorFallback } from "./components/common/Feedback";

const RootLayout = lazy(() => import("./layouts/RootLayout"));
const DiscoverPage = lazy(() =>
  import("./pages/DiscoverPage").then((m) => ({ default: m.DiscoverPage }))
);
const ListsPage = lazy(() => import("./pages/ListsPage").then((m) => ({ default: m.ListsPage })));
const RecommendationsPage = lazy(() =>
  import("./pages/RecommendationsPage").then((m) => ({ default: m.RecommendationsPage }))
);
const StatisticsPage = lazy(() =>
  import("./pages/StatisticsPage").then((m) => ({ default: m.StatisticsPage }))
);
const ViewAllPage = lazy(() =>
  import("./pages/ViewAllPage").then((m) => ({ default: m.ViewAllPage }))
);
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage"));

const withSuspense = (Component: React.LazyExoticComponent<React.ComponentType>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: withSuspense(RootLayout),
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, element: withSuspense(DiscoverPage) },
      { path: "discover", element: withSuspense(DiscoverPage) },
      { path: "lists", element: withSuspense(ListsPage) },
      { path: "lists/:status", element: withSuspense(ViewAllPage) },
      { path: "recommendations", element: withSuspense(RecommendationsPage) },
      { path: "stats", element: withSuspense(StatisticsPage) },
      { path: "search", element: withSuspense(SearchResultsPage) },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
