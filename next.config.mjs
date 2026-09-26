/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/my-wardrobe',
        destination: '/wardrobe',
      },
      {
        source: '/my-looks',
        destination: '/looks',
      },
      {
        source: '/my-style',
        destination: '/style-profile',
      },
    ];
  },
};

export default nextConfig;
