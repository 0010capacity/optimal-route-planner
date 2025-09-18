import { useState, useEffect } from 'react';
import { CURRENT_VERSION, PATCH_NOTES_STORAGE_KEY } from '../utils/version';

/**
 * 패치노트 관리를 위한 커스텀 훅
 * - 새로운 버전 감지
 * - 마지막으로 본 버전 추적
 * - localStorage를 통한 상태 유지
 */
export const usePatchNotes = () => {
  const [showPatchNotes, setShowPatchNotes] = useState(false);
  const [lastSeenVersion, setLastSeenVersion] = useState(null);
  const [hasNewVersion, setHasNewVersion] = useState(false);

  // localStorage에서 마지막으로 본 버전 로드
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PATCH_NOTES_STORAGE_KEY);
      if (stored) {
        setLastSeenVersion(stored);
      }
    } catch (error) {
      console.warn('Failed to load patch notes from localStorage:', error);
    }
  }, []);

  // 새로운 버전 확인
  useEffect(() => {
    if (lastSeenVersion && lastSeenVersion !== CURRENT_VERSION) {
      setHasNewVersion(true);
    } else if (!lastSeenVersion) {
      // 처음 사용하는 경우
      setHasNewVersion(true);
    }
  }, [lastSeenVersion]);

  // 새로운 버전이 있고 아직 팝업을 본 적이 없는 경우 자동 표시
  useEffect(() => {
    if (hasNewVersion && !showPatchNotes) {
      // 약간의 지연 후 자동 표시 (사용자 경험 개선)
      const timer = setTimeout(() => {
        setShowPatchNotes(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [hasNewVersion, showPatchNotes]);

  // 패치노트 표시
  const openPatchNotes = () => {
    setShowPatchNotes(true);
  };

  // 패치노트 닫기 및 버전 저장
  const closePatchNotes = () => {
    setShowPatchNotes(false);
    setLastSeenVersion(CURRENT_VERSION);
    setHasNewVersion(false);

    try {
      localStorage.setItem(PATCH_NOTES_STORAGE_KEY, CURRENT_VERSION);
    } catch (error) {
      console.warn('Failed to save patch notes version to localStorage:', error);
    }
  };

  return {
    showPatchNotes,
    hasNewVersion,
    openPatchNotes,
    closePatchNotes,
    currentVersion: CURRENT_VERSION,
    lastSeenVersion
  };
};
