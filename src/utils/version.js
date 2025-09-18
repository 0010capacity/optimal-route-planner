/**
 * 애플리케이션 버전 및 패치노트 데이터
 */

// 현재 버전
export const CURRENT_VERSION = '1.2.0';

// 패치노트 데이터
export const PATCH_NOTES = [
  {
    version: '1.2.0',
    date: '2025년 9월 18일',
    changes: [
      '✨ 경로 최적화 알고리즘 개선',
      '🔧 캐시 시스템 최적화',
      '🎯 경로 표시 안정성 향상',
      '🐛 다양한 버그 수정'
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
