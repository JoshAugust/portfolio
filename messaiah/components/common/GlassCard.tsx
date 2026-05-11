import React from 'react';
import { twMerge } from 'tailwind-merge';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<"div"> {
    gradient?: 'none' | 'indigo' | 'amber' | 'emerald' | 'pink' | 'cyan';
    interactive?: boolean;
}

export const GlassCard = ({
    children,
    className,
    gradient = 'none',
    interactive = false,
    ...props
}: GlassCardProps) => {
    const gradients = {
        none: "bg-slate-900/50 border-slate-700/50",
        indigo: "bg-gradient-to-br from-indigo-900/20 to-slate-900/80 border-indigo-500/30",
        amber: "bg-gradient-to-br from-amber-900/20 to-slate-900/80 border-amber-500/30",
        emerald: "bg-gradient-to-br from-emerald-900/20 to-slate-900/80 border-emerald-500/30",
        pink: "bg-gradient-to-br from-pink-900/20 to-slate-900/80 border-pink-500/30",
        cyan: "bg-gradient-to-br from-cyan-900/20 to-slate-900/80 border-cyan-500/30",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={twMerge(
                "relative backdrop-blur-md rounded-xl border shadow-lg overflow-hidden",
                gradients[gradient],
                interactive && "hover:border-slate-500/70 hover:shadow-xl transition-all duration-300 cursor-pointer",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
};
