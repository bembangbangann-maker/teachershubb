import React from 'react';
import { NotebookIcon } from './icons';

// This is a placeholder component. The full functionality is in Records.tsx
const Anecdotes: React.FC = () => {
  return (
    <div className="text-center bg-base-200 p-10 rounded-xl shadow-lg">
        <NotebookIcon className="w-16 h-16 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Anecdotal Records</h2>
        <p className="text-base-content">
            This section is managed through the main "Anecdotal Records" page.
        </p>
    </div>
  );
};

export default Anecdotes;
