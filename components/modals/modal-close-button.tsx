import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface ModalCloseButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const ModalCloseButton: React.FC<ModalCloseButtonProps> = ({ onClick, disabled }) => (
  <button
    onClick={onClick}
    className="text-neutral-500 hover:text-neutral-700 disabled:opacity-50"
    disabled={disabled}
    aria-label="Close modal"
  >
    <XMarkIcon className="h-5 w-5" />
  </button>
);