import { motion, AnimatePresence } from "framer-motion";

interface AppLoaderProps {
  isLoading: boolean;
  message?: string;
}

export default function AppLoader({ isLoading, message = "Loading..." }: AppLoaderProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--bg)]/40 backdrop-blur-md"
        >
          {/* Outer ring / Semicircle spinner base */}
          <div className="relative flex h-20 w-20 items-center justify-center">
            {/* The spinning semicircle */}
            <motion.div
              className="absolute inset-0 rounded-full border-[3px] border-[var(--border)] border-t-[var(--accent)]"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
            {/* Inner dot (optional detail) */}
            <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          </div>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 font-medium tracking-widest text-[var(--text)] uppercase text-xs"
          >
            {message}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
