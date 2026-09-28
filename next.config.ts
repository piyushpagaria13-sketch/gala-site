import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["googleapis", "pdf-lib", "@pdf-lib/fontkit", "pngjs"],
  outputFileTracingIncludes: {
    "/*": [
      "./public/ticket-base.png",
      "./public/uwcsea-logo.png",
      "./public/fonts/PlayfairDisplay.ttf",
      "./public/fonts/PlayfairDisplay-SemiBold.ttf",
      "./public/fonts/PlayfairDisplaySC-SemiBold.ttf",
    ],
  },
};

export default nextConfig;
