'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedOverlayProps {
  open: boolean;
  children: React.ReactNode;
  className?: string;
  origin?: 'top-right' | 'top-left' | 'bottom';
}

const originMap = {
  'top-right': 'top right',
  'top-left': 'top left',
  'bottom': 'bottom center',
};

export function AnimatedOverlay({ open, children, className, origin = 'top-right' }: AnimatedOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -4 }}
          transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ transformOrigin: originMap[origin] }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
