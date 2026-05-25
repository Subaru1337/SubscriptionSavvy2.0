/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs", "csv-stringify", "csv-parse", "jspdf", "jspdf-autotable"],
  },
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
