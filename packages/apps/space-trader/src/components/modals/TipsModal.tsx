import React from 'react';
import { GameModal } from './GameModal';

interface TipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const TipsModal: React.FC<TipsModalProps> = ({
  isOpen,
  onClose,
  title = 'Tips',
  children,
}) => {
  return (
    <GameModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <button
          className="palm-btn"
          style={{ padding: '2px 20px', borderRadius: '12px' }}
          onClick={onClose}
        >
          Done
        </button>
      }
    >
      {children}
    </GameModal>
  );
};
