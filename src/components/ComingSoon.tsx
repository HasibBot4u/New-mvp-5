import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NexusLogo } from './shared/NexusLogo';

interface ComingSoonProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ title, description, icon }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-surface-card rounded-2xl shadow-md border border-border-light p-8 text-center"
      >
        <div className="flex justify-center mb-8">
          <NexusLogo withSubtitle={false} />
        </div>

        <div className="w-20 h-20 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
          {icon}
        </div>

        <div className="inline-block bg-accent-light text-accent border border-amber-200 px-3 py-1 rounded-full text-sm font-bold bangla mb-4">
          শীঘ্রই আসছে
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-3 bangla">{title}</h1>
        <p className="text-text-secondary bangla mb-8 leading-relaxed">
          {description}
        </p>

        <form className="mb-8" onSubmit={(e) => e.preventDefault()}>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="আপনার ইমেইল দিন" 
              className="flex-1 px-4 py-2 rounded-lg border border-border-light focus:outline-none focus:ring-2 focus:ring-primary bangla"
            />
            <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-hover transition-colors bangla whitespace-nowrap">
              জানিয়ে দিন
            </button>
          </div>
        </form>

        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center w-full gap-2 text-text-secondary hover:text-primary transition-colors bangla font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          ড্যাশবোর্ডে ফিরে যান
        </button>
      </motion.div>
    </div>
  );
};
