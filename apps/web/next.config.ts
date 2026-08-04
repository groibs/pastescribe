import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Packages internos são exportados como TS puro; o Next transpila.
  transpilePackages: [
    "@pastescribe/config",
    "@pastescribe/contracts",
    "@pastescribe/database",
    "@pastescribe/i18n",
    "@pastescribe/storage",
  ],
  async redirects() {
    return [
      // Negociação por Accept-Language chega com o middleware/proxy em
      // fatia futura (docs/SEO.md); até lá a raiz aponta para o x-default.
      {
        source: "/",
        destination: "/en",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
