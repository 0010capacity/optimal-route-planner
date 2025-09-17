import React, { useState, useRef, useEffect } from 'react';

const Tooltip = ({ content, children, position = 'top', delay = 300 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  const getTooltipStyle = () => {
    if (!triggerRef.current || !tooltipRef.current) return {};

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    switch (position) {
      case 'top':
        return {
          top: triggerRect.top - tooltipRect.height - 8,
          left: triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2),
        };
      case 'bottom':
        return {
          top: triggerRect.bottom + 8,
          left: triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2),
        };
      case 'left':
        return {
          top: triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2),
          left: triggerRect.left - tooltipRect.width - 8,
        };
      case 'right':
        return {
          top: triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2),
          left: triggerRect.right + 8,
        };
      default:
        return {};
    }
  };

  return (
    <div className="tooltip-container">
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`tooltip tooltip-${position}`}
          style={getTooltipStyle()}
          role="tooltip"
        >
          {content}
          <div className="tooltip-arrow"></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
