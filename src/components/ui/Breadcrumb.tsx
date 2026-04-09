import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-4 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            {isLast || !item.href ? (
              <span className="font-medium text-gray-900 truncate max-w-[150px] sm:max-w-none" title={item.label}>
                {item.label}
              </span>
            ) : (
              <Link 
                to={item.href} 
                className="hover:text-primary transition-colors truncate max-w-[100px] sm:max-w-none"
                title={item.label}
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
