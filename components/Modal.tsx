
import React, { ReactNode } from 'react';
import { XIcon } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className={`bg-base-200 rounded-lg shadow-xl w-full ${maxWidth} relative animate-fade-in-up z-50 flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-base-300 flex-shrink-0">
          <h3 className="text-xl md:text-2xl font-bold text-base-content">{title}</h3>
          <button onClick={onClose} className="text-base-content hover:text-white" aria-label="Close modal">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Modal;
