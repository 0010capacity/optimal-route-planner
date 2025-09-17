import React from 'react';
import { Icon } from './Icon';

/**
 * 지도 선택 모달 컴포넌트
 */
const MapSelectorModal = ({ showMapSelector, onClose, onMapSelect }) => {
  if (!showMapSelector) return null;

  const handleMapSelectAndClose = (mapType) => {
    onMapSelect(mapType);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>지도 선택</h3>
        <p>어떤 지도로 공유하시겠습니까?</p>
        <div className="modal-buttons">
          <button
            className="modal-button naver-button"
            onClick={() => handleMapSelectAndClose('naver')}
          >
            <Icon name="map" size={20} />
            <span>네이버 지도</span>
          </button>
          <button
            className="modal-button kakao-button"
            onClick={() => handleMapSelectAndClose('kakao')}
          >
            <Icon name="map" size={20} />
            <span>카카오맵</span>
          </button>
        </div>
        <button
          className="modal-close"
          onClick={onClose}
        >
          <Icon name="close" size={16} />
        </button>
      </div>
    </div>
  );
};

export default MapSelectorModal;
