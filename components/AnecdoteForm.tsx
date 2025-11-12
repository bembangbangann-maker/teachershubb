

import React, { useState } from 'react';
import { Student, Anecdote } from '../types';
import { rephraseAnecdote } from '../services/geminiService';
import { toast } from 'react-hot-toast';
import { RefreshCwIcon, SparklesIcon } from './icons';

interface AnecdoteFormProps {
    students: Student[];
    onSave: (anecdote: Omit<Anecdote, 'id'>) => void;
    onClose: () => void;
    anecdoteToEdit?: Anecdote;
}

const AnecdoteForm: React.FC<AnecdoteFormProps> = ({ students, onSave, onClose }) => {
    const [studentId, setStudentId] = useState<string>(students[0]?.id || '');
    const [observation, setObservation] = useState('');
    const [tags, setTags] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleRephrase = async (mode: 'correct' | 'rephrase') => {
        if (!observation.trim()) {
            toast.error("Please enter an observation first.");
            return;
        }
        setIsProcessing(true);
        try {
            const revisedText = await rephraseAnecdote(observation, mode);
            setObservation(revisedText);
            toast.success(`Text ${mode}ed successfully!`);
        } catch (err) {
            let message = "An unknown error occurred during rephrasing.";
            if (err instanceof Error) {
                message = err.message;
            }
            toast.error(message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!studentId || !observation.trim()) {
            toast.error("Please select a student and write an observation.");
            return;
        }
        onSave({
            studentId,
            observation,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            date: new Date().toISOString()
        })
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="student" className="block text-sm font-medium text-base-content">Student</label>
                <select 
                    id="student" 
                    value={studentId} 
                    onChange={e => setStudentId(e.target.value)}
                    className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                    disabled={students.length === 0}
                >
                    {students.length > 0 ? students.map(s => (
                        <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>
                    )) : <option>Please add a student first</option>}
                </select>
            </div>
            <div>
                <label htmlFor="observation" className="block text-sm font-medium text-base-content">Observation</label>
                <textarea 
                    id="observation" 
                    rows={6} 
                    value={observation} 
                    onChange={e => setObservation(e.target.value)}
                    className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                />
            </div>
            <div className="flex items-center justify-start gap-2">
                <button type="button" onClick={() => handleRephrase('correct')} disabled={isProcessing} className="flex items-center text-sm bg-secondary hover:bg-secondary-focus text-white font-semibold py-1.5 px-3 rounded-md transition-colors disabled:opacity-50">
                   {isProcessing ? <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin"/> : <SparklesIcon className="w-4 h-4 mr-2"/>}
                    Correct Grammar
                </button>
                 <button type="button" onClick={() => handleRephrase('rephrase')} disabled={isProcessing} className="flex items-center text-sm bg-secondary hover:bg-secondary-focus text-white font-semibold py-1.5 px-3 rounded-md transition-colors disabled:opacity-50">
                    {isProcessing ? <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin"/> : <SparklesIcon className="w-4 h-4 mr-2"/>}
                    Rephrase Text
                </button>
            </div>
             <div>
                <label htmlFor="tags" className="block text-sm font-medium text-base-content">Tags (comma-separated)</label>
                <input
                    id="tags"
                    type="text"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="e.g., excellent_participation, distracted"
                />
            </div>

            <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-base-300">
                <button type="button" onClick={onClose} className="bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Cancel
                </button>
                <button type="submit" className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Save Record
                </button>
            </div>
        </form>
    );
};

export default AnecdoteForm;