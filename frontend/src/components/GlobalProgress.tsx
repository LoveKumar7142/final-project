import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import AppLoader from "./ui/AppLoader";
import { cn } from "../utils/cn";

export default function GlobalProgress() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isGlobalLoading = isFetching > 0 || isMutating > 0;
  
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isGlobalLoading) {
      setVisible(true);
      interval = setInterval(() => {
        setProgress((old) => {
          if (old >= 90) return 90;
          return old + Math.random() * 10;
        });
      }, 300);
    } else {
      setProgress(100);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setProgress(0), 200);
      }, 400);
      return () => clearTimeout(timer);
    }

    return () => clearInterval(interval);
  }, [isGlobalLoading]);

  const [debouncedLoading, setDebouncedLoading] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (isGlobalLoading) {
      timer = setTimeout(() => {
        setDebouncedLoading(true);
      }, 150); // Show popup spinner only for requests taking >150ms
    } else {
      setDebouncedLoading(false);
    }

    return () => clearTimeout(timer);
  }, [isGlobalLoading]);

  return (
    <>
      <AppLoader isLoading={debouncedLoading} />
      <div
        className={cn(
          "fixed left-0 top-0 z-[10000] h-[3px] w-full bg-transparent transition-opacity duration-300 pointer-events-none",
          visible ? "opacity-100" : "opacity-0"
        )}
      >
        <div
          className="h-full bg-blue-500 shadow-[0_0_10px_2px_rgba(59,130,246,0.7)] dark:bg-amber-400 dark:shadow-[0_0_10px_2px_rgba(251,191,36,0.7)] transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </>
  );
}
