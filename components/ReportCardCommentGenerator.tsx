import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import { generateReportCardComment } from '../services/geminiService';
import { Student, Grade, Anecdote } from '../types';
import { SparklesIcon, ClipboardIcon } from './icons';
import { toast } from 'react-hot-toast';
import { useAppContext } from '../contexts/AppContext';

interface ReportCardCommentGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
}

interface Comment {
    strengths: string;
    areasForImprovement: string;
    closingStatement: string;
}

const ReportCardCommentGenerator: React.FC<ReportCardCommentGeneratorProps> = ({ isOpen, onClose, student }) => {
  const { grades, anecdotes } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState<Comment | null>(null);

  const generateComment = useCallback(async () => {
    if (!student) return;

    try {
      setIsLoading(true);
      setError(null);
      const studentGrades = grades.filter(g => g.studentId === student.id);
      const studentAnecdotes = anecdotes.filter(a => a.studentId === student.id);
      
      const result = await generateReportCardComment(student, studentGrades, studentAnecdotes);
      setComment(result);
      toast.success("AI comment generated!");
    } catch (err) {
      let errorMessage = 'An unknown error occurred.';
      if (err instanceof Error) {
          errorMessage = err.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [student, grades, anecdotes]);

  useEffect(() => {
    if (isOpen) {
      generateComment();
    }
  }, [isOpen, generateComment]);
  
  const handleCopyToClipboard = () => {
    if(comment) {
        const fullComment = `Strengths:\n${comment.strengths}\n\nAreas for Improvement:\n${comment.areasForImprovement}\n\nClosing:\n${comment.closingStatement}`;
        navigator.clipboard.writeText(fullComment);
        toast.success("Comment copied to clipboard!");
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`AI Report Card Comment for ${student.firstName}`}>
      {isLoading && (
        <div className="text-center p-8">
          <SparklesIcon className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="mt-4 text-lg">Generating comment...</p>
          <p className="text-sm text-base-content">The AI is analyzing grades and records.</p>
        </div>
      )}
      {error && (
        <div className="text-center p-8 bg-error/20 rounded-lg">
          <h3 className="font-bold text-lg text-error">Generation Failed</h3>
          <p>{error}</p>
        </div>
      )}
      {!isLoading && !error && comment && (
        <div className="space-y-4">
            <div>
                <h4 className="font-bold text-primary">Strengths</h4>
                <p className="text-base-content bg-base-100 p-3 rounded-md mt-1 whitespace-pre-wrap">{comment.strengths}</p>
            </div>
             <div>
                <h4 className="font-bold text-primary">Areas for Improvement</h4>
                <p className="text-base-content bg-base-100 p-3 rounded-md mt-1 whitespace-pre-wrap">{comment.areasForImprovement}</p>
            </div>
             <div>
                <h4 className="font-bold text-primary">Closing Statement</h4>
                <p className="text-base-content bg-base-100 p-3 rounded-md mt-1 whitespace-pre-wrap">{comment.closingStatement}</p>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-base-300">
                <button onClick={handleCopyToClipboard} className="flex items-center gap-2 bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    <ClipboardIcon className="w-5 h-5" />
                    Copy All
                </button>
                <button onClick={generateComment} className="flex items-center gap-2 bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    <SparklesIcon className="w-5 h-5" />
                    Regenerate
                </button>
            </div>
        </div>
      )}
    </Modal>
  );
};

export default ReportCardCommentGenerator;