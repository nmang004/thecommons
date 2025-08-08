import type { NextConfig } from "next";
import path from "path";

// Load global polyfills immediately
require('./global-polyfills.js');

// Only import bundle analyzer when needed
const withBundleAnalyzer = process.env.ANALYZE === "true" 
  ? require("@next/bundle-analyzer")({
      enabled: true,
    })
  : (config: NextConfig) => config;

const nextConfig: NextConfig = {
  // ESLint configuration for build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // Optimization settings
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'framer-motion',
      'recharts'
    ],
    // Enable webpack caching
    webpackBuildWorker: true,
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
  },

  // Performance optimizations
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=600'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400'
          }
        ]
      }
    ]
  },

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Add polyfill using webpack's DefinePlugin instead of custom plugin
    const webpack = require('webpack');
    
    if (isServer) {
      // Define self globally for server-side rendering
      config.plugins.push(
        new webpack.DefinePlugin({
          'typeof self': JSON.stringify('object'),
        })
      );
      
      // Add polyfill as a banner to all chunks
      config.plugins.push(
        new webpack.BannerPlugin({
          banner: `
            if (typeof self === 'undefined') {
              try {
                global.self = global;
              } catch (e) {
                // Ignore errors
              }
            }
          `,
          raw: true,
          entryOnly: false,
        })
      );
    }

    // Configure path aliases for both development and production
    config.resolve.alias = {
      ...config.resolve.alias,
      // Fix module resolution for @/* imports using absolute paths
      '@': path.resolve(__dirname),
      '@/components': path.resolve(__dirname, 'components'),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/app': path.resolve(__dirname, 'app'),
      '@/hooks': path.resolve(__dirname, 'hooks'),
      '@/types': path.resolve(__dirname, 'types'),
      // Optimize bundle size by using lighter alternatives  
      'moment': 'date-fns',
    }

    return config
  },

  // Redirect and rewrites for performance
  async redirects() {
    return [
      {
        source: '/article/:id',
        destination: '/articles/:id',
        permanent: true,
      }
    ]
  },

  // Enable compression
  compress: true,

  // Power by header
  poweredByHeader: false,
};

export default withBundleAnalyzer(nextConfig);
