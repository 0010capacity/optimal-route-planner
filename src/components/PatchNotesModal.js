import React from 'react';
import { Icon } from './Icon';
import { PATCH_NOTES, CURRENT_VERSION } from '../utils/version';

/**
 * 패치노트 모달 컴포넌트
 */
const PatchNotesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="patch-notes-overlay" onClick={onClose}>
      <div className="patch-notes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="patch-notes-header">
          <div className="patch-notes-title">
            <Icon name="update" size={20} />
            <h2>패치노트</h2>
            <span className="current-version">v{CURRENT_VERSION}</span>
          </div>
          <button className="patch-notes-close" onClick={onClose}>
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="patch-notes-content">
          {PATCH_NOTES.map((note, index) => (
            <div key={note.version} className="patch-note-item">
              <div className="patch-note-header">
                <h3>버전 {note.version}</h3>
                <span className="patch-note-date">{note.date}</span>
                {index === 0 && (
                  <span className="latest-badge">최신</span>
                )}
              </div>
              <ul className="patch-note-changes">
                {note.changes.map((change, changeIndex) => (
                  <li key={changeIndex} className="patch-note-change">
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="patch-notes-footer">
          <button className="patch-notes-confirm" onClick={onClose}>
            확인
          </button>
        </div>
      </div>

      <style jsx>{`
        .patch-notes-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .patch-notes-modal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          max-width: 500px;
          width: 100%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .patch-notes-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          border-bottom: 1px solid #e1e5e9;
        }

        .patch-notes-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .patch-notes-title h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .current-version {
          background: #667eea;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .patch-notes-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          color: #666;
          transition: background-color 0.2s;
        }

        .patch-notes-close:hover {
          background: #f5f5f5;
        }

        .patch-notes-content {
          flex: 1;
          overflow-y: auto;
          padding: 0 20px;
        }

        .patch-note-item {
          padding: 20px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .patch-note-item:last-child {
          border-bottom: none;
        }

        .patch-note-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .patch-note-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .patch-note-date {
          color: #666;
          font-size: 14px;
        }

        .latest-badge {
          background: #10b981;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .patch-note-changes {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .patch-note-change {
          padding: 4px 0;
          color: #4a4a4a;
          font-size: 14px;
          line-height: 1.5;
        }

        .patch-note-change:before {
          content: "•";
          color: #667eea;
          font-weight: bold;
          margin-right: 8px;
        }

        .patch-notes-footer {
          padding: 20px;
          border-top: 1px solid #e1e5e9;
          display: flex;
          justify-content: flex-end;
        }

        .patch-notes-confirm {
          background: #667eea;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .patch-notes-confirm:hover {
          background: #5a67d8;
        }

        @media (max-width: 480px) {
          .patch-notes-overlay {
            padding: 10px;
          }

          .patch-notes-modal {
            max-height: 90vh;
          }

          .patch-notes-header,
          .patch-notes-content,
          .patch-notes-footer {
            padding: 15px;
          }

          .patch-note-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default PatchNotesModal;
