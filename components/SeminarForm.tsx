import React, { useState, useEffect } from 'react';
import { ProfessionalDevelopmentLog } from '../types';
import { toast } from 'react-hot-toast';
import { UploadIcon, TrashIcon } from './icons';

interface SeminarFormProps {
  onSave: (log: Omit<ProfessionalDevelopmentLog, 'id'>) => void;
  onClose: () => void;
  logToEdit?: ProfessionalDevelopmentLog | null;
}

const SeminarForm: React.FC<SeminarFormProps> = ({ onSave, onClose, logToEdit }) => {
  const [formData, setFormData] = useState<Omit<ProfessionalDevelopmentLog, 'id'>>({
    title: '',
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    hours: 8,
    type: 'Seminar',
    level: 'School',
    certificateImage: '',
    notes: ''
  });

  useEffect(() => {
    if (logToEdit) {
      setFormData({
        title: logToEdit.title,
        dateFrom: logToEdit.dateFrom,
        dateTo: logToEdit.dateTo,
        hours: logToEdit.hours,
        type: logToEdit.type,
        level: logToEdit.level,
        certificateImage: logToEdit.certificateImage || '',
        notes: logToEdit.notes || '',
      });
    }
  }, [logToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'hours' ? Number(value) : value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, certificateImage: reader.result as string }));
        };
        reader.readAsDataURL(file);
    } else if (file) {
        toast.error("Please select a valid image file (PNG, JPG).");
    }
  };

  const handleRemoveImage = () => {
      setFormData(prev => ({ ...prev, certificateImage: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || formData.hours <= 0) {
        toast.error("Please provide a valid title and number of hours.");
        return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-base-content">Title of Seminar/Training</label>
        <input id="title" name="title" type="text" value={formData.title} onChange={handleChange} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary" required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-base-content">Start Date</label>
          <input id="dateFrom" name="dateFrom" type="date" value={formData.dateFrom} onChange={handleChange} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary" required />
        </div>
        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-base-content">End Date</label>
          <input id="dateTo" name="dateTo" type="date" value={formData.dateTo} onChange={handleChange} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary" required />
        </div>
        <div>
          <label htmlFor="hours" className="block text-sm font-medium text-base-content">Number of Hours</label>
          <input id="hours" name="hours" type="number" min="1" value={formData.hours} onChange={handleChange} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary" required />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-base-content">Type</label>
          <select id="type" name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary h-10">
            <option>Seminar</option><option>Workshop</option><option>Training</option><option>Graduate Studies</option><option>Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="level" className="block text-sm font-medium text-base-content">Level</label>
          <select id="level" name="level" value={formData.level} onChange={handleChange} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary h-10">
            <option>School</option><option>District</option><option>Regional</option><option>National</option><option>International</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-base-content">Notes (Optional)</label>
        <textarea id="notes" name="notes" rows={3} value={formData.notes} onChange={handleChange} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary" />
      </div>

      <div>
        <label className="block text-sm font-medium text-base-content">Certificate Image (Optional)</label>
        <div className="mt-1 flex items-center gap-4">
            <div className="w-48 h-32 bg-base-100 rounded-md flex items-center justify-center border-2 border-dashed border-base-300">
                {formData.certificateImage ? (
                    <img src={formData.certificateImage} alt="Certificate Preview" className="h-full w-full object-contain rounded-md" />
                ) : (
                    <span className="text-xs text-base-content/50">No Image</span>
                )}
            </div>
            <div className="flex flex-col gap-2">
                <input type="file" id="image-upload" accept="image/png, image/jpeg" className="hidden" onChange={handleImageUpload}/>
                <label htmlFor="image-upload" className="cursor-pointer flex items-center justify-center bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg">
                    <UploadIcon className="w-5 h-5 mr-2" />Upload Image
                </label>
                {formData.certificateImage && (
                    <button type="button" onClick={handleRemoveImage} className="flex items-center justify-center bg-error hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg">
                        <TrashIcon className="w-5 h-5 mr-2" />Remove
                    </button>
                )}
            </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-base-300 mt-6">
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

export default SeminarForm;
