import { cn } from "../../utils/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" && "px-4 py-2 text-sm",
        size === "md" && "px-5 py-3 text-sm",
        size === "lg" && "px-6 py-3.5 text-base",
        variant === "primary" &&
          "bg-[var(--accent)] text-[var(--bg)] shadow-lg shadow-black/10 hover:-translate-y-0.5 hover:opacity-95",
        variant === "secondary" &&
          "panel text-[var(--text)] hover:-translate-y-0.5 hover:bg-[var(--bg-soft)]",
        variant === "ghost" && "text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/5",
        className,
      )}
      {...props}
    />
  );
}

