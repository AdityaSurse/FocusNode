import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export function ThemeToggle({ theme, toggleTheme }: ThemeToggleProps) {
  return (
    <button
      onClick={toggleTheme}
      className="w-10 h-10 border border-border-subtle bg-surface rounded-xl flex items-center justify-center hover:bg-ink/5 transition-all text-ink/30 hover:text-ink relative overflow-hidden group"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{
          y: theme === 'dark' ? 0 : 40,
          opacity: theme === 'dark' ? 1 : 0
        }}
        className="absolute"
      >
        <Moon size={18} />
      </motion.div>
      <motion.div
        initial={false}
        animate={{
          y: theme === 'light' ? 0 : -40,
          opacity: theme === 'light' ? 1 : 0
        }}
        className="absolute"
      >
        <Sun size={18} />
      </motion.div>
    </button>
  );
}
