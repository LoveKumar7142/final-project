import React from "react";
import ReactDOM from "react-dom/client";
import router from "./routes";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { Toaster, toast } from "react-hot-toast";


const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      // Axios interceptor may already toast 500s, let's catch logical queries that fail here
      console.error(`Query Failed: ${error.message}`);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      // Gracefully catch mutation failures system-wide 
      toast.error(error.response?.data?.message || error.message || "Failed to update data.");
    },
  }),
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
          <RouterProvider router={router} />
          <Toaster position="top-right" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
