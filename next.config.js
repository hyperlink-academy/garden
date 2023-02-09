/**
 * @type {import('next').NextConfig}
 */
const withPWA = require("next-pwa")({
  dest: "public",
});
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
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

module.exports = withPWA(nextConfig);
