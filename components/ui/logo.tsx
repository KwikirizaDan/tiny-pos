import { cn } from "@/lib/utils";

export function Logo({
  width = 32,
  height = 32,
  id = "logo",
  className,
}: {
  width?: number;
  height?: number;
  id?: string;
  className?: string;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block shrink-0", className)}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={`${id}-check`} x1="0" y1="0" x2="12" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="40" height="40" rx="10" fill={`url(#${id}-bg)`} />

      {/* Receipt body */}
      <rect x="9" y="7" width="18" height="23" rx="2" fill="white" fillOpacity="0.97" />

      {/* Receipt tear line */}
      <rect x="9" y="25" width="18" height="1" fill={`url(#${id}-bg)`} fillOpacity="0.12" />

      {/* Item lines */}
      <rect x="12" y="11" width="9" height="1.5" rx="0.75" fill={`url(#${id}-bg)`} fillOpacity="0.5" />
      <rect x="12" y="15" width="12" height="1.5" rx="0.75" fill={`url(#${id}-bg)`} fillOpacity="0.5" />
      <rect x="12" y="19" width="7" height="1.5" rx="0.75" fill={`url(#${id}-bg)`} fillOpacity="0.5" />

      {/* Price line */}
      <rect x="12" y="23" width="12" height="1.5" rx="0.75" fill={`url(#${id}-bg)`} fillOpacity="0.9" />

      {/* Success checkmark badge */}
      <circle cx="29" cy="29" r="8" fill={`url(#${id}-bg)`} />
      <circle cx="29" cy="29" r="7" fill={`url(#${id}-check)`} />
      <path
        d="M25.5 29.2L28 31.7L32.5 26.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
