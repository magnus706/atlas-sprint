import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ProgressProvider } from "@/lib/store";
import BottomNav from "@/components/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";

// Next does not auto-prefix metadata icon/manifest URLs with basePath, so do it here.
const bp = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "Globli — master the world",
  description: "A fast, joyful geography game. Countries, capitals, flags, shapes — one more round?",
  applicationName: "Globli",
  icons: {
    icon: [
      { url: `${bp}/favicon.png`, type: "image/png" },
      { url: `${bp}/icon-192.png`, sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: `${bp}/apple-icon.png`, sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Globli",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#00B2A9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* manual manifest link — Next normalizes the metadata `manifest` field
            and strips the base path, which breaks it under GitHub Pages */}
        <link rel="manifest" href={`${bp}/manifest.webmanifest`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ProgressProvider>
          <main className="mx-auto min-h-dvh max-w-md">{children}</main>
          <BottomNav />
          <InstallPrompt />
        </ProgressProvider>
      </body>
    </html>
  );
}
