import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "TinyPOS",
  description: "Uganda's simplest point of sale by Binary Labs",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TinyPOS",
  },
};

export const viewport: Viewport = {
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
        <ClerkProvider>
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
