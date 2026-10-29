/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow production verification alongside a running development server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  // Development only (ignored by `next build` / `next start`). By default `next dev` keeps just the 5 most
  // recently used pages compiled and drops a page after 60 s without a request, so moving between more than
  // 5 pages recompiles on nearly every click (0.1-1.3 s each). Keep up to 100 pages compiled for an hour.
  // Restart `npm run dev` after changing this.
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 100,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;
