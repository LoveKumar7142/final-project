import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { cn } from "../../utils/cn";

export interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
}

export default function Card({
  children,
  className,
  ...props
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: false, amount: 0.05 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn("panel rounded-[28px] p-5", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

