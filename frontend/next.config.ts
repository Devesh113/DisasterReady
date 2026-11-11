import type { NextConfig } from 'next';

const BACKEND_PORT = process.env.BACKEND_PORT || '5001';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${BACKEND_PORT}`;

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/unity-flood/Build/FlashFlood_WebGL_Build.data.br',
        headers: [
          { key: 'Content-Encoding', value: 'br' },
          { key: 'Content-Type', value: 'application/octet-stream' },
        ],
      },
      {
        source: '/unity-flood/Build/FlashFlood_WebGL_Build.framework.js.br',
        headers: [
          { key: 'Content-Encoding', value: 'br' },
          { key: 'Content-Type', value: 'application/javascript' },
        ],
      },
      {
        source: '/unity-flood/Build/FlashFlood_WebGL_Build.wasm.br',
        headers: [
          { key: 'Content-Encoding', value: 'br' },
          { key: 'Content-Type', value: 'application/wasm' },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
