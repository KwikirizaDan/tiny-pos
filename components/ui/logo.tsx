export function Logo({ width = 32, height = 32, id = "logo" }: { width?: number; height?: number; id?: string }) {
  return (
    <svg width={width} height={height} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="8" fill={`url(#${id}-grad)`} />
      <rect x="8" y="8" width="24" height="18" rx="2" fill="white" fillOpacity="0.9" />
      <rect x="11" y="11" width="18" height="12" rx="1" fill={`url(#${id}-grad)`} />
      <rect x="15" y="29" width="10" height="3" rx="1" fill="white" fillOpacity="0.7" />
      <rect x="12" y="32" width="16" height="2" rx="1" fill="white" fillOpacity="0.5" />
    </svg>
  );
}
