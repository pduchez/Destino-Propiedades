/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Las imágenes del stock se sirven desde /uploads vía un route handler.
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
