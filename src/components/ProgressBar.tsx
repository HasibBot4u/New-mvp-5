import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  label?: string;
  color?: string;
  showPercent?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  label, 
  color = 'bg-primary',
  showPercent = true 
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-end mb-1.5">
          {label && <span className="text-sm font-medium text-text-secondary bangla">{label}</span>}
          {showPercent && <span className="text-xs font-bold text-text-primary">{Math.round(clampedProgress)}%</span>}
        </div>
      )}
      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
};
