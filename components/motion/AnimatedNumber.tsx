'use client';

import { useEffect, useState } from 'react';
import { useSpring, useMotionValue } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  className?: string;
}

export function AnimatedNumber({ value, format, className }: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 100, damping: 20 });
  const [display, setDisplay] = useState(format ? format(0) : '0');

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplay(format ? format(Math.round(latest)) : String(Math.round(latest)));
    });
    return unsubscribe;
  }, [spring, format]);

  return <span className={className}>{display}</span>;
}
