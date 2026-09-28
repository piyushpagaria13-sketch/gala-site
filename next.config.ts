import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["googleapis", "pdf-lib", "@pdf-lib/fontkit"],
  outputFileTracingIncludes: {
    "/*": [
      "./public/ticket-base.jpg",
      "./public/ticket-base.png",
      "./public/fonts/PlayfairDisplay.ttf",
      "./public/fonts/PlayfairDisplay-SemiBold.ttf",
    ],
  },
};

export default nextConfig;
