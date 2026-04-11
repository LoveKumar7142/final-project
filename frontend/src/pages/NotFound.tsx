import { Link } from "react-router-dom";
import { FiHome } from "react-icons/fi";
import { motion } from "framer-motion";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="max-w-xl w-full rounded-[36px] bg-[var(--bg-soft)] p-8 sm:p-12 text-center shadow-none border-[var(--border)] overflow-hidden relative">
          
          <motion.div 
            className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[var(--accent)]/10 blur-[60px]"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          <motion.h1 
            className="text-8xl md:text-9xl font-black text-[var(--accent)]/20 drop-shadow-md"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            404
          </motion.h1>
          
          <h2 className="mt-6 text-3xl font-bold tracking-tight">Are you lost?</h2>
          <p className="mt-4 text-[var(--muted)] text-base leading-relaxed max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
          
          <div className="mt-10 flex justify-center">
            <Link to="/">
              <Button size="lg" className="rounded-full px-8 py-4">
                <FiHome className="text-lg" /> Return Home
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
