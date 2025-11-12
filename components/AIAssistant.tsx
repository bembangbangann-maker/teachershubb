import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '../contexts/AppContext';
import { generateDlpContent, generateQuizContent, generateRubricForActivity, generateDllContent } from '../services/geminiService';
import { DlpContent, GeneratedQuiz, QuizType, DlpRubricItem, GeneratedQuizSection, DllContent, DlpProcedure } from '../types';
import Header from './Header';
import { SparklesIcon, DownloadIcon } from './icons';
import { docxService } from '../services/docxService';

const TabButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button onClick={onClick} className={`px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${isActive ? 'border-primary text-primary' : 'border-transparent text-base-content/70 hover:text-base-content'}`}>
        {label}
    </button>
);

const InputField: React.FC<{ id: string, label: string, value: string, onChange: any, type?: string, required?: boolean, placeholder?: string }> = ({ id, label, value, onChange, type = 'text', required = false, placeholder='' }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-base-content mb-1">{label}{required && <span className="text-error">*</span>}</label>
        <input type={type} id={id} value={value} onChange={onChange} required={required} placeholder={placeholder} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10 text-base-content" />
    </div>
);

const TextAreaField: React.FC<{ id: string, label: string, value: string, onChange: any, rows?: number, required?: boolean, placeholder?: string }> = ({ id, label, value, onChange, rows = 3, required = false, placeholder='' }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-base-content mb-1">{label}{required && <span className="text-error">*</span>}</label>
        <textarea id={id} value={value} onChange={onChange} rows={rows} required={required} placeholder={placeholder} className="w-full bg-base-100 border border-base-300 rounded-md p-2 text-base-content" />
    </div>
);

const gradeLevels = ['Kindergarten', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const subjectAreas = {
  "Elementary (K-6)": ["Kindergarten (Domains)", "Mother Tongue", "Filipino", "English", "Mathematics", "Science", "Araling Panlipunan (AP)", "Edukasyon sa Pagpapakatao (EsP)", "Music", "Arts", "Physical Education (PE)", "Health", "Edukasyong Pantahanan at Pangkabuhayan (EPP)"],
  "Junior High School (Grades 7-10)": ["Filipino", "English", "Mathematics", "Science", "Araling Panlipunan (AP)", "Edukasyon sa Pagpapakatao (EsP)", "Technology and Livelihood Education (TLE)", "Music", "Arts", "Physical Education (PE)", "Health"],
  "Senior High School - Core (Grades 11-12)": ["21st Century Literature from the Philippines and the World", "Contemporary Philippine Arts from the Regions", "Earth and Life Science", "General Mathematics", "Introduction to the Philosophy of the Human Person", "Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino", "Media and Information Literacy", "Oral Communication in Context", "Pagbasa at Pagsusuri ng Iba't Ibang Teksto Tungo sa Pananaliksik", "Personal Development", "Physical Education and Health", "Physical Science", "Reading and Writing Skills", "Statistics and Probability", "Understanding Culture, Society and Politics"],
  "Senior High School - Applied (Grades 11-12)": ["Empowerment Technologies", "English for Academic and Professional Purposes", "Entrepreneurship", "Filipino sa Piling Larang", "Practical Research 1", "Practical Research 2"]
};
