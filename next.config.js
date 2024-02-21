/**
 * @type {import('next').NextConfig}
 */
const withMDX = require("@next/mdx")();

const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  async rewrites() {
    return [];
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

const withSerwist = require("@serwist/next").default({
  // Note: This is only an example. If you use Pages Router,
  // use something else that works, such as "service-worker/index.ts".
  swSrc: "worker/index.ts",
  swDest: "public/sw.js",
  reloadOnOnline: false,
  register: true,
});

module.exports = withMDX(withSerwist(nextConfig));
