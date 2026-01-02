import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy } from "react";

const RootLayout = lazy(() => import("./layouts/RootLayout"));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage").then(m => ({ default: m.DiscoverPage })));
const ListsPage = lazy(() => import("./pages/ListsPage").then(m => ({ default: m.ListsPage })));
const RecommendationsPage = lazy(() => import("./pages/RecommendationsPage").then(m => ({ default: m.RecommendationsPage })));
const StatisticsPage = lazy(() => import("./pages/StatisticsPage").then(m => ({ default: m.StatisticsPage })));
const ViewAllPage = lazy(() => import("./pages/ViewAllPage").then(m => ({ default: m.ViewAllPage })));
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage"));

export const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        children: [
            { index: true, element: <DiscoverPage /> },
            { path: "discover", element: <DiscoverPage /> },
            { path: "lists", element: <ListsPage /> },
            { path: "lists/:status", element: <ViewAllPage /> },
            { path: "recommendations", element: <RecommendationsPage /> },
            { path: "stats", element: <StatisticsPage /> },
            { path: "search", element: <SearchResultsPage /> },
            { path: "*", element: <Navigate to="/" replace /> },
        ],
    },
]);
