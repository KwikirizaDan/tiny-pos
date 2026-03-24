import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "TinyPOS",
  description: "Uganda's simplest point of sale by Binary Labs",
  manifest: "/manifest.json",
  themeColor: "#7c3aed",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TinyPOS",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClerkProvider>
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