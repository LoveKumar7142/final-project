import { cn } from "../../utils/cn";

export default function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition focus:border-transparent focus:ring-2 focus:ring-amber-400/70",
        props.className,
      )}
    />
  );
}

