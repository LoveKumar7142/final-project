import { cn } from "../../utils/cn";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  colorClass?: string;
}

export default function Loader({ size = "md", className, colorClass = "border-t-current" }: LoaderProps) {
  return (
    <div
      className={cn(
        "inline-block animate-[spin_0.8s_linear_infinite] rounded-full border-2 border-solid border-transparent",
        colorClass,
        size === "sm" && "h-4 w-4 border-2",
        size === "md" && "h-8 w-8 border-[3px]",
        size === "lg" && "h-12 w-12 border-[3px]",
        className
      )}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
