/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
          {
            source: '/api/:path*',
            destination: '/.netlify/functions/auth/:path*',
          },
        ]
      },
};

export default nextConfig;
