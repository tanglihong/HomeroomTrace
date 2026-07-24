import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  // 关闭 dynamic start-url 插件，避免 SW 中 _async_to_generator 未注入导致报错
  dynamicStartUrl: false,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: { cacheName: "google-fonts", expiration: { maxEntries: 4, maxAgeSeconds: 365 * 24 * 60 * 60 } },
      },
      {
        urlPattern: /\.(?:js|css|woff2?)$/i,
        handler: "StaleWhileRevalidate",
        options: { cacheName: "static-assets" },
      },
      {
        urlPattern: ({ request }) => request.mode === "navigate",
        handler: "NetworkFirst",
        options: { cacheName: "pages", networkTimeoutSeconds: 5 },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export', 
  distDir: 'out',
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);
