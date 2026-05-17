import { cn } from "../../lib/utils";
import { motion, HTMLMotionProps } from "motion/react";
import React from "react";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  ...props 
}: ButtonProps) {
  const variants = {
    primary: 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]',
    secondary: 'bg-white/10 text-white border border-white/10 hover:bg-white/20',
    outline: 'border border-white/10 text-white/60 hover:text-white hover:bg-white/5',
    ghost: 'text-white/40 hover:text-white hover:bg-white/5'
  };

  const sizes = {
    sm: 'px-4 py-2 text-[10px] font-bold uppercase tracking-widest',
    md: 'px-6 py-2.5 text-xs font-semibold uppercase tracking-widest',
    lg: 'px-8 py-3 text-sm font-bold uppercase tracking-widest'
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "rounded-xl font-medium transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
