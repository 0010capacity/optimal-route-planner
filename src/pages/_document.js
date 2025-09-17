import { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <meta name="theme-color" content="#2563eb" />
        <meta
          name="description"
          content="여러 장소를 효율적으로 방문할 수 있는 최적 경로를 자동으로 계산해주는 웹 애플리케이션"
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <link rel="manifest" href="/manifest.json" />

      </Head>
      <body>
        <Main />
        <NextScript />

        {/* Kakao Maps JavaScript SDK v2 */}
        <script
          type="text/javascript"
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_APP_KEY || '5be0a34292474922b240a1bd76ad518c'}&libraries=services`}
        ></script>
      </body>
    </Html>
  );
}
