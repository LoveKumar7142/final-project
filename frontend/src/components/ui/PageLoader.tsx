import Loader from "./Loader";
import { cn } from "../../utils/cn";

interface PageLoaderProps {
  className?: string;
  message?: string;
}

export default function PageLoader({ className, message = "Loading..." }: PageLoaderProps) {
  return (
    <div className={cn("flex min-h-[400px] flex-col items-center justify-center gap-4 text-[var(--muted)]", className)}>
      <Loader size="lg" className="text-[var(--accent)]" />
      {message && <p className="text-sm font-medium animate-pulse">{message}</p>}
    </div>
  );
}
