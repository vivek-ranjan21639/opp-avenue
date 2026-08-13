import React from 'react';

interface AdUnitProps {
  size: 'banner' | 'rectangle' | 'sidebar' | 'mobile-banner';
  className?: string;
  label?: string;
  hasAd?: boolean; // Set to false to hide empty ad slots
}

const AdUnit: React.FC<AdUnitProps> = ({ size, className = '', label, hasAd = false }) => {
  // Don't render anything if there's no ad
  if (!hasAd) {
    return null;
  }

  const sizeClasses = {
    'banner': 'w-full h-24 md:h-32', // Top banner 728x90 or 970x250
    'rectangle': 'w-full h-40', // Medium rectangle 300x250
    'sidebar': 'w-full h-96', // Sidebar 160x600
    'mobile-banner': 'w-full h-20' // Mobile banner 320x50
  };

  return (
    <div className={`${sizeClasses[size]} ${className} bg-muted/30 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center`}>
      <div className="text-center text-muted-foreground">
        <div className="text-sm font-medium">Advertisement Space</div>
        {label && <div className="text-xs mt-1">{label}</div>}
        <div className="text-xs mt-1 opacity-60">
          {size === 'banner' && '728x90 / 970x250'}
          {size === 'rectangle' && '300x250'}
          {size === 'sidebar' && '160x600'}
          {size === 'mobile-banner' && '320x50'}
        </div>
      </div>
    </div>
  );
};

export default AdUnit;