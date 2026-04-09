import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp }) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-surface-card rounded-xl p-5 shadow-sm border border-border-light flex items-start gap-4"
    >
      <div className="p-3 bg-primary-light text-primary rounded-xl">
        {icon}
      </div>
      <div>
        <p className="text-sm text-text-secondary font-medium bangla">{title}</p>
        <h4 className="text-2xl font-bold text-text-primary mt-1">{value}</h4>
        {trend && (
          <p className={`text-xs mt-1 font-medium bangla ${trendUp ? 'text-success' : 'text-error'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
    </motion.div>
  );
};
