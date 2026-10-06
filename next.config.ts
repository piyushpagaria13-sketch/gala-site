import type { NextConfig } from "next";

/** Bundled into serverless functions so ticket + auto-reply mail can readFile them. */
const MAIL_ASSETS = [
  "./public/ticket-base.png",
  "./public/uwcsea-logo.png",
  "./public/book/paynow-qr.png",
  "./public/fonts/PlayfairDisplay.ttf",
  "./public/fonts/PlayfairDisplay-SemiBold.ttf",
  "./public/fonts/PlayfairDisplaySC-SemiBold.ttf",
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["googleapis", "pdf-lib", "@pdf-lib/fontkit", "pngjs"],
  outputFileTracingIncludes: {
    "/*": MAIL_ASSETS,
    "/**": MAIL_ASSETS,
    "/api/**/*": MAIL_ASSETS,
  },
};

export default nextConfig;
