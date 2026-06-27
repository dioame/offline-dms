import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import AppChrome from "@/components/AppChrome";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Offline DMS - FACED Survey",
  description:
    "DSWD Family Assistance Card (FACED) offline survey and data collection PWA",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Offline DMS",
  },
};

export const viewport: Viewport = {
  themeColor: "#0038A8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {process.env.NODE_ENV === "development" ? (
          <Script id="dev-sw-cleanup" strategy="beforeInteractive">
            {`(function () {
  if (typeof window === "undefined") return;
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (r) { r.unregister(); });
    });
  }
  if (window.caches) {
    caches.keys().then(function (keys) {
      keys.forEach(function (k) { caches.delete(k); });
    });
  }
  window.addEventListener("error", function (event) {
    var msg = event.message || "";
    if (msg.indexOf("ChunkLoadError") === -1) return;
    if (sessionStorage.getItem("__offline_dms_chunk_reload__")) return;
    sessionStorage.setItem("__offline_dms_chunk_reload__", "1");
    window.location.reload();
  });
  window.addEventListener("load", function () {
    sessionStorage.removeItem("__offline_dms_chunk_reload__");
  });
})();`}
          </Script>
        ) : null}
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
