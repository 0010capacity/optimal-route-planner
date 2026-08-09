# 최적 경로 플래너

여러 장소를 효율적으로 방문하는 최적 순서를 자동으로 계산해주는 웹 애플리케이션입니다. 일상의 동선 — 예: 헌혈의 집 N곳 순회, 멀티 스탑 배달 — 을 TSP(외판원 문제)로 풀어 최소 이동시간 경로를 제공합니다.

## 핵심 기능

### 경로 최적화
- **비대칭 TSP 기반 Branch and Bound**: 카카오 모빌리티 Directions는 방향성 거리(A→B ≠ B→A)를 반환하므로 비대칭 거리 행렬을 채우고 정확한 최적해를 보장합니다.
- **API 호출 최적화**: 거리 행렬 O(n²) + 최종 경로 1회. naive 완전탐색 O(n!) 대비 대폭 절감.
- **거리 행렬 캐시**: 동일 좌표 재최적화 시 추가 호출 0회.
- **실시간 교통 정보**: 카카오 모빌리티 Directions API 기반 실제 도로 이동시간.

### 사용자 인터페이스
- 드래그 앤 드롭으로 경유지 순서 조정
- 카카오/네이버 지도 양쪽 플랫폼에 경로 공유
- 모바일 최적화된 터치 친화적 UI

## 알고리즘 (v3.0)

이전 버전은 4단계 분기(brute force / TSP DP / 2-opt / 휴리스틱)를 표방했으나 실제 코드는 3단계만 분기하고 그중 2개는 dead code였습니다. v3.0은 비대칭 TSP의 정확한 최적해를 보장하는 **단일 알고리즘(Branch and Bound)**으로 단순화했습니다.

### 분기 (현재)

| 경유지 수 | 알고리즘 | API 호출 |
|---|---|---|
| 0개 (출발/도착만) | direct | 1회 |
| 1개 이상 | 비대칭 거리 행렬 + Branch and Bound | n(n-1) + 1회 (최대 n=12일 때 133회) |

### 비대칭 거리 행렬

카카오 모빌리티 Directions는 A→B와 B→A가 다른 totalTime을 반환합니다 (일방통행, 회전 금지 등). 거리 행렬을 `i<j`만 부르고 `matrix[j][i] = matrix[i][j]`로 대칭 강제 복사하면 실제 도로 방향성을 무시하고 잘못된 최적해를 고를 수 있습니다. v3.0은 `i≠j` 모든 방향을 호출해 비대칭 행렬을 채웁니다.

- 비대칭 호출: n(n-1)회
- 기존 대칭 강제: n(n-1)/2회 (정확도 손실)

예: n=12(경유지 10개) → 비대칭 132회 + 최종 1회 = **133회**. naive 완전탐색 10! = 3,628,800회 대비 약 **27,000배 절감**.

### Branch and Bound

정확도 100% (비대칭 행렬 위). LB는 비대칭에서 valid한 형태로 교체 — 각 unvisited 노드의 outgoing 최소 비용 합 + 끝점까지 비용. MST 기반 LB는 비대칭에서 valid하지 않아 제거.

LB 검증: 무작위 비대칭 행렬에 대해 n=3–9까지 7/7 케이스에서 brute force와 동일 비용 확인.

### 최대 지점 수

UI 단에서 12개 초과 추가·최적화 차단. 엔진 진입에서도 `TOO_MANY_LOCATIONS` 가드로 침묵 실패 없이 사용자에게 메시지 노출.

## 기술 스택

- React 18, Next.js 15
- Kakao Maps (검색) + Naver Maps (지도·경로) — Firebase Functions 프록시
- 좌표계: WGS84
- 패키지 매니저: bun

## 시작하기

### 사전 요구사항
- Node.js 18+
- bun
- 네이버 클라우드 플랫폼 계정
- 카카오 디벨로퍼스 계정

### 설치 및 실행

```bash
git clone https://github.com/a7garden/optimal-route-planner.git
cd optimal-route-planner
bun install
```

`.env`:
```env
NEXT_PUBLIC_NAVER_CLIENT_ID=...
NEXT_PUBLIC_KAKAO_APP_KEY=...
```

```bash
bun run dev      # http://localhost:3000
bun run build
```

Firebase Functions (Kakao REST API 프록시):
```bash
cd functions && npm install
firebase deploy --only functions
```

## 사용 방법

1. 출발지, 경유지, 도착지를 검색하여 추가
2. '경로 최적화' 버튼으로 최적 순서 계산
3. 지도에서 경로 확인
4. 네이버 지도 / 카카오맵으로 공유

## 배포

```bash
bun run build
firebase deploy
```

**배포된 애플리케이션**: https://my-optimal-route-planner.web.app

## 라이선스

MIT
