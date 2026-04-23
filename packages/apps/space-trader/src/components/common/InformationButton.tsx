import React from 'react';

interface InformationButtonProps {
  onClick: () => void;
  style?: React.CSSProperties;
}

export const InformationButton: React.FC<InformationButtonProps> = ({ onClick, style }) => {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute',
        right: '4px',
        width: '16px',
        height: '16px',
        background: '#fff',
        color: '#1a1a8c',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        fontFamily: "'Times New Roman', Times, serif",
        cursor: 'pointer',
        ...style,
      }}
    >
      i
    </div>
  );
};
