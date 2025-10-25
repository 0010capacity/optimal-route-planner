import { useState, useEffect } from "react";
import { CURRENT_VERSION, PATCH_NOTES_STORAGE_KEY } from "../utils/version";

/**
 * 패치노트 관리를 위한 커스텀 훅
 * - 새로운 버전 감지
 * - 마지막으로 본 버전 추적
 * - localStorage를 통한 상태 유지
 * - 새 버전이 있을 때만 자동 표시
 */
export const usePatchNotes = () => {
  const [showPatchNotes, setShowPatchNotes] = useState(false);
  const [lastSeenVersion, setLastSeenVersion] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // localStorage에서 마지막으로 본 버전 로드
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PATCH_NOTES_STORAGE_KEY);
      setLastSeenVersion(stored);
      setIsLoaded(true);
    } catch (error) {
      console.warn("Failed to load patch notes from localStorage:", error);
      setIsLoaded(true);
    }
  }, []);

  // 새로운 버전이 있는 경우 자동 표시
  useEffect(() => {
    if (!isLoaded) return;

    // 이전에 본 버전이 있고, 현재 버전과 다른 경우에만 자동 표시
    if (lastSeenVersion && lastSeenVersion !== CURRENT_VERSION) {
      console.log(
        `🆕 New version detected: ${lastSeenVersion} → ${CURRENT_VERSION}`,
      );

      // 약간의 지연 후 자동 표시 (사용자 경험 개선)
      const timer = setTimeout(() => {
        setShowPatchNotes(true);
      }, 1000);

      return () => clearTimeout(timer);
    }

    // 처음 방문하는 경우 (lastSeenVersion이 null)
    // 현재 버전을 저장만 하고 패치노트는 표시하지 않음
    if (!lastSeenVersion) {
      console.log(
        `👋 First visit - saving current version: ${CURRENT_VERSION}`,
      );
      try {
        localStorage.setItem(PATCH_NOTES_STORAGE_KEY, CURRENT_VERSION);
        setLastSeenVersion(CURRENT_VERSION);
      } catch (error) {
        console.warn("Failed to save initial version to localStorage:", error);
      }
    }
  }, [isLoaded, lastSeenVersion]);

  // 패치노트 수동 표시 (Footer 버튼 클릭)
  const openPatchNotes = () => {
    setShowPatchNotes(true);
  };

  // 패치노트 닫기 및 현재 버전 저장
  const closePatchNotes = () => {
    setShowPatchNotes(false);

    // 현재 버전을 "읽음" 상태로 저장
    try {
      localStorage.setItem(PATCH_NOTES_STORAGE_KEY, CURRENT_VERSION);
      setLastSeenVersion(CURRENT_VERSION);
      console.log(
        `✅ Patch notes closed - version ${CURRENT_VERSION} marked as seen`,
      );
    } catch (error) {
      console.warn(
        "Failed to save patch notes version to localStorage:",
        error,
      );
    }
  };

  // 새 버전 여부 확인
  const hasNewVersion =
    isLoaded && lastSeenVersion && lastSeenVersion !== CURRENT_VERSION;

  return {
    showPatchNotes,
    hasNewVersion,
    openPatchNotes,
    closePatchNotes,
    currentVersion: CURRENT_VERSION,
    lastSeenVersion,
    isLoaded,
  };
};
