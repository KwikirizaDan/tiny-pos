

export const runtime = "edge";

const sizes: Record<string, number> = {
  "192": 192,
  "512": 512,
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size } = await params;
  const dimension = sizes[size] || 192;
  
  const svg = `
    <svg width="${dimension}" height="${dimension}" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#7c3aed"/>
          <stop offset="100%" stop-color="#5b21b6"/>
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="8" fill="url(#grad)"/>
      <rect x="8" y="8" width="24" height="18" rx="2" fill="white" fill-opacity="0.9"/>
      <rect x="11" y="11" width="18" height="12" rx="1" fill="url(#grad)"/>
      <rect x="15" y="29" width="10" height="3" rx="1" fill="white" fill-opacity="0.7"/>
      <rect x="12" y="32" width="16" height="2" rx="1" fill="white" fill-opacity="0.5"/>
    </svg>
  `;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000",
    },
  });
}