import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { Student, AttendanceStatus } from '../types';
import Header from './Header';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import StudentForm from './StudentForm';
import ImportInfoModal from './ImportInfoModal';
import AttendanceGrid from './AttendanceGrid';
import { PlusIcon, UploadIcon, DownloadIcon, SparklesIcon } from './icons';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { useAppContext } from '../contexts/AppContext';
import { dataService } from '../services/dataService';
import { docxService } from '../services/docxService';
import { excelService } from '../services/excelService';
import { processAttendanceCommand } from '../services/geminiService';

const Students: React.FC = () => {
  const { students, attendance, settings, addStudent, updateStudent, deleteStudent, batchAddStudents, uiState, updateUiState, batchUpdateAttendance } = useAppContext();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isImportInfoModalOpen, setIsImportInfoModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiCommand, setAiCommand] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiDate, setAiDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { selectedBatchId } = uiState.roster;
  const setSelectedBatchId = (id: string) => {
    updateUiState({
      roster: { ...uiState.roster, selectedBatchId: id }
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentUTCDate, setCurrentUTCDate] = useState(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });

  useEffect(() => {
    const savedState = localStorage.getItem('studentsPageState');
    if (savedState) {
        try {
            const { savedMonth, savedAiCommand, savedAiDate } = JSON.parse(savedState);
            if (savedMonth) setCurrentUTCDate(new Date(savedMonth));
            if (savedAiCommand) setAiCommand(savedAiCommand);
            if (savedAiDate) setAiDate(savedAiDate);
        } catch (e) {
            console.error("Failed to parse studentsPageState from localStorage", e);
        }
    }
  }, []);

  useEffect(() => {
    const stateToSave = {
        savedMonth: currentUTCDate.toISOString(),
        savedAiCommand: aiCommand,
        savedAiDate: aiDate,
    };
    localStorage.setItem('studentsPageState', JSON.stringify(stateToSave));
  }, [currentUTCDate, aiCommand, aiDate]);

  const changeMonth = useCallback((delta: number) => {
    setCurrentUTCDate(prev => {
      const newDate = new Date(prev.getTime());
      newDate.setUTCMonth(newDate.getUTCMonth() + delta);
      return newDate;
    });
  }, []);

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
    const newBatches = Array.from(batchMap.entries()).map(([id, data]) => {
        const { gradeLevel, section } = data.representativeStudent || {};
        const name = (gradeLevel && section) 
            ? `${gradeLevel} - ${section} (from ${data.fileName})` 
            : `Import from ${data.fileName}`;
        return { id, name };
    });
    return newBatches;
  }, [students]);
  
  const currentClassInfo = useMemo(() => {
    if (!selectedBatchId) return null;
    const studentInClass = students.find(s => s.importBatchId === selectedBatchId);
    return {
        gradeLevel: studentInClass?.gradeLevel || '',
        section: studentInClass?.section || '',
        importFileName: studentInClass?.importFileName || 'Manual Entry'
    };
}, [selectedBatchId, students]);

  const filteredStudents = useMemo(() => {
    if (!selectedBatchId) {
        return [];
    }
    return students.filter(s => s.importBatchId === selectedBatchId);
  }, [students, selectedBatchId]);
  
  const handleOpenAddModal = () => {
    setStudentToEdit(null);
    setIsFormModalOpen(true);
  }
  
  const handleOpenEditModal = (student: Student) => {
    setStudentToEdit(student);
    setIsFormModalOpen(true);
  }

  const handleSaveStudent = (studentData: Omit<Student, 'id'>) => {
    if (studentToEdit) {
        updateStudent(studentToEdit.id, studentData);
        toast.success('Student updated successfully!');
    } else {
        if (!selectedBatchId || !currentClassInfo) {
            toast.error("Please select a class before adding a new student.");
            return;
        }
        addStudent({
            ...studentData,
            importBatchId: selectedBatchId,
            importFileName: currentClassInfo.importFileName,
            gradeLevel: studentData.gradeLevel || currentClassInfo.gradeLevel,
            section: studentData.section || currentClassInfo.section,
        });
        toast.success('Student added successfully!');
    }
    setIsFormModalOpen(false);
    setStudentToEdit(null);
  };

  const handleImportClick = () => {
    setIsImportInfoModalOpen(true);
  };
  
  const handleProceedToUpload = () => {
    setIsImportInfoModalOpen(false);
    fileInputRef.current?.click();
  };
  
  const openDeleteConfirmation = (student: Student) => {
    setStudentToDelete(student);
    setIsConfirmModalOpen(true);
  };

  const handleDeleteConfirmed = () => {
    if (studentToDelete) {
      deleteStudent(studentToDelete.id);
      toast.success(`Student ${studentToDelete.firstName} ${studentToDelete.lastName} deleted.`);
    }
    setIsConfirmModalOpen(false);
    setStudentToDelete(null);
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.docx')) {
        toast.error('Unsupported file type. Please upload an Excel (.xlsx) or Word (.docx) file.');
        event.target.value = '';
        return;
    }

    const toastId = toast.loading(`Processing ${file.name}...`);

    try {
        let textContent = '';

        if (fileName.endsWith('.xlsx')) {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                 throw new Error("The Excel file seems to be empty or corrupted.");
            }
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            textContent = XLSX.utils.sheet_to_csv(worksheet).trim();
        } else { // .docx
            const buffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer: buffer });
            textContent = result.value.trim();
        }
        
        if (!textContent) {
            throw new Error("Could not extract any text. The file might be empty or in an unsupported format.");
        }
        
        const studentsToAdd = dataService.parseStudentFileContent(textContent);

        if (studentsToAdd.length > 0) {
            batchAddStudents(studentsToAdd, file.name);
            toast.success(`${studentsToAdd.length} students imported successfully!`, { id: toastId });
        } else {
            toast.error("No valid student names found. Please check the file's format (e.g., LASTNAME, FIRSTNAME) and content.", { id: toastId });
        }

    } catch (err) {
        toast.dismiss(toastId);
        let message = "An unknown error occurred during processing.";
        if (err instanceof Error) message = err.message;
        toast.error(message);
    } finally {
        event.target.value = '';
    }
  };
  
  const handleDownloadDocx = async () => {
      if (!selectedBatchId) {
          toast.error("Please select a batch first.");
          return;
      }
      setIsDownloading(true);
      const toastId = toast.loading('Generating DOCX...');
      try {
          await docxService.generateAttendanceDocx(filteredStudents, attendance, currentUTCDate, settings);
          toast.success('DOCX downloaded successfully!', { id: toastId });
      } catch(error) {
          console.error("Error generating DOCX:", error);
          toast.error('Failed to generate DOCX.', { id: toastId });
      } finally {
          setIsDownloading(false);
      }
  }

  const handleDownloadXlsx = () => {
    if (!selectedBatchId || filteredStudents.length === 0) {
        toast.error("Please select a batch with students first.");
        return;
    }
    setIsDownloading(true);
    const toastId = toast.loading('Generating XLSX...');
    try {
        excelService.generateAttendanceXlsx(filteredStudents, attendance, currentUTCDate);
        toast.success('XLSX downloaded successfully!', { id: toastId });
    } catch(error) {
        console.error("Error generating XLSX:", error);
        toast.error('Failed to generate XLSX.', { id: toastId });
    } finally {
        setIsDownloading(false);
    }
  }
  
  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiCommand.trim() || !selectedBatchId) return;

    setIsAiProcessing(true);
    const toastId = toast.loading("AI is processing your command...");

    try {
      const result = await processAttendanceCommand(aiCommand, filteredStudents);

      if (!result || result.studentIds.length === 0) {
        toast.error("AI could not determine which students to update. Please try rephrasing your command.", { id: toastId });
        return;
      }

      const updates = result.studentIds.map(studentId => ({
        studentId,
        date: aiDate,
        status: result.status,
      }));
      
      batchUpdateAttendance(updates);

      toast.success(`AI updated attendance for ${result.studentIds.length} student(s)!`, { id: toastId });
      setIsAiModalOpen(false);
      setAiCommand('');

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        toast.error(message, { id: toastId });
    } finally {
        setIsAiProcessing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Class Roster" />
      <div className="p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 print-hide">
           <div className="w-full md:w-auto">
              <label htmlFor="class-filter" className="text-sm font-medium text-base-content mr-2">Select Import Batch:</label>
              <select
                id="class-filter"
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full bg-base-200 border border-base-300 rounded-md py-2 px-3 text-base-content focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="">Select an import batch...</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
           </div>
           <div className="flex gap-2 flex-wrap justify-center md:justify-end md:gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                className="hidden"
                accept=".xlsx,.docx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
               <div className="flex items-center bg-secondary rounded-lg">
                     <button
                        onClick={handleDownloadDocx}
                        className="flex items-center text-white font-bold py-2 px-4 rounded-l-lg hover:bg-secondary-focus transition-colors disabled:opacity-50"
                        disabled={!selectedBatchId || isDownloading}
                        title="Download as DOCX"
                    >
                        <DownloadIcon className="w-5 h-5 md:mr-2" /> <span className="hidden md:inline">DOCX</span>
                    </button>
                     <div className="h-full w-px bg-base-300"></div>
                     <button
                        onClick={handleDownloadXlsx}
                        className="flex items-center text-white font-bold py-2 px-4 rounded-r-lg hover:bg-secondary-focus transition-colors disabled:opacity-50"
                        disabled={!selectedBatchId || isDownloading}
                        title="Download as XLSX"
                    >
                        <DownloadIcon className="w-5 h-5 md:mr-2" /> <span className="hidden md:inline">XLSX</span>
                    </button>
               </div>
              <button
                onClick={handleImportClick}
                className="flex items-center bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                <UploadIcon className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">Import</span>
              </button>
               <button
                onClick={() => setIsAiModalOpen(true)}
                className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                disabled={!selectedBatchId}
              >
                <SparklesIcon className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">AI Assistant</span>
              </button>
              <button
                onClick={handleOpenAddModal}
                disabled={!selectedBatchId}
                className="flex items-center bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">Add Student</span>
              </button>
            </div>
        </div>
        
        <div id="printable-area">
          {selectedBatchId ? (
              <div className="bg-base-200 shadow-lg rounded-xl overflow-hidden">
                 <AttendanceGrid 
                    students={filteredStudents} 
                    onDeleteStudent={openDeleteConfirmation}
                    onEditStudent={handleOpenEditModal}
                    currentUTCDate={currentUTCDate} 
                    changeMonth={changeMonth} 
                 />
              </div>
          ) : (
              <div className="text-center p-16 bg-base-200 rounded-xl border-2 border-dashed border-base-300 print-hide">
                  <h3 className="text-2xl font-bold text-base-content">Select a Batch</h3>
                  <p className="text-base-content mt-2">Please choose an import batch from the dropdown menu to view and manage attendance.</p>
              </div>
          )}
        </div>
      </div>

      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={studentToEdit ? 'Edit Student' : 'Add New Student'}>
        <StudentForm 
            onSave={handleSaveStudent} 
            onClose={() => setIsFormModalOpen(false)} 
            studentToEdit={studentToEdit}
            defaultGradeLevel={currentClassInfo?.gradeLevel}
            defaultSection={currentClassInfo?.section}
        />
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDeleteConfirmed}
        title="Delete Student"
        message={`Are you sure you want to delete ${studentToDelete?.firstName} ${studentToDelete?.lastName}? All associated grades, attendance, and records will be permanently removed.`}
      />

      <ImportInfoModal 
        isOpen={isImportInfoModalOpen}
        onClose={() => setIsImportInfoModalOpen(false)}
        onProceed={handleProceedToUpload}
      />

      <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title="AI Attendance Assistant">
        <form onSubmit={handleAiSubmit} className="space-y-4">
          <p className="text-sm text-base-content">
            Tell the assistant what to do. For example: "Mark everyone present", "Mark Juan Dela Cruz absent", or "The following are late: Ana, Pedro, Maria".
          </p>
          <div>
            <label htmlFor="ai-date" className="block text-sm font-medium text-base-content mb-1">Date to Update</label>
            <input
                id="ai-date"
                type="date"
                value={aiDate}
                onChange={(e) => setAiDate(e.target.value)}
                className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10"
                required
            />
          </div>
          <div>
            <label htmlFor="ai-command" className="block text-sm font-medium text-base-content mb-1">Command</label>
            <input
              id="ai-command"
              type="text"
              value={aiCommand}
              onChange={(e) => setAiCommand(e.target.value)}
              className="w-full bg-base-100 border border-base-300 rounded-md p-3 focus:ring-primary focus:border-primary"
              placeholder="Enter your command..."
              disabled={isAiProcessing}
              required
            />
          </div>
          <div className="flex justify-end pt-4 border-t border-base-300">
            <button
              type="submit"
              className="flex items-center justify-center bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              disabled={isAiProcessing || !aiCommand.trim()}
            >
              <SparklesIcon className={`w-5 h-5 mr-2 ${isAiProcessing ? 'animate-spin' : ''}`} />
              {isAiProcessing ? 'Processing...' : 'Process Command'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Students;