/**
 * 애플리케이션 버전 및 패치노트 데이터
 */

// 현재 버전
export const CURRENT_VERSION = '1.4.0';

// 패치노트 데이터
export const PATCH_NOTES = [
  {
    version: '1.4.0',
    date: '2025년 9월 18일',
    changes: [
      '📋 패치 노트 시스템 추가 - 버전 업데이트 알림 기능',
      '🚀 경로 최적화 알고리즘 개선 - 조건부 경로 리셋 및 효율성 향상',
      '� 로깅 및 캐싱 시스템 최적화',
      '🔔 토스트 알림 기능 추가 - 사용자 피드백 개선',
      '⚡ 하이브리드 옵티마이저 개선 - 시간 행렬 기반 계산',
      '🔄 배치 처리 성능 최적화 - 대량 데이터 처리 효율 향상',
      '�️ 불필요한 클래스 정리 - 코드베이스 간소화',
      '🎯 좌표 검증 및 에러 핸들링 강화'
    ]
  },
  {
    version: '1.3.0',
    date: '2025년 9월 18일',
    changes: [
      '🔥 Firebase 통합 및 배치 처리 최적화',
      '⚙️ Firebase 함수 메모리 설정 최적화',
      '🌐 Firebase 지역 설정 구성',
      '📈 최적화 진행률 추적 및 로딩 오버레이',
      '🛠️ Directions API 에러 핸들링 개선'
    ]
  },
  {
    version: '1.1.0',
    date: '2025년 9월 15일',
    changes: [
      '🚀 경로 최적화 기능 추가',
      '🗺️ 지도 통합 개선',
      '⚡ 성능 최적화',
      '🎨 UI/UX 개선'
    ]
  },
  {
    version: '1.0.0',
    date: '2025년 9월 10일',
    changes: [
      '🎉 첫 번째 출시',
      '📍 장소 검색 및 추가 기능',
      '🗺️ 카카오 지도 연동',
      '💾 로컬 저장 기능'
    ]
  }
];

// localStorage 키
export const PATCH_NOTES_STORAGE_KEY = 'optimal-route-planner-last-seen-version';
