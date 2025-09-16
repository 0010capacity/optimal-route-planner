import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ko">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2563eb" />
        <meta
          name="description"
          content="여러 장소를 효율적으로 방문할 수 있는 최적 경로를 자동으로 계산해주는 웹 애플리케이션"
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Naver Maps API Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const script = document.createElement('script');
                script.src = 'https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=3hku2yfd31';
                script.onload = function() {
                  console.log('네이버 지도 SDK 로드 완료');
                };
                script.onerror = function() {
                  console.error('네이버 지도 SDK 로드 실패');
                };
                document.head.appendChild(script);
              })();
            `,
          }}
        />

        {/* Kakao Maps JavaScript SDK v2 (Places 서비스 포함) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                window.kakaoSdkReady = false;

                window.initKakaoSdk = function() {
                  if (window.kakao && window.kakao.maps) {
                    try {
                      window.kakao.maps.load(() => {
                        window.kakaoSdkReady = true;
                      });
                    } catch (error) {}
                  }
                };

                const script = document.createElement('script');
                script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=5be0a34292474922b240a1bd76ad518c&libraries=services&autoload=false';
                script.async = true;

                script.onload = function() {
                  setTimeout(window.initKakaoSdk, 100);
                };

                script.onerror = function() {
                  console.error('카카오 지도 SDK 로드 실패');
                };

                document.head.appendChild(script);
              })();
            `,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
