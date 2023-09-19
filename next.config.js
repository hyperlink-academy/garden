/**
 * @type {import('next').NextConfig}
 */
const { withSentryConfig } = require("@sentry/nextjs");

const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/s/:studio/s/:space/:slug/:path*",
        destination: "/s/:studio/s/:space/:path*",
      },
      {
        source: "/s/:studio/s/:space/:slug",
        destination: "/s/:studio/s/:space",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/sso",
        destination: "https://year-one.hyperlink.academy/sso",
        permanent: false,
      },
      {
        source: "/courses/:path*",
        destination: "https://year-one.hyperlink.academy/courses/:path*",
        permanent: false,
      },
      {
        source: "/library/:path*",
        destination: "https://year-one.hyperlink.academy/library/:path*",
        permanent: false,
      },
      {
        source: "/clubs",
        destination: "https://year-one.hyperlink.academy/clubs",
        permanent: false,
      },
      {
        source: "/manual/:path*",
        destination: "https://year-one.hyperlink.academy/manual/:path*",
        permanent: false,
      },
    ];
  },
};

const withPWA = require("next-pwa")({
  dest: "public",
  mode: "production",
  disable: process.env.NODE_ENV !== "production",
});

module.exports = withSentryConfig(
  withPWA(nextConfig),
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: "hyperlink-c0f7f8129",
    project: "javascript-nextjs",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
  }
);
