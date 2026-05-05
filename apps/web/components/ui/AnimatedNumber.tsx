"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  currency?: string;
  compact?: boolean;
  className?: string;
}

export function AnimatedNumber({ value, currency = "INR", compact = false, className = "" }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      let startTimestamp: number;
      const duration = 800; // 800ms ease-out

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Ease out quint
        const easeProgress = 1 - Math.pow(1 - progress, 5);
        
        setDisplayValue(value * easeProgress);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setDisplayValue(value);
        }
      };
      
      requestAnimationFrame(step);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  return (
    <span className={`tabular-nums ${className}`}>
      {formatCurrency(displayValue, currency, compact)}
    </span>
  );
}
