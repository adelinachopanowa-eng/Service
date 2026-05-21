import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Server Actions to be invoked from the Netlify domain. Without this,
  // Next.js rejects POST requests from the deployed site because the Origin
  // header (the Netlify-facing domain) does not match the internal Host header
  // seen by the server behind the proxy.
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "*.netlify.app",
        "*.netlify.com",
      ],
    },
  },
};

export default nextConfig;
