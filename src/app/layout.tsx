import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { AppShell } from "@/features/common/app-shell";

export const metadata: Metadata = {
  title: "班主任留痕",
  description: "纯本地离线班主任工作留痕工具",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "班主任留痕",
  },
};

export const viewport: Viewport = {
  themeColor: "#007AFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
