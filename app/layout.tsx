import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";
import { clerkLocalization, clerkAppearance } from "@/lib/clerk";
import { dark } from "@clerk/ui/themes";
import { ui } from '@clerk/ui'

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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
   <ClerkProvider localization={clerkLocalization}  appearance={{
     theme: dark,
   }}
 >
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

                // Ensure dark mode is applied based on preference or system
                const isDark = localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              `,
            }}
          />
          {children}

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
        </ClerkProvider>
      </body>
    </html>
  );
}
