import React from 'react';
import { Icon } from './Icon';

/**
 * 애플리케이션 Footer 컴포넌트
 */
const Footer = ({ onPatchNotesClick }) => {
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
              {onPatchNotesClick && (
                <button
                  className="footer-patch-notes-btn"
                  onClick={onPatchNotesClick}
                  title="패치노트 보기"
                >
                  <Icon name="update" size={14} />
                  패치노트
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-license">
            <span>© 2025 최적 경로 플래너. MIT License.</span>
          </div>
          <div className="footer-version">
            <span>Version 1.4.0</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer-patch-notes-btn {
          background: none;
          border: none;
          color: #667eea;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .footer-patch-notes-btn:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .footer-brand-links {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-top: 8px;
        }

        .footer-brand-links a,
        .footer-patch-notes-btn {
          text-decoration: none;
          color: #667eea;
          transition: color 0.2s;
        }

        .footer-brand-links a:hover {
          color: #5a67d8;
        }
      `}</style>
    </footer>
  );
};

export default Footer;
