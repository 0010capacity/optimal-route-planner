import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // 애니메이션 시간 후 제거
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIconName = () => {
    switch (type) {
      case 'success': return 'check';
      case 'error': return 'close';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  const getToastClass = () => {
    return `toast toast-${type} ${isVisible ? 'toast-visible' : 'toast-hidden'}`;
  };

  return (
    <div className={getToastClass()}>
      <div className="toast-icon">
        <Icon name={getIconName()} size={20} />
      </div>
      <div className="toast-content">
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={() => setIsVisible(false)} aria-label="알림 닫기">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export { Toast, ToastContainer };
export default ToastContainer;
