

import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  confirmButtonClassName?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = (props) => {
  const { isOpen, onClose, onConfirm, title, message } = props;
  const confirmButtonText = props.confirmButtonText || 'Confirm Delete';
  const confirmButtonClassName = props.confirmButtonClassName || 'bg-error hover:bg-red-700';

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div>
        <p className="text-base-content mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className={`${confirmButtonClassName} text-white font-bold py-2 px-4 rounded-lg transition-colors`}>
            {confirmButtonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;