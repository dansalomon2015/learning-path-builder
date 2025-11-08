interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-10 w-10',
};

export function Logo({ size = 'md', className = '' }: LogoProps): JSX.Element {
  const sizeClass = sizeMap[size];
  // Use icon-512.png for larger sizes, icon-192.png for smaller
  const logoSrc = size === 'xl' ? '/icon-512.png' : '/icon-192.png';
  return (
    <img src={logoSrc} alt="FlashLearn AI Logo" className={`${sizeClass} ${className}`.trim()} />
  );
}
