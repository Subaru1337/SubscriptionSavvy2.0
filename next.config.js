/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs", "csv-stringify", "csv-parse"],
  },
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
