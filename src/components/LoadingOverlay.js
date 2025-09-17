import React from 'react';

/**
 * 로딩 오버레이 컴포넌트
 */
const LoadingOverlay = ({ isOptimizing, optimizationProgress }) => {
  if (!isOptimizing) return null;

  const { current, total, message } = optimizationProgress || {};
  const progressPercent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <div className="loading-text">
          {message || '경로를 최적화하고 있습니다...'}
        </div>
        {total > 0 && (
          <div className="loading-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {current}/{total} ({progressPercent}%)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
