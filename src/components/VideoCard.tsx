import React from 'react';
import { PlayCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface VideoCardProps {
  title: string;
  duration?: string;
  subjectColor?: string;
  isWatched?: boolean;
  progress?: number;
  onClick: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  title,
  duration,
  subjectColor = 'bg-primary',
  isWatched,
  progress = 0,
  onClick
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group cursor-pointer bg-surface-card rounded-xl shadow-sm border border-border-light overflow-hidden flex flex-col h-full transition-all hover:shadow-md"
    >
      {/* Thumbnail Area */}
      <div className={`relative aspect-video ${subjectColor} flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        <PlayCircle className="w-12 h-12 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
        
        {duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md font-medium">
            {duration}
          </div>
        )}

        {isWatched && (
          <div className="absolute top-2 right-2 bg-success text-white rounded-full p-1 shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Progress Bar (if started but not finished) */}
      {progress > 0 && !isWatched && (
        <div className="h-1 w-full bg-gray-200">
          <div 
            className="h-full bg-primary transition-all duration-500" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-sm font-semibold text-text-primary line-clamp-2 bangla group-hover:text-primary transition-colors">
          {title}
        </h3>
      </div>
    </motion.div>
  );
};
