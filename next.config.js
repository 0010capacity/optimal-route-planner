/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 이미지 최적화 설정
  images: {
    domains: ['naveropenapi.apigw.ntruss.com', 'dapi.kakao.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 번들 분석 (개발 및 프로덕션 시)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: 'bundle-report.html',
          openAnalyzer: false,
          generateStatsFile: true,
          statsFilename: 'stats.json',
        })
      );
      return config;
    },
  }),

  // PWA 및 서비스 워커 지원
  experimental: {
    optimizeCss: true,
  },

  // 헤더 보안 설정
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // 리다이렉트 설정 (필요시)
  async redirects() {
    return [
      // 예: /home -> /
      // {
      //   source: '/home',
      //   destination: '/',
      //   permanent: true,
      // },
    ];
  },
}

module.exports = nextConfig
