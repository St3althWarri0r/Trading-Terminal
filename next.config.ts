import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // yahoo-finance2 is a Node library with dynamic requires — keep it external
  // to the server bundle instead of letting Turbopack try to bundle it.
  serverExternalPackages: ["yahoo-finance2"],

  // Dev-only (ignored in production): Next blocks cross-origin requests to
  // dev assets/HMR by default, which would break `npm run dev:lan` from other
  // devices — the page loads but hot reload 403s and the client keeps
  // re-connecting. Allow the private LAN ranges so dev:lan works as documented.
  // Note: each `*` matches exactly one dot-segment, so IPv4 needs `*.*.*`.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],

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
