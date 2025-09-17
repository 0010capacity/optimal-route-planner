/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 이미지 최적화 설정
  images: {
    domains: ['naveropenapi.apigw.ntruss.com', 'dapi.kakao.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // 번들 분석 (개발 및 프로덕션 시)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: false, // 브라우저 자동 열기 비활성화
          analyzerHost: '127.0.0.1',
          analyzerPort: 8889, // 다른 포트 사용
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
