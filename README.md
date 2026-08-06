# 최적 경로 플래너

여러 장소를 효율적으로 방문할 수 있는 최적 경로를 자동으로 계산해주는 모바일 웹 애플리케이션입니다. 실제 도로 이동시간에 기반해 TSP(외판원 문제)를 풀고, Kakao/Naver 지도와 자연스럽게 연동됩니다.

## 프로젝트 개요

일상에서 여러 장소를 방문해야 할 때 가장 효율적인 순서를 찾는 것은 생각보다 복잡한 문제입니다. 이 애플리케이션은 TSP 알고리즘을 기반으로 **최소 이동시간**을 보장하는 최적 경로를 자동으로 계산하여 사용자의 시간과 비용을 절약합니다.

## 핵심 기능

### 스마트 경로 최적화

- **하이브리드 알고리즘**: 경유지 수에 따라 최적 알고리즘을 자동 선택
  - 0개 경유지 (2 지점): 직접 계산 · API 1회
  - 1–8개 경유지: 완전탐색(brute_force) · 100% 최적해 보장
  - 9–10개 경유지: Branch and Bound · 100% 최적해 보장
- **알고리즘 한계**: 11개 경유지(13 지점) 이상은 의도적으로 거부 (`TOO_MANY_LOCATIONS`)
- **거리 행렬**: BB 분기에서 `buildDistanceMatrix()`로 모든 지점 쌍의 이동시간을 O(n²)쌍으로 구축
- **배치 처리**: 행렬 쌍을 batch(=10) 묶음으로 HTTP 호출 — 11 지점은 6+1=7 HTTP
- **실시간 교통 정보**: 네이버 Directions API 기반 정확한 도로 이동시간
- **API 캐시**: `apiCache`가 거리 행렬/라우트 결과를 5분 TTL로 캐시 (반복 최적화 비용 절감)

### 직관적인 사용자 인터페이스

- 드래그 앤 드롭으로 간편한 경유지 순서 조정
- 실시간 지도 시각화를 통한 경로 확인
- 모바일 최적화된 터치 친화적 UI/UX

### 지도 연동 및 공유

- 네이버 지도와 카카오맵 양쪽 플랫폼 지원
- 계산된 최적 경로를 지도 앱으로 직접 전송
- 모바일 앱 우선, 웹 버전 자동 폴백

### 편의 기능

- 카카오 지역 검색 API 연동으로 빠른 장소 검색
- 즐겨찾기 기능으로 자주 방문하는 장소 관리
- 현재 위치 자동 감지 및 설정

## 기술 스택

**Frontend Framework**
- Next.js 14 (static export) · React 18 with Hooks
- ES6+ JavaScript

**지도 및 위치 서비스**
- Kakao Maps SDK (지도 렌더링 · 장소 검색)
- Naver Directions API (실제 도로 이동시간·거리)

**백엔드 서비스**
- Next.js API Routes (`/api/directions`) — CORS·키 프록시

**개발 도구**
- ESLint
- Git & GitHub

## 최적 경로 계산 알고리즘

### 구현된 분기 (`HybridOptimizer.optimize`)

```js
if (waypointCount <= 0)         method = 'direct'           // 2 지점
else if (waypointCount <= 8)    method = 'brute_force'      // 1–8 경유
else if (waypointCount <= 10)   method = 'branch_and_bound' // 9–10 경유
// 그 외(11+): result = null → "TOO_MANY_LOCATIONS" (전체 12개 상한)
```

출처: `src/utils/routeOptimizer.js` L218–258.

### 1–8 경유 — 완전탐색(brute_force)

`optimizeBruteForce()`는 `getPermutations(waypoints)`로 모든 순열을 생성하고, 각 순열마다 `getOptimalDirections()`로 실제 네이버 이동시간을 조회해 최소를 고른다. 출발·도착은 고정.

- **API 호출 수**: (n-2)! (순열마다 HTTP 1회)
- 예: 7 지점(5 경유) 120회 · 8 지점(6 경유) 720회 · 10 지점(8 경유) 40,320회
- **정확도**: 100% 최적해 보장

### 9–10 경유 — Branch and Bound + 거리 행렬

`optimizeBranchAndBound()`는 두 단계로 동작한다.

1. **거리 행렬 구축** — `buildDistanceMatrix()`로 모든 지점 쌍의 이동시간을 채운다. 대칭이므로 n(n-1)/2쌍만 API 호출, batch(=10) 묶음으로 HTTP 요청.
2. **Branch and Bound 가지치기** — `BranchAndBoundOptimizer`가 행렬 위에서 순열을 나열하며 현재 최솟값을 하한으로 두고 가지치기.

- **API 호출 수**: n(n-1)/2 + 1쌍 → batch(10) 묶음 + 1회 최종 검증
  - 11 지점(9 경유): 56쌍 → 6+1 = 7 HTTP
  - 12 지점(10 경유): 67쌍 → 7+1 = 8 HTTP
- **정확도**: 100% 최적해 보장

### 거리 행렬 시각화

앱은 계산된 n×n 이동시간 표를 사용자에게 보여준다. 이 행렬은 위 BB 분기뿐 아니라 자동 경로 미리보기(`useRouteCalculation`)에도 사용된다.

### 성능 지표

- **처리 시간** (실측 코드 기준):
  - 1–8 경유: (n-2)! HTTP 순차 호출. 6 경유 ≈ 수 초, 8 경유 ≈ 분 단위
  - 9–10 경유: 행렬 구축 + BB 계산. 일반적으로 수 초
- **정확도**: 모든 분기 100% 최적해 (근사 알고리즘 미사용)
- **최대 지점**: 12개 (하드 캡)

## 시작하기

### 사전 요구사항

- Node.js 18.0 이상
- npm 또는 yarn
- 네이버 클라우드 플랫폼 계정 (Directions API 활성화)
- 카카오 디벨로퍼스 계정 (JavaScript 키)

### 설치 및 실행

1. **저장소 클론**
   ```bash
   git clone https://github.com/a7garden/optimal-route-planner.git
   cd optimal-route-planner
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**

   `.env.local` 파일을 생성하고 API 키를 설정:
   ```env
   NEXT_PUBLIC_NAVER_CLIENT_ID=your_naver_client_id_here
   NEXT_PUBLIC_KAKAO_APP_KEY=your_kakao_javascript_key_here
   ```

4. **개발 서버 실행**
   ```bash
   npm run dev
   ```

   브라우저에서 `http://localhost:3000`으로 접속

### API 설정

**네이버 클라우드 플랫폼**
- **Directions 5**: 경로 계산 및 이동시간 산출

**카카오 디벨로퍼스**
- **JavaScript 키**: 지도 SDK + Places 검색

## 사용 방법

1. **장소 추가**: 출발지, 경유지, 도착지를 검색하여 추가
2. **경로 최적화**: '경로 최적화' 버튼 클릭으로 최적 순서 계산
3. **결과 확인**: 지도에서 최적화된 경로와 예상 소요시간 확인
4. **지도 공유**: 네이버 지도 또는 카카오맵으로 경로 전송

## 프로젝트 특징

### 알고리즘 정확성

- 모든 분기(1–8·9–10 경유)에서 **100% 최적해**를 보장한다. 9–10 경유 분기에서 호출 수가 (n-2)! → 7–8 HTTP로 떨어져 응답 지연과 비용이 크게 줄어든다.
- **11 지점 기준 동일 문제를 만약 브루트포스로 풀었다면 9! = 362,880 HTTP, BB는 7 HTTP → 99.998% 절감.**

### 확장 가능한 아키텍처

- 컴포넌트 기반 모듈화 설계
- 커스텀 훅(`useAppHandlers`·`useRouteCalculation` 등)을 통한 로직 분리
- API 계층 추상화로 다른 지도 서비스 연동 가능

### 멀티 플랫폼 지원

- 네이버 지도와 카카오맵 동시 지원
- 모바일 앱 URL 스킴과 웹 URL 자동 전환
- 브라우저별 호환성 최적화

## 배포

### 프로덕션 빌드

```bash
npm run build
```

Next.js의 static export로 정적 사이트가 생성된다. Firebase Hosting, GitHub Pages 등 어디에든 업로드 가능.

## 라이선스

MIT License

## 기여하기

이슈 리포트, 기능 제안, 풀 리퀘스트를 환영합니다. 기여 전에 이슈를 통해 논의해 주세요.
