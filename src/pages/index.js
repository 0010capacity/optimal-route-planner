import React from 'react';
import Head from 'next/head';
import App from '../App';
import '../index.css';

export default function Home() {
  return (
    <>
      <Head>
        <title>최적 경로 플래너 - 스마트한 이동 경로 최적화</title>
        <meta name="description" content="여러 장소를 효율적으로 방문할 수 있는 최적 경로를 자동으로 계산해주는 웹 애플리케이션입니다. 네이버 지도와 카카오맵을 지원합니다." />
        <meta name="keywords" content="경로 최적화, 최적 경로, 네이버 지도, 카카오맵, 이동 경로, TSP, 여행 계획" />
        <meta name="author" content="최적 경로 플래너" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Open Graph 메타 태그 */}
        <meta property="og:title" content="최적 경로 플래너 - 스마트한 이동 경로 최적화" />
        <meta property="og:description" content="여러 장소를 효율적으로 방문할 수 있는 최적 경로를 자동으로 계산해주는 웹 애플리케이션입니다." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://optimal-route-planner.vercel.app" />
        <meta property="og:image" content="/logo192.png" />

        {/* Twitter Card 메타 태그 */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="최적 경로 플래너 - 스마트한 이동 경로 최적화" />
        <meta name="twitter:description" content="여러 장소를 효율적으로 방문할 수 있는 최적 경로를 자동으로 계산해주는 웹 애플리케이션입니다." />
        <meta name="twitter:image" content="/logo192.png" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo192.png" />

        {/* PWA 관련 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#667eea" />
      </Head>
      <App />
    </>
  );
}
