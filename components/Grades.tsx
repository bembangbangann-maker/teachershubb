import React, { useMemo } from 'react';
import { Student, Quarter } from '../types';
import Header from './Header';
import { useAppContext } from '../contexts/AppContext';
import EClassRecord from './EClassRecord';
import SummaryOfGrades from './SummaryOfGrades';
import HonorsList from './HonorsList';
import AIPerformanceAnalysis from './AIPerformanceAnalysis';
import { SparklesIcon } from './icons';

const Grades: React.FC = () => {
  const { students, classRecordSettings, uiState, updateUiState, grades, anecdotes } = useAppContext();
  const { selectedBatchId, selectedSubject, selectedQuarter, view } = uiState.grades;

  const setSelectedBatchId = (id: string) => {
    updateUiState({ grades: { ...uiState.grades, selectedBatchId: id, selectedSubject: '' } }); // Reset subject when batch changes
  };
  const setSelectedSubject = (subject: string) => {
    updateUiState({ grades: { ...uiState.grades, selectedSubject: subject } });
  };
  const setSelectedQuarter = (quarter: Quarter) => {
    updateUiState({ grades: { ...uiState.grades, selectedQuarter: quarter } });
  };
  const setView = (v: 'record' | 'summary' | 'honors' | 'analysis') => {
    updateUiState({ grades: { ...uiState.grades, view: v } });
  };

  const subjects = useMemo(() => {
    const subjectSet = new Set<string>();
    classRecordSettings.forEach(setting => {
        if(setting.subject) subjectSet.add(setting.subject);
    });
    return Array.from(subjectSet).sort();
  }, [classRecordSettings]);

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

  const renderContent = () => {
      if (!selectedBatchId) {
          return (
             <div className="text-center p-16 bg-base-200 rounded-xl border-2 border-dashed border-base-300">
                <h3 className="text-2xl font-bold text-base-content">Select a Batch</h3>
                <p className="text-base-content mt-2">Please choose an import batch from the dropdown menu to begin managing grades.</p>
             </div>
          );
      }
      
      if (!selectedSubject.trim()) {
          return (
             <div className="text-center p-16 bg-base-200 rounded-xl border-2 border-dashed border-base-300">
                <h3 className="text-2xl font-bold text-base-content">Enter a Subject</h3>
                <p className="text-base-content mt-2">Please enter a subject name in the input field above.</p>
             </div>
          );
      }

      switch (view) {
        case 'record':
            return <EClassRecord 
                key={`${selectedBatchId}-${selectedSubject}-${selectedQuarter}`}
                students={filteredStudents} 
                batchId={selectedBatchId}
                subject={selectedSubject} 
                quarter={selectedQuarter}
            />;
        case 'honors':
             return <HonorsList
                key={`${selectedBatchId}-${selectedSubject}-${selectedQuarter}-honors`}
                students={filteredStudents}
                batchId={selectedBatchId}
                subject={selectedSubject}
                quarter={selectedQuarter}
            />;
        case 'analysis':
            return <AIPerformanceAnalysis
                key={`${selectedBatchId}-${selectedSubject}-analysis`}
                students={filteredStudents}
                grades={grades.filter(g => filteredStudents.some(s => s.id === g.studentId) && g.subject === selectedSubject)}
                anecdotes={anecdotes.filter(a => filteredStudents.some(s => s.id === a.studentId))}
            />;
        case 'summary':
        default:
             return <SummaryOfGrades
                key={`${selectedBatchId}-${selectedSubject}-summary`}
                students={filteredStudents}
                batchId={selectedBatchId}
                subject={selectedSubject}
            />;
      }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="Grading Sheets" />
      <div className="p-8 flex-grow">
        <div className="flex flex-wrap justify-between items-end gap-4 mb-4">
          {/* Left Side: Selectors */}
          <div className="flex items-end gap-4 flex-wrap">
            <div>
                <label htmlFor="batch-select" className="text-sm font-medium text-base-content block mb-1">Select Import Batch:</label>
                <select
                    id="batch-select"
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="bg-base-200 border border-base-300 rounded-md h-10 px-3 text-base-content focus:outline-none focus:ring-primary focus:border-primary w-full md:w-64"
                >
                    <option value="">Select an import batch...</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>
            <div>
              <label htmlFor="subject-input" className="text-sm font-medium text-base-content block mb-1">Subject:</label>
              <input
                id="subject-input"
                type="text"
                list="subject-list"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-base-200 border border-base-300 rounded-md h-10 px-3 text-base-content focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="e.g., English"
              />
              <datalist id="subject-list">
                {subjects.map(sub => <option key={sub} value={sub} />)}
              </datalist>
            </div>
            <div>
              <label htmlFor="quarter-select" className="text-sm font-medium text-base-content block mb-1">Quarter:</label>
              <select
                id="quarter-select"
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(Number(e.target.value) as Quarter)}
                className="bg-base-200 border border-base-300 rounded-md h-10 px-3 text-base-content focus:outline-none focus:ring-primary focus:border-primary"
                disabled={view === 'summary' || view === 'analysis'}
              >
                <option value={1}>1st</option>
                <option value={2}>2nd</option>
                <option value={3}>3rd</option>
                <option value={4}>4th</option>
              </select>
            </div>
          </div>
          {/* Right Side: View Switcher */}
          <div className="flex items-center bg-base-300 rounded-lg p-1">
             <button onClick={() => setView('record')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${view === 'record' ? 'bg-primary text-white' : 'text-base-content hover:bg-base-100'}`}>
                E-Class Record
            </button>
            <button onClick={() => setView('summary')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${view === 'summary' ? 'bg-primary text-white' : 'text-base-content hover:bg-base-100'}`}>
                Summary of Grades
            </button>
            <button onClick={() => setView('honors')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${view === 'honors' ? 'bg-primary text-white' : 'text-base-content hover:bg-base-100'}`}>
                Honors
            </button>
             <button onClick={() => setView('analysis')} className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors flex items-center gap-2 ${view === 'analysis' ? 'bg-primary text-white' : 'text-base-content hover:bg-base-100'}`}>
                <SparklesIcon className="w-4 h-4" />
                AI Analysis
            </button>
          </div>
        </div>
        
        <div>
            {renderContent()}
        </div>
        
      </div>
    </div>
  );
};

export default Grades;