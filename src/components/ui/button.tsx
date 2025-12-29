import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      primary: 'bg-gradient-primary text-white hover:opacity-90 focus:ring-emerald-500 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all',
      secondary: 'glass text-white hover:bg-neutral-800/50 focus:ring-neutral-500 border border-neutral-700/50',
      outline: 'border border-neutral-600/50 text-neutral-300 hover:bg-neutral-800/50 hover:border-emerald-500/50 focus:ring-emerald-500/50 transition-all',
      ghost: 'text-neutral-300 hover:bg-neutral-800/30 hover:text-emerald-400 focus:ring-emerald-500/50 transition-all',
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };
    
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
