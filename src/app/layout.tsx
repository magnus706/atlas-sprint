import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ProgressProvider } from "@/lib/store";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Atlas Sprint — master the world",
  description: "A fast, joyful geography game. Countries, capitals, flags, shapes — one more round?",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFF6EB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Nunito:wght@500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ProgressProvider>
          <main className="mx-auto min-h-dvh max-w-md">{children}</main>
          <BottomNav />
        </ProgressProvider>
      </body>
    </html>
  );
}
