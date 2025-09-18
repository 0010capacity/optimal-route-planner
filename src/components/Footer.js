import React from 'react';

/**
 * 애플리케이션 Footer 컴포넌트
 */
const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-main">
          <div className="footer-brand">
            <h4>최적 경로 플래너</h4>
            <p>여러 장소를 효율적으로 방문할 수 있는 최적 경로를 자동으로 계산해주는 웹 애플리케이션입니다.</p>
            <div className="footer-brand-links">
              <a href="https://github.com/0010capacity/optimal-route-planner" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a href="mailto:0010capacity@gmail.com">
                이메일
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-license">
            <span>© 2025 최적 경로 플래너. MIT License.</span>
          </div>
          <div className="footer-version">
            <span>Version 1.3.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
