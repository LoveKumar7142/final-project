import React from "react";
import ReactDOM from "react-dom/client";
import router from "./routes";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import { ReactLenis } from "lenis/react";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Cache data as fresh for 5 minutes (prevents refetching)
      gcTime: 1000 * 60 * 30, // Keep abandoned data in memory for 30 minutes
      refetchOnWindowFocus: false, // Don't refetch automatically on tab switch
      refetchOnMount: false, // Don't refetch on component remount if not stale
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ReactLenis root options={{ lerp: 0.08, duration: 1.5, smoothWheel: true, syncTouch: true }}>
            <RouterProvider router={router} />
          </ReactLenis>
          <Toaster position="top-right" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
