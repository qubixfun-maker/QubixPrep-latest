import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  serverExternalPackages: ['google-auth-library'],
  outputFileTracingIncludes: {
    '/api/admin/ai-ingest-textbook': ['./node_modules/@napi-rs/canvas*/**/*'],
    '/api/admin/parse-question-bank': ['./node_modules/@napi-rs/canvas*/**/*'],
    '/api/long-answers/extract-pdf-text': ['./node_modules/@napi-rs/canvas*/**/*'],
    '/api/qbank/upload': ['./node_modules/@napi-rs/canvas*/**/*'],
    '/api/textbooks/extract-chapter-images': ['./node_modules/@napi-rs/canvas*/**/*'],
    '/api/textbooks/ingest-manual': ['./node_modules/@napi-rs/canvas*/**/*'],
    '/api/textbooks/ingest': ['./node_modules/@napi-rs/canvas*/**/*'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Add custom webpack configuration to bypass loading the raw binary character stream
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });
    return config;
  },
};

export default nextConfig;
