import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Header from './Header';
import { FileTextIcon, DownloadIcon } from './icons';
import SF2 from './SF2';
import { Student } from '../types';
import { toast } from 'react-hot-toast';
import { useAppContext } from '../contexts/AppContext';
import { docxService } from '../services/docxService';

const Forms: React.FC = () => {
  const { students, settings, uiState, updateUiState, attendance } = useAppContext();
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentUTCDate, setCurrentUTCDate] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  
  const { selectedForm, selectedBatchId } = uiState.forms;

  useEffect(() => {
    const savedMonth = localStorage.getItem('formsPageMonth');
    if (savedMonth) {
        try {
            setCurrentUTCDate(new Date(savedMonth));
        } catch (e) {
            console.error("Failed to parse formsPageMonth from localStorage", e);
        }
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('formsPageMonth', currentUTCDate.toISOString());
  }, [currentUTCDate]);

  const setSelectedForm = (form: string | null) => {
    updateUiState({ forms: { ...uiState.forms, selectedForm: form }});
  };
  const setSelectedBatchId = (id: string) => {
    updateUiState({ forms: { ...uiState.forms, selectedBatchId: id } });
  };

  const batches = useMemo(() => {
    const batchMap = new Map<string, { fileName: string; representativeStudent?: Student }>();
    students.forEach(student => {
        if (student.importBatchId && !batchMap.has(student.importBatchId)) {
            batchMap.set(student.importBatchId, {
                fileName: student.importFileName || 'Unknown File',
                representativeStudent: student
            });
        }
    });
    return Array.from(batchMap.entries()).map(([id, data]) => {
        const { gradeLevel, section } = data.representativeStudent || {};
        const name = (gradeLevel && section) 
            ? `${gradeLevel} - ${section} (from ${data.fileName})` 
            : `Import from ${data.fileName}`;
        return { id, name };
    });
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!selectedBatchId) return [];
    return students.filter(s => s.importBatchId === selectedBatchId);
  }, [students, selectedBatchId]);

  const handleDownloadDocx = async () => {
    if (!selectedForm || !selectedBatchId) {
        toast.error("Please select a form and a batch first.");
        return;
    }
    
    setIsDownloading(true);
    const toastId = toast.loading('Generating DOCX...');
    
    try {
        if (selectedForm === 'SF2') {
             await docxService.generateSF2Docx(filteredStudents, attendance, settings, currentUTCDate);
        }
        toast.success('DOCX downloaded successfully!', { id: toastId });

    } catch (error) {
        console.error("Error generating DOCX:", error);
        toast.error('Failed to generate DOCX.', { id: toastId });
    } finally {
        setIsDownloading(false);
    }
  };

  const renderSelectedForm = () => {
    if (!selectedForm) return null;

    let formComponent;

    const batchSelector = (
        <div className="mb-4 print-hide">
            <label htmlFor="class-filter" className="text-sm font-medium text-base-content mr-2">Show Form for Batch:</label>
            <select
                id="class-filter"
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="bg-base-200 border border-base-300 rounded-md py-2 px-3 text-base-content focus:outline-none focus:ring-primary focus:border-primary"
            >
                <option value="">Select an import batch...</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
         </div>
    );
    
    const noBatchSelectedMessage = (
        <div className="text-center p-12 bg-base-200 text-base-content rounded-lg border-2 border-dashed border-base-300">
            <h3 className="text-xl font-semibold">Please select an import batch to generate the {selectedForm} form.</h3>
        </div>
    );


    switch(selectedForm) {
      case 'SF2':
        formComponent = (
            <div>
                 {batchSelector}
                 {selectedBatchId ? <SF2 schoolSettings={settings} students={filteredStudents} currentUTCDate={currentUTCDate} setCurrentUTCDate={setCurrentUTCDate}/> : noBatchSelectedMessage}
            </div>
        )
        break;
      default:
        return null;
    }

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-6 print-hide">
                 <button onClick={() => setSelectedForm(null)} className="text-primary hover:underline">
                    &larr; Back to Form Selection
                </button>
                <button onClick={handleDownloadDocx} className="flex items-center bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50" disabled={!selectedBatchId || isDownloading}>
                    <DownloadIcon className="w-5 h-5 mr-2"/>
                    {isDownloading ? 'Generating...' : 'Download as DOCX'}
                </button>
            </div>
            <div id="printable-form" className="overflow-x-auto">
                {formComponent}
            </div>
        </div>
    )
  };


  return (
    <div className="min-h-screen">
      <Header title="Official Forms Assistant" />
      {selectedForm ? renderSelectedForm() : (
          <div className="p-4 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print-hide">
                <button 
                    onClick={() => setSelectedForm('SF2')}
                    className="text-left bg-base-200 p-6 rounded-xl shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:-translate-y-1"
                >
                    <FileTextIcon className="w-12 h-12 text-primary mb-4" />
                    <h2 className="text-xl font-bold text-base-content">School Form 2 (SF2)</h2>
                    <p className="text-base-content mt-1">Daily Attendance Report of Learners</p>
                </button>
                <div className="text-left bg-base-200/50 p-6 rounded-xl shadow-lg relative cursor-not-allowed">
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">Coming Soon</div>
                    <FileTextIcon className="w-12 h-12 text-gray-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-400">School Form 9 (SF9)</h2>
                    <p className="text-gray-500 mt-1">Learner's Progress Report Card</p>
                </div>
                 <div className="text-left bg-base-200/50 p-6 rounded-xl shadow-lg relative cursor-not-allowed">
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">Coming Soon</div>
                    <FileTextIcon className="w-12 h-12 text-gray-500 mb-4" />
                    <h2 className="text-xl font-bold text-gray-400">School Form 10 (SF10)</h2>
                    <p className="text-gray-500 mt-1">Learner's Permanent Academic Record</p>
                </div>
              </div>
            </div>
      )}
    </div>
  );
};

export default Forms;