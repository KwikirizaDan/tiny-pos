import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "TinyPOS",
  description: "Uganda's simplest point of sale by Binary Labs",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TinyPOS",
  },
};

export const viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans")}>
      <body suppressHydrationWarning>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(
                      function(registration) { console.log('ServiceWorker registration successful'); },
                      function(err) { console.log('ServiceWorker registration failed: ', err); }
                    );
                  });
                }

                // Ensure theme follows system preference by default
                const stored = localStorage.getItem('theme');
                if (stored === 'dark') {
                  document.documentElement.classList.add('dark');
                } else if (stored === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  document.documentElement.classList.toggle('dark', prefersDark);
                }
              `,
            }}
          />
          <div className="min-h-screen">
            {children}
          </div>

          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              style: {
                fontFamily: "'JetBrains Mono', monospace",
                borderRadius: "0",
                fontSize: "13px",
              },
            }}
          />
      </body>
    </html>
  );
}