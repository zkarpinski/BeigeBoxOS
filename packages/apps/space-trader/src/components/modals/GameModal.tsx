import React from 'react';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const GameModal: React.FC<GameModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 1)',
        display: 'flex',
        alignItems: 'flex-start',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '96%',
          maxWidth: '300px',
          height: 'calc(100% - 4px)',
          background: '#fff',
          border: '2px solid #330099',
          borderRadius: '4px',
          overflow: 'hidden',
          marginTop: '2px',
          marginLeft: '2px',
          marginRight: '2px',
          marginBottom: '2px',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: '#330099',
            color: '#fff',
            padding: '4px 8px',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            flexShrink: 0,
          }}
        >
          {title}
        </div>
        <div
          style={{
            padding: '12px',
            color: '#000',
            fontSize: '13px',
            lineHeight: '1.4',
            fontFamily: "'MS Sans Serif', Tahoma, sans-serif",
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          <div style={{ flex: 1 }}>{children}</div>
          {footer && (
            <div
              style={{ marginTop: '20px', display: 'flex', justifyContent: 'left', flexShrink: 0 }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
