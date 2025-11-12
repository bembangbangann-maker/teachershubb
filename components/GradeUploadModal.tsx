

import React, { useState, useRef, useCallback } from 'react';
import Modal from './Modal';
import CameraCapture from './CameraCapture';
import { extractGradesFromImage } from '../services/geminiService';
import { Student, Grade, ExtractedGrade, Quarter, GradeType } from '../types';
import { UploadIcon, CameraIcon, SparklesIcon } from './icons';
import { toast } from 'react-hot-toast';
import { useAppContext } from '../contexts/AppContext';

interface GradeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type View = 'select' | 'upload' | 'camera' | 'confirm' | 'processing';

const GradeUploadModal: React.FC<GradeUploadModalProps> = ({ isOpen, onClose }) => {
  const { students, addGrades } = useAppContext();
  const [view, setView] = useState<View>('select');
  const [error, setError] = useState<string | null>(null);
  const [extractedGrades, setExtractedGrades] = useState<ExtractedGrade[]>([]);
  const [formState, setFormState] = useState({ subject: '', type: 'Quiz' as GradeType, quarter: 1 as Quarter, date: new Date().toISOString().split('T')[0] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setView('select');
    setError(null);
    setExtractedGrades([]);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        processImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCameraCapture = (base64String: string) => {
      processImage(base64String);
  }

  const processImage = async (base64String: string) => {
    setView('processing');
    setError(null);
    try {
        const results = await extractGradesFromImage(base64String, students);
        if(results.length === 0) {
            toast.error("AI couldn't find any grades. Please try a clearer image.");
            setView('select');
            return;
        }
        setExtractedGrades(results);
        setView('confirm');
    } catch(err) {
        let errorMessage = 'An unknown error occurred.';
        if (err instanceof Error) {
            errorMessage = err.message;
        }
        setError(errorMessage);
        toast.error(errorMessage);
        setView('select');
    }
  };

  const handleSaveGrades = () => {
    const studentMap = new Map(students.map(s => [s.firstName.toLowerCase() + " " + s.lastName.toLowerCase(), s.id]));

    const newGrades: Omit<Grade, 'id'>[] = extractedGrades.map(g => {
        const studentId = studentMap.get(g.studentName.toLowerCase()) || null;
        if (!studentId) {
            console.warn(`Could not find student: ${g.studentName}. Skipping.`);
            return null;
        }
        return {
            studentId,
            ...formState,
            score: g.score,
            maxScore: g.maxScore,
        }
    }).filter((g): g is Omit<Grade, 'id'> => g !== null);
    
    if (newGrades.length > 0) {
        addGrades(newGrades);
        toast.success(`${newGrades.length} grades added successfully!`);
    }
    handleClose();
  };

  const renderContent = () => {
    switch (view) {
      case 'processing':
        return (
          <div className="text-center p-8">
            <SparklesIcon className="w-12 h-12 text-primary mx-auto animate-pulse" />
            <p className="mt-4 text-lg">AI is extracting grades...</p>
            <p className="text-sm text-base-content">This may take a moment.</p>
          </div>
        );
      case 'camera':
        return <CameraCapture onCapture={handleCameraCapture} onClose={() => setView('select')} />;
      case 'confirm':
        return (
            <div>
                <p className="text-sm text-yellow-300 bg-yellow-900/50 p-3 rounded-md mb-4">
                    Please review the extracted grades and fill in the assessment details below. The AI will try to match student names, but verify them before saving.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                     <div>
                        <label className="block text-sm font-medium text-base-content">Subject</label>
                        <input type="text" value={formState.subject} onChange={e => setFormState({...formState, subject: e.target.value})} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary" placeholder="e.g., Math"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-base-content">Date</label>
                        <input type="date" value={formState.date} onChange={e => setFormState({...formState, date: e.target.value})} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-base-content">Quarter</label>
                        <select value={formState.quarter} onChange={e => setFormState({...formState, quarter: Number(e.target.value) as Quarter})} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
                            <option value={1}>1st</option>
                            <option value={2}>2nd</option>
                            <option value={3}>3rd</option>
                            <option value={4}>4th</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-base-content">Type</label>
                        <select value={formState.type} onChange={e => setFormState({...formState, type: e.target.value as GradeType})} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary">
                            <option>Quiz</option>
                            <option>Exam</option>
                            <option>Project</option>
                            <option>Assignment</option>
                            <option>Performance Task</option>
                        </select>
                    </div>
                </div>
                <div className="max-h-60 overflow-y-auto bg-base-100 p-2 rounded-md">
                    <table className="w-full text-sm">
                        <thead className="text-left">
                            <tr>
                                <th className="p-2">Student Name</th>
                                <th className="p-2">Score</th>
                                <th className="p-2">Max Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {extractedGrades.map((grade, i) => (
                                <tr key={i} className="border-t border-base-300">
                                    <td className="p-2 text-white">{grade.studentName}</td>
                                    <td className="p-2">{grade.score}</td>
                                    <td className="p-2">{grade.maxScore}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-base-300">
                    <button type="button" onClick={() => setView('select')} className="bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
                      Back
                    </button>
                    <button type="button" onClick={handleSaveGrades} className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
                      Confirm & Save Grades
                    </button>
                </div>
            </div>
        );
      default: // select
        return (
          <div className="text-center">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
            <p className="mb-6">Add grades by taking a photo of a grade sheet or uploading an image file.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-40 h-32 bg-base-300 hover:bg-primary hover:text-white rounded-lg transition-colors p-4"
              >
                <UploadIcon className="w-12 h-12 mb-2" />
                <span className="font-semibold">Upload Image</span>
              </button>
              <button
                onClick={() => setView('camera')}
                className="flex flex-col items-center justify-center w-40 h-32 bg-base-300 hover:bg-primary hover:text-white rounded-lg transition-colors p-4"
              >
                <CameraIcon className="w-12 h-12 mb-2" />
                <span className="font-semibold">Use Camera</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Grades with AI">
      {renderContent()}
    </Modal>
  );
};

export default GradeUploadModal;