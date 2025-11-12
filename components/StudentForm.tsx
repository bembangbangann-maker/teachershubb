import React, { useState, useEffect } from 'react';
import { Student } from '../types';

interface StudentFormProps {
  onSave: (student: Omit<Student, 'id'>) => void;
  onClose: () => void;
  studentToEdit?: Student | null;
  defaultGradeLevel?: string;
  defaultSection?: string;
}

const StudentForm: React.FC<StudentFormProps> = ({ onSave, onClose, studentToEdit, defaultGradeLevel, defaultSection }) => {
  const [lrn, setLrn] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | 'Unspecified'>('Unspecified');
  const [contactInfo, setContactInfo] = useState('');
  const [gradeLevel, setGradeLevel] = useState(defaultGradeLevel || '');
  const [section, setSection] = useState(defaultSection || '');
  const [lrnError, setLrnError] = useState('');

  useEffect(() => {
    if (studentToEdit) {
      setLrn(studentToEdit.lrn);
      setFirstName(studentToEdit.firstName);
      setLastName(studentToEdit.lastName);
      setMiddleName(studentToEdit.middleName || '');
      setGender(studentToEdit.gender || 'Unspecified');
      setContactInfo(studentToEdit.contactInfo || '');
      setGradeLevel(studentToEdit.gradeLevel || '');
      setSection(studentToEdit.section || '');
    }
  }, [studentToEdit]);

  const validateLrn = (value: string) => {
    if (value && !/^\d{12}$/.test(value)) {
      setLrnError('LRN must be exactly 12 digits.');
    } else {
      setLrnError('');
    }
  };

  const handleLrnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLrn(value);
    validateLrn(value);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateLrn(lrn);
    if (lrnError || !firstName || !lastName) return;

    onSave({ lrn, firstName, middleName, lastName, contactInfo, gender, gradeLevel, section });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="lrn" className="block text-sm font-medium text-base-content">Learner Reference Number (LRN)</label>
        <input
          id="lrn"
          type="text"
          value={lrn}
          onChange={handleLrnChange}
          maxLength={12}
          className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          required
        />
        {lrnError && <p className="text-sm text-error mt-1">{lrnError}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-base-content">First Name</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="middleName" className="block text-sm font-medium text-base-content">Middle Name (Optional)</label>
            <input
              id="middleName"
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
      </div>
       <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-base-content">Last Name</label>
        <input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          required
        />
      </div>
       <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="gradeLevel" className="block text-sm font-medium text-base-content">Grade Level</label>
              <input
                id="gradeLevel"
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="e.g., 7"
              />
            </div>
            <div>
              <label htmlFor="section" className="block text-sm font-medium text-base-content">Section</label>
              <input
                id="section"
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="e.g., Ruby"
              />
            </div>
      </div>
       <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-base-content">Gender</label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              >
                <option value="Unspecified">Unspecified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="contactInfo" className="block text-sm font-medium text-base-content">Parent's Email (for notifications)</label>
              <input
                id="contactInfo"
                type="email"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="e.g., parent@email.com"
              />
            </div>
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t border-base-300 mt-6">
        <button type="button" onClick={onClose} className="bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Cancel
        </button>
        <button type="submit" className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Save Student
        </button>
      </div>
    </form>
  );
};

export default StudentForm;