import React from 'react';

/**
 * 로딩 오버레이 컴포넌트
 */
const LoadingOverlay = ({ isOptimizing }) => {
  if (!isOptimizing) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <div className="loading-text">경로를 최적화하고 있습니다...</div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
