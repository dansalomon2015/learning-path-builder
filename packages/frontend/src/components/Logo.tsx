interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-15 w-15',
  lg: 'h-20 w-20',
  xl: 'h-30 w-30',
};

export function Logo({ size = 'md', className = '' }: LogoProps): JSX.Element {
  const sizeClass = sizeMap[size];
  // Use icon-512.png for larger sizes, icon-192.png for smaller
  // Use relative path from public folder (Vite handles this correctly)
  const logoSrc = size === 'xl' ? 'icon-512.png' : 'icon-192.png';
  return (
    <img 
      src={`/${logoSrc}`} 
      alt="FlashLearn AI Logo" 
      className={`${sizeClass} ${className}`.trim()} 
      onError={(e): void => {
        // Fallback to Cloudinary-hosted favicon if icons fail to load
        (e.target as HTMLImageElement).src = 'https://res.cloudinary.com/dpuietmcx/image/upload/v1762824312/favicon_xbonvi.ico';
      }}
    />
  );
}
