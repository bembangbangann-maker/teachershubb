
import React, { useState } from 'react';
import { Student, CommunicationLog } from '../types';
import { toast } from 'react-hot-toast';

interface CommunicationLogFormProps {
    students: Student[];
    onSave: (log: Omit<CommunicationLog, 'id'>) => void;
    onClose: () => void;
}

const CommunicationLogForm: React.FC<CommunicationLogFormProps> = ({ students, onSave, onClose }) => {
    const [studentId, setStudentId] = useState<string>(students[0]?.id || '');
    const [method, setMethod] = useState<'Email' | 'Phone Call' | 'Meeting'>('Email');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!studentId || !notes.trim()) {
            toast.error("Please select a student and write some notes.");
            return;
        }
        onSave({
            studentId,
            method,
            notes,
            date: new Date().toISOString()
        });
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
                <label htmlFor="method" className="block text-sm font-medium text-base-content">Communication Method</label>
                <select 
                    id="method" 
                    value={method} 
                    onChange={e => setMethod(e.target.value as any)}
                    className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                >
                    <option>Email</option>
                    <option>Phone Call</option>
                    <option>Meeting</option>
                </select>
            </div>
            <div>
                <label htmlFor="notes" className="block text-sm font-medium text-base-content">Notes / Summary</label>
                <textarea 
                    id="notes" 
                    rows={6} 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)}
                    className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="e.g., Spoke with Mrs. Dela Cruz about Juan's recent progress in Math..."
                />
            </div>

            <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-base-300">
                <button type="button" onClick={onClose} className="bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Cancel
                </button>
                <button type="submit" className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Save Log
                </button>
            </div>
        </form>
    );
};

export default CommunicationLogForm;
