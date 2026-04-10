import { cn } from "../../utils/cn";

export default function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("panel rounded-[28px] p-5", className)}>{children}</div>;
}

