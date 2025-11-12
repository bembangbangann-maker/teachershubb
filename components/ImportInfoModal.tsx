

import React from 'react';
import Modal from './Modal';
import { UploadIcon } from './icons';

interface ImportInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

const ImportInfoModal: React.FC<ImportInfoModalProps> = ({ isOpen, onClose, onProceed }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Student Import Instructions" maxWidth="max-w-4xl">
      <div className="space-y-6">
        <p className="text-base-content text-lg">
          You can import your class list from a document file.
        </p>
        
        {/* Document Import */}
        <div className="bg-base-100 p-6 rounded-lg border border-base-300">
          <h4 className="font-semibold text-primary text-xl">Document Import Instructions</h4>
          <p className="text-base-content mt-3">
            Prepare your student list in an <strong className="text-white">.xlsx (Excel)</strong> or <strong className="text-white">.docx (Word)</strong> file.
          </p>
           <p className="text-base-content mt-2">
            Each student should be on a new line. You can also include gender headers like 'MALES' and 'FEMALES' to automatically categorize students.
           </p>
          <h4 className="font-semibold text-white mt-4">Required Format:</h4>
          <pre className="bg-base-300 text-white p-4 rounded-md mt-2 text-sm leading-relaxed whitespace-pre-wrap">
            <code>
              LASTNAME, FIRSTNAME, MIDDLE NAME (Opt), LRN (Opt), GRADE LEVEL (Opt), SECTION (Opt)
            </code>
          </pre>
           <h4 className="font-semibold text-white mt-4">Example with Gender Headers:</h4>
           <pre className="bg-base-300 text-white p-4 rounded-md mt-2 text-sm leading-relaxed whitespace-pre-wrap">
            <code>
              MALES<br />
              DELA CRUZ, JUAN, Santos, 123456789012, 9, Fairness<br />
              REYES, PEDRO, Cruz<br />
              ...<br /><br />
              FEMALES<br />
              SANTOS, MARIA, Garcia<br />
              ...
            </code>
          </pre>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-base-300">
            <button onClick={onClose} className="bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Cancel
            </button>
            <button onClick={onProceed} className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center">
                <UploadIcon className="w-5 h-5 mr-2" />
                Proceed to Upload
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportInfoModal;