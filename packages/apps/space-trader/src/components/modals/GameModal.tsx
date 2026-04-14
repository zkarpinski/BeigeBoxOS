import React from 'react';

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  titleRight?: React.ReactNode;
}

export const GameModal: React.FC<GameModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  titleRight,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
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
          width: '99%',
          maxWidth: '300px',
          height: 'calc(100% - 4px)',
          background: '#fff',
          border: '3px solid #330099',
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
            padding: '1px 2px',
            fontWeight: 'bold',
            fontSize: '14px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Left spacer mirrors right slot to keep title visually centered */}
          <div style={{ flex: '0 0 24px' }} />
          <span style={{ flex: 1, textAlign: 'center' }}>{title}</span>
          <div
            style={{
              flex: '0 0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            {titleRight}
          </div>
        </div>
        <div
          style={{
            padding: '5px',
            color: '#000',
            fontSize: '13px',
            lineHeight: '1.4',
            fontFamily: "'MS Sans Serif', Tahoma, sans-serif",
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'hidden',
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
