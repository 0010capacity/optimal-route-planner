import { useEffect } from 'react';

export function WebVitals() {
  useEffect(() => {
    // Web Vitals 모니터링 (개발 환경에서만 로깅)
    if (process.env.NODE_ENV === 'development') {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(console.log);
        getFID(console.log);
        getFCP(console.log);
        getLCP(console.log);
        getTTFB(console.log);
      });
    }
  }, []);

  return null;
}
