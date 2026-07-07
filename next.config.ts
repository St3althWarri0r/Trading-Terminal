import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // yahoo-finance2 is a Node library with dynamic requires — keep it external
  // to the server bundle instead of letting Turbopack try to bundle it.
  serverExternalPackages: ["yahoo-finance2"],

  // Baseline security headers (the non-breaking subset — no strict CSP so the
  // app's inline styles and the chart canvas keep working).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
