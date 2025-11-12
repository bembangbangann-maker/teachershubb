import React, { useState } from 'react';
import Modal from './Modal';
import { GradeType } from '../types';
import { toast } from 'react-hot-toast';

interface AddGradeItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: { type: GradeType; maxScore: number; date: string }) => void;
}

const AddGradeItemModal: React.FC<AddGradeItemModalProps> = ({ isOpen, onClose, onSave }) => {
  const [type, setType] = useState<GradeType>('Quiz');
  const [maxScore, setMaxScore] = useState('100');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const scoreNum = parseInt(maxScore, 10);
    if (isNaN(scoreNum) || scoreNum <= 0) {
      toast.error("Maximum score must be a positive number.");
      return;
    }
    onSave({ type, maxScore: scoreNum, date });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Grade Item">
      <form onSubmit={handleSave} className="space-y-4">
        <div>
            <label htmlFor="type" className="block text-sm font-medium text-base-content">Type</label>
            <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as GradeType)}
                className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            >
                <option>Quiz</option>
                <option>Exam</option>
                <option>Project</option>
                <option>Assignment</option>
                <option>Performance Task</option>
            </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="maxScore" className="block text-sm font-medium text-base-content">Maximum Score</label>
                <input
                  id="maxScore"
                  type="number"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  required
                />
            </div>
            <div>
                <label htmlFor="date" className="block text-sm font-medium text-base-content">Date</label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  required
                />
            </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-base-300 mt-6">
            <button type="button" onClick={onClose} className="bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
              Add Item
            </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddGradeItemModal;
