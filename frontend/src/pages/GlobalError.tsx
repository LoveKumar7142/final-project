import { useRouteError, isRouteErrorResponse } from "react-router-dom";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import { motion } from "framer-motion";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function GlobalError() {
  const error = useRouteError();
  
  let errorMessage = "An unexpected application error occurred.";
  let statusCode = 500;

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    errorMessage = error.statusText || error.data?.message || "Invalid route.";
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="max-w-xl w-full rounded-[36px] bg-[var(--bg-soft)] p-8 sm:p-12 text-center shadow-none border-[var(--border)] overflow-hidden relative">
          
          <motion.div 
            className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-red-500/10 blur-[80px]"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 5, repeat: Infinity }}
          />

          <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-red-500/10 border border-red-500/20">
            <FiAlertTriangle className="text-5xl text-red-500 drop-shadow-md" />
          </div>
          
          <h1 className="mt-8 text-3xl font-bold tracking-tight">System Interruption</h1>
          <p className="mt-4 text-[var(--muted)] text-base mx-auto max-w-sm">
            We encountered an unexpected issue while processing your request. Don't worry, these things happen.
          </p>
          
          <motion.div 
            className="mt-8 rounded-[24px] border border-red-500/20 bg-red-500/5 p-5 text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-sm font-semibold text-red-500 dark:text-red-400">Error Details</p>
            <p className="mt-2 font-mono text-xs text-[var(--muted)] break-all">Status Code: {statusCode}</p>
            <p className="mt-1 font-mono text-xs text-[var(--muted)] break-all">{errorMessage}</p>
          </motion.div>

          <div className="mt-10">
            <Button size="lg" className="rounded-full px-8 py-4" onClick={() => window.location.href = "/"}>
              <FiRefreshCw className="mr-3" /> Restart Application
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
