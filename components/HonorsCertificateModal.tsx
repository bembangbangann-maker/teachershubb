import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AwardIcon, XIcon, PrinterIcon, UndoIcon, RedoIcon, SendIcon, SparklesIcon } from './icons';
import { useAppContext } from '../contexts/AppContext';
import { Student, HonorsCertificateSettings } from '../types';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import CertificatePreview from './CertificatePreview';
import EmailHonorsCertificateModal from './EmailHonorsCertificateModal';
import Modal from './Modal';
import { generateCertificateContent } from '../services/geminiService';

interface HonorStudentData {
    student: Student;
    generalAvg: number;
    award: string;
}

interface HonorsCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  honorStudents: HonorStudentData[];
  selectedBatchId: string;
}

const FONT_CSS_MAPPING: { [key: string]: string } = { 'font-playfair': '"Playfair Display", serif', 'font-merriweather': '"Merriweather", serif', 'font-great-vibes': '"Great Vibes", cursive', 'font-dancing-script': '"Dancing Script", cursive', 'font-lobster': '"Lobster", cursive', 'font-roboto-slab': '"Roboto Slab", serif', 'font-alegreya': '"Alegreya", serif', 'font-cormorant': '"Cormorant Garamond", serif', 'font-old-standard': '"Old Standard TT", serif', 'font-sacramento': '"Sacramento", cursive', 'font-cinzel': '"Cinzel", serif', 'font-eb-garamond': '"EB Garamond", serif', 'font-tangerine': '"Tangerine", cursive', 'font-pinyon-script': '"Pinyon Script", cursive', 'font-libre-baskerville': '"Libre Baskerville", serif', 'font-arvo': '"Arvo", serif', 'font-alex-brush': '"Alex Brush", cursive', 'font-allura': '"Allura", cursive', 'font-italianno': '"Italianno", cursive', 'font-unifrakturcook': '"UnifrakturCook", cursive', 'font-meddon': '"Meddon", cursive', 'font-im-fell': '"IM Fell English", serif', 'font-bookman': '"Bookman Old Style", serif', };
const FONT_OPTIONS = [ { label: 'Serif (Formal)', options: [ { value: 'font-bookman', label: 'Bookman' }, { value: 'font-old-standard', label: 'Old Standard TT' }, { value: 'font-cinzel', label: 'Cinzel' }, { value: 'font-merriweather', label: 'Merriweather' }, { value: 'font-playfair', label: 'Playfair Display' }, { value: 'font-roboto-slab', label: 'Roboto Slab' }, { value: 'font-eb-garamond', label: 'EB Garamond' }, { value: 'font-libre-baskerville', label: 'Libre Baskerville' }, { value: 'font-im-fell', label: 'IM Fell English' }, { value: 'font-cormorant', label: 'Cormorant Garamond' }, { value: 'font-alegreya', label: 'Alegreya' } ] }, { label: 'Script (Elegant)', options: [ { value: 'font-great-vibes', label: 'Great Vibes' }, { value: 'font-pinyon-script', label: 'Pinyon Script' }, { value: 'font-dancing-script', label: 'Dancing Script' }, { value: 'font-sacramento', label: 'Sacramento' }, { value: 'font-tangerine', label: 'Tangerine' }, { value: 'font-alex-brush', label: 'Alex Brush' }, { value: 'font-allura', label: 'Allura' }, { value: 'font-italianno', label: 'Italianno' } ] }, { label: 'Classic & Decorative', options: [ { value: 'font-arvo', label: 'Arvo' }, { value: 'font-lobster', label: 'Lobster' }, { value: 'font-unifrakturcook', label: 'UnifrakturCook' }, { value: 'font-meddon', label: 'Meddon' } ] } ];
const backgroundOptions = [
    { id: 'plain', name: 'Plain White', className: 'certificate-bg-plain' },
    { id: 'parchment', name: 'Parchment', className: 'certificate-bg-parchment' },
    { id: 'gradient', name: 'Subtle Gradient', className: 'certificate-bg-gradient' },
    { id: 'border-simple', name: 'Simple Border', className: 'certificate-bg-border-simple' },
    { id: 'border-double', name: 'Double Border', className: 'certificate-bg-border-double' },
    { id: 'border-elegant', name: 'Elegant Corners', className: 'certificate-bg-border-elegant' },
    { id: 'foil-corners', name: 'Foil Corners', className: 'certificate-bg-foil-corners' },
    { id: 'floral-border', name: 'Floral Border', className: 'certificate-bg-floral-border' },
    { id: 'watermark', name: 'Watermark', className: 'certificate-bg-watermark' },
    { id: 'school-emblem', name: 'School Emblem', className: 'certificate-bg-school-emblem' },
    { id: 'guilloche', name: 'Guilloche', className: 'certificate-bg-guilloche' },
    { id: 'geometric', name: 'Geometric', className: 'certificate-bg-geometric' },
    { id: 'dots', name: 'Dotted Pattern', className: 'certificate-bg-dots' },
    { id: 'lines', name: 'Hatch Lines', className: 'certificate-bg-lines' },
    { id: 'wavy-lines', name: 'Wavy Lines', className: 'certificate-bg-wavy-lines' },
    { id: 'confetti', name: 'Confetti', className: 'certificate-bg-confetti' },
];

const FormattingButton: React.FC<{ onClick: () => void; title: string; children: React.ReactNode; disabled?: boolean; }> = ({ onClick, title, children, disabled = false }) => (
    <button 
        type="button" 
        onClick={onClick} 
        title={title}
        disabled={disabled}
        className="px-2 py-1.5 text-sm text-base-content hover:bg-base-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {children}
    </button>
);

const placeholders = [ "STUDENT_NAME", "GRADE_AND_SECTION", "AWARD_TYPE", "GENERAL_AVERAGE", "SCHOOL_YEAR", "TEACHER_NAME", "SCHOOL_NAME", "DAY", "MONTH", "YEAR" ];

const HonorsCertificateModal: React.FC<HonorsCertificateModalProps> = ({ isOpen, onClose, honorStudents, selectedBatchId }) => {
    const { students, honorsCertificateSettings, updateHonorsCertificateSettings, settings } = useAppContext();
    const { content, backgroundStyle } = honorsCertificateSettings;
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedPreviewStudentId, setSelectedPreviewStudentId] = useState('');
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const certificatePreviewRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Undo/Redo State
    const [contentHistory, setContentHistory] = useState([content]);
    const [currentContentIndex, setCurrentContentIndex] = useState(0);
    const currentContent = contentHistory[currentContentIndex];

    useEffect(() => {
        const savedState = localStorage.getItem('honorsCertificateModalState');
        if (savedState) {
            try {
                const { selectedPreviewStudentId: savedId, contentHistory: savedHistory, currentContentIndex: savedIndex } = JSON.parse(savedState);
                if (savedId) setSelectedPreviewStudentId(savedId);
                if (savedHistory && savedHistory.length > 0 && savedIndex < savedHistory.length) {
                    setContentHistory(savedHistory);
                    setCurrentContentIndex(savedIndex);
                    // Sync context with restored history head
                    updateHonorsCertificateSettings({ content: savedHistory[savedIndex] });
                }
            } catch (e) {
                console.error("Failed to parse honorsCertificateModalState", e);
            }
        }
    }, []); // Load once on mount

    useEffect(() => {
        const stateToSave = { selectedPreviewStudentId, contentHistory, currentContentIndex };
        localStorage.setItem('honorsCertificateModalState', JSON.stringify(stateToSave));
    }, [selectedPreviewStudentId, contentHistory, currentContentIndex]);

    useEffect(() => {
        setContentHistory([honorsCertificateSettings.content]);
        setCurrentContentIndex(0);
    }, [selectedBatchId, honorsCertificateSettings.content]);

    const canUndo = currentContentIndex > 0;
    const canRedo = currentContentIndex < contentHistory.length - 1;

    const setContentWithHistory = (newContent: string) => {
        // If the new content is different from the current state in history, update history.
        if (newContent !== contentHistory[currentContentIndex]) {
            const newHistory = contentHistory.slice(0, currentContentIndex + 1);
            newHistory.push(newContent);
            setContentHistory(newHistory);
            setCurrentContentIndex(newHistory.length - 1);
        }
        // Always update the main context.
        updateHonorsCertificateSettings({ content: newContent });
    };

    const handleUndo = () => {
        if (!canUndo) return;
        const newIndex = currentContentIndex - 1;
        setCurrentContentIndex(newIndex);
        updateHonorsCertificateSettings({ content: contentHistory[newIndex] });
    };

    const handleRedo = () => {
        if (!canRedo) return;
        const newIndex = currentContentIndex + 1;
        setCurrentContentIndex(newIndex);
        updateHonorsCertificateSettings({ content: contentHistory[newIndex] });
    };
    
    const insertPlaceholder = (placeholder: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const newText = `${text.substring(0, start)}[${placeholder}]${text.substring(end)}`;
        
        setContentWithHistory(newText);

        requestAnimationFrame(() => {
            if (textareaRef.current) {
                textarea.selectionStart = textarea.selectionEnd = start + placeholder.length + 2;
                textarea.focus();
            }
        });
    };

    const applyFormat = (formatType: 'bold' | 'italic' | 'large' | 'very-large') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = currentContent.substring(start, end);

        if (selectedText.length === 0) {
            toast.error('Please select text to format.');
            return;
        }

        const formatChars: Record<typeof formatType, string> = {
            bold: '**',
            italic: '*',
            large: '##',
            'very-large': '^^',
        };

        const chars = formatChars[formatType];
        const newText = `${chars}${selectedText}${chars}`;
        
        const updatedContent = currentContent.substring(0, start) + newText + currentContent.substring(end);
        setContentWithHistory(updatedContent);

        requestAnimationFrame(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newCursorPos = start + newText.length;
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        });
    };

    useEffect(() => {
        if (isOpen && honorStudents.length > 0 && !honorStudents.some(s => s.student.id === selectedPreviewStudentId)) {
            setSelectedPreviewStudentId(honorStudents[0].student.id);
        }
    }, [isOpen, honorStudents, selectedPreviewStudentId]);

    const handleChange = (updates: Partial<HonorsCertificateSettings>) => {
        updateHonorsCertificateSettings(updates);
    };

    const studentToPreview = useMemo(() => {
        if (!selectedPreviewStudentId || honorStudents.length === 0) return null;
        return honorStudents.find(s => s.student.id === selectedPreviewStudentId) || honorStudents[0];
    }, [honorStudents, selectedPreviewStudentId]);

    const batches = useMemo(() => {
        const batchMap = new Map<string, string>();
        students.forEach(student => {
            if (student.importBatchId && !batchMap.has(student.importBatchId)) {
                const name = (student.gradeLevel && student.section) 
                    ? `${student.gradeLevel} - ${student.section}` 
                    : `Batch from ${student.importFileName}`;
                batchMap.set(student.importBatchId, name);
            }
        });
        return Array.from(batchMap.entries()).map(([id, name]) => ({ id, name }));
    }, [students]);

    // This effect now ONLY sets the default/auto-detected value. The UI input will handle user changes.
    useEffect(() => {
        if (!selectedBatchId) {
            handleChange({ gradeAndSection: "N/A" });
            return;
        }

        const studentsInBatch = students.filter(s => s.importBatchId === selectedBatchId);
        for (const student of studentsInBatch) {
            if (student.gradeLevel && student.section) {
                handleChange({ gradeAndSection: `${student.gradeLevel} - ${student.section}` });
                return;
            }
        }

        const batch = batches.find(b => b.id === selectedBatchId);
        if (batch && batch.name.includes(' - ')) {
            const parts = batch.name.split(' (from')[0].trim();
            if (parts.toLowerCase().includes('grade') || /^\d+\s*-\s*\w+/.test(parts)) {
                handleChange({ gradeAndSection: parts });
                return;
            }
        }
        
        handleChange({ gradeAndSection: "N/A" });
    }, [selectedBatchId, students, batches, updateHonorsCertificateSettings]);


    const handleGeneratePdf = async () => {
        setIsGenerating(true);
        const toastId = toast.loading('Generating PDF for all honor students...');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const previewNode = certificatePreviewRef.current;
        if (!previewNode) {
            toast.error("Preview element not found.", { id: toastId });
            setIsGenerating(false);
            return;
        }
        
        const originalPreviewId = selectedPreviewStudentId;
        try {
            for (let i = 0; i < honorStudents.length; i++) {
                const studentData = honorStudents[i];
                toast.loading(`Processing ${studentData.student.firstName}... (${i+1}/${honorStudents.length})`, { id: toastId });
                
                setSelectedPreviewStudentId(studentData.student.id);
                await new Promise(resolve => setTimeout(resolve, 50));

                const canvas = await html2canvas(previewNode, { scale: 2, logging: false, useCORS: true });
                const imgData = canvas.toDataURL('image/jpeg', 0.85);
                const { width, height } = pdf.internal.pageSize;
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
            }
            pdf.save(`Academic_Excellence_Certificates_${honorsCertificateSettings.gradeAndSection}.pdf`);
            toast.success('PDF with all certificates downloaded!', { id: toastId });
        } catch(e) {
            console.error("PDF generation failed", e);
            toast.error("Failed to generate PDF.", { id: toastId });
        } finally {
            setSelectedPreviewStudentId(originalPreviewId);
            setIsGenerating(false);
        }
    };
    
    const handleAiGenerate = async (formData: { awardTitle: string; tone: string; achievements: string }) => {
        setIsGenerating(true);
        const toastId = toast.loading('AI is crafting your certificate content...');
        try {
            const newContent = await generateCertificateContent(formData);
            setContentWithHistory(newContent);
            toast.success('AI content generated!', { id: toastId });
            setIsAiModalOpen(false);
        } catch (err) {
            let message = "An unknown error occurred during AI generation.";
            if (err instanceof Error) {
                message = err.message;
            }
            toast.error(message, { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-base-100 bg-opacity-95 z-50 flex flex-col p-4 sm:p-8" onClick={onClose}>
                <div className="bg-base-200 rounded-xl shadow-2xl w-full h-full flex flex-col" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-4 border-b border-base-300">
                        <h2 className="text-2xl font-bold text-base-content flex items-center gap-3"><AwardIcon/>Honors Certificate Studio</h2>
                        <button onClick={onClose} className="text-base-content hover:text-white"><XIcon/></button>
                    </div>
                    <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 overflow-y-auto">
                        {/* Controls */}
                        <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2">
                             {honorStudents.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-base-content mb-1">Previewing Student</label>
                                    <select value={selectedPreviewStudentId} onChange={e => setSelectedPreviewStudentId(e.target.value)} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                        {honorStudents.map(s => <option key={s.student.id} value={s.student.id}>{s.student.lastName}, {s.student.firstName}</option>)}
                                    </select>
                                </div>
                            )}
                             <div>
                                <label className="block text-sm font-medium text-base-content mb-1">Grade & Section (Editable)</label>
                                <input
                                    type="text"
                                    value={honorsCertificateSettings.gradeAndSection || ''}
                                    onChange={e => handleChange({ gradeAndSection: e.target.value })}
                                    className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10"
                                    placeholder="e.g., Grade 9 - Gentleness"
                                />
                            </div>
                            <div><label className="block text-sm font-medium text-base-content mb-1">Title</label><input type="text" value={honorsCertificateSettings.title} onChange={e => handleChange({ title: e.target.value })} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10"/></div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium">Content</label>
                                    <button onClick={() => setIsAiModalOpen(true)} title="AI Content Assistant" className="flex items-center gap-1 text-sm text-primary hover:text-primary-focus font-semibold">
                                        <SparklesIcon className="w-4 h-4" />
                                        <span>AI Assistant</span>
                                    </button>
                                </div>
                                <div className="bg-base-100 border border-b-0 border-base-300 rounded-t-md px-2 py-1 flex flex-wrap gap-1 items-center">
                                    <span className="text-xs self-center mr-1 font-semibold text-base-content/70">Insert:</span>
                                    {placeholders.map(p => <button key={p} onClick={() => insertPlaceholder(p)} className="text-xs bg-base-300 hover:bg-primary/80 hover:text-white px-2 py-0.5 rounded-full transition-colors">{p}</button>)}
                                </div>
                                <div className="flex items-center gap-1 bg-base-100 border border-b-0 border-t-0 border-base-300 px-2">
                                    <FormattingButton onClick={handleUndo} title="Undo" disabled={!canUndo}><UndoIcon className="w-4 h-4" /></FormattingButton>
                                    <FormattingButton onClick={handleRedo} title="Redo" disabled={!canRedo}><RedoIcon className="w-4 h-4" /></FormattingButton>
                                    <div className="w-px h-5 bg-base-300 mx-1"></div>
                                    <FormattingButton onClick={() => applyFormat('bold')} title="Bold (**text**)">
                                        <span className="font-bold">B</span>
                                    </FormattingButton>
                                    <FormattingButton onClick={() => applyFormat('italic')} title="Italic (*text*)">
                                        <span className="italic">I</span>
                                    </FormattingButton>
                                    <div className="w-px h-5 bg-base-300 mx-1"></div>
                                    <FormattingButton onClick={() => applyFormat('large')} title="Large (##text##)">
                                        <span className="font-semibold text-xs">Large</span>
                                    </FormattingButton>
                                    <FormattingButton onClick={() => applyFormat('very-large')} title="Very Large (^^text^^)">
                                        <span className="font-bold text-xs">Very Large</span>
                                    </FormattingButton>
                                </div>
                                <textarea
                                    ref={textareaRef}
                                    value={currentContent}
                                    onChange={e => setContentWithHistory(e.target.value)}
                                    rows={6}
                                    className="w-full bg-base-100 border border-base-300 rounded-b-md rounded-t-none p-2 text-sm focus:ring-primary focus:border-primary focus:z-10 relative"
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-base-content mb-1">Spacing from Header ({honorsCertificateSettings.verticalPadding}px)</label>
                                <input type="range" min="0" max="150" step="1" value={honorsCertificateSettings.verticalPadding} onChange={e => handleChange({ verticalPadding: Number(e.target.value)})} className="w-full h-2 bg-base-100 rounded-lg appearance-none cursor-pointer accent-primary" title="Adjusts the space between the school header and the certificate title."/>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-base-content mb-1">Font Style (Body)</label>
                                    <select value={honorsCertificateSettings.fontFamily} onChange={e => handleChange({ fontFamily: e.target.value })} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10 text-sm">
                                        {FONT_OPTIONS.map(group => ( <optgroup label={group.label} key={group.label}> {group.options.map(font => ( <option key={font.value} value={font.value} style={{ fontFamily: FONT_CSS_MAPPING[font.value], fontSize: '1rem' }}>{font.label}</option> ))} </optgroup> ))}
                                    </select>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-base-content mb-1">Font Style (Student Name)</label>
                                    <select value={honorsCertificateSettings.studentNameFontFamily} onChange={e => handleChange({ studentNameFontFamily: e.target.value })} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10 text-sm">
                                        {FONT_OPTIONS.map(group => ( <optgroup label={group.label} key={group.label}> {group.options.map(font => ( <option key={font.value} value={font.value} style={{ fontFamily: FONT_CSS_MAPPING[font.value], fontSize: '1rem' }}>{font.label}</option> ))} </optgroup> ))}
                                    </select>
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-base-content mb-1">Body Font Size ({honorsCertificateSettings.fontSize.toFixed(1)}px)</label>
                                    <input type="range" min="12" max="32" step="0.5" value={honorsCertificateSettings.fontSize} onChange={e => handleChange({ fontSize: Number(e.target.value) })} className="w-full h-2 bg-base-100 rounded-lg appearance-none cursor-pointer accent-primary"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-base-content mb-1">Title Font Size ({honorsCertificateSettings.titleFontSize}px)</label>
                                    <input type="range" min="24" max="96" step="1" value={honorsCertificateSettings.titleFontSize} onChange={e => handleChange({ titleFontSize: Number(e.target.value)})} className="w-full h-2 bg-base-100 rounded-lg appearance-none cursor-pointer accent-primary"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-base-content mb-1">Line Spacing ({honorsCertificateSettings.lineHeight.toFixed(1)})</label>
                                    <input type="range" min="1" max="3" step="0.1" value={honorsCertificateSettings.lineHeight} onChange={e => handleChange({ lineHeight: Number(e.target.value)})} className="w-full h-2 bg-base-100 rounded-lg appearance-none cursor-pointer accent-primary"/>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-base-content mb-1">Background Style</label>
                                <div className="grid grid-cols-4 gap-2 mt-1">
                                    {backgroundOptions.map(opt => (
                                        <button key={opt.id} onClick={() => handleChange({ backgroundStyle: opt.id})}
                                            className={`h-12 rounded-md border-2 ${backgroundStyle === opt.id ? 'border-primary' : 'border-base-300'} ${opt.className}`}
                                            title={opt.name}
                                        />
                                    ))}
                                </div>
                            </div>
                             <div className="space-y-2">
                                <h4 className="text-sm font-medium text-base-content">Elements</h4>
                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={honorsCertificateSettings.showSchoolLogo} onChange={e => handleChange({ showSchoolLogo: e.target.checked})} className="checkbox checkbox-primary checkbox-sm" /> Show School Logo</label>
                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={honorsCertificateSettings.showSecondLogo} onChange={e => handleChange({ showSecondLogo: e.target.checked})} className="checkbox checkbox-primary checkbox-sm" /> Show Second Logo</label>
                                <h4 className="text-sm font-medium text-base-content pt-2">Signatories</h4>
                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={honorsCertificateSettings.showAdviser} onChange={e => handleChange({ showAdviser: e.target.checked })} className="checkbox checkbox-primary checkbox-sm" /> Show Adviser's Signature</label>
                                {honorsCertificateSettings.showAdviser && (
                                    <div className="pl-6 space-y-2">
                                        <label className="block text-sm font-medium text-base-content">Designation</label>
                                        <select 
                                            value={honorsCertificateSettings.teacherDesignationType} 
                                            onChange={e => handleChange({ teacherDesignationType: e.target.value as any })} 
                                            className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10 text-sm"
                                        >
                                            <option value="classAdviser">Class Adviser</option>
                                            <option value="subjectTeacher">Subject Teacher</option>
                                            <option value="custom">Custom...</option>
                                        </select>
                                        {honorsCertificateSettings.teacherDesignationType === 'custom' && (
                                            <input
                                                type="text"
                                                value={honorsCertificateSettings.customTeacherDesignation}
                                                onChange={e => handleChange({ customTeacherDesignation: e.target.value })}
                                                className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10 text-sm"
                                                placeholder="Enter custom designation"
                                            />
                                        )}
                                    </div>
                                )}
                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={honorsCertificateSettings.showCoordinator} onChange={e => handleChange({ showCoordinator: e.target.checked })} className="checkbox checkbox-primary checkbox-sm" /> Show Coordinator's Signature</label>
                                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={honorsCertificateSettings.showPrincipal} onChange={e => handleChange({ showPrincipal: e.target.checked })} className="checkbox checkbox-primary checkbox-sm" /> Show Principal's Signature</label>
                            </div>
                             <div className="pt-4 border-t border-base-300 space-y-3">
                                <button onClick={handleGeneratePdf} disabled={isGenerating || honorStudents.length === 0} className="w-full flex items-center justify-center bg-primary hover:bg-primary-focus text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"><PrinterIcon className="w-5 h-5 mr-2" />{isGenerating ? 'Generating...' : `Generate PDF for All ${honorStudents.length} Students`}</button>
                                <button onClick={() => setIsEmailModalOpen(true)} disabled={isGenerating || honorStudents.length === 0} className="w-full flex items-center justify-center bg-info hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50">
                                    <SendIcon className="w-5 h-5 mr-2" />
                                    Email Center
                                </button>
                             </div>
                        </div>

                        {/* Preview */}
                        <div className="lg:col-span-2 flex items-center justify-center bg-base-100 p-4 rounded-xl">
                            {studentToPreview ? (
                               <CertificatePreview
                                    ref={certificatePreviewRef}
                                    studentData={studentToPreview}
                                    certificateSettings={honorsCertificateSettings}
                                    gradeAndSection={honorsCertificateSettings.gradeAndSection || ''}
                                    schoolSettings={settings}
                                />
                            ) : (
                                <div className="text-center p-16">
                                    <AwardIcon className="w-16 h-16 mx-auto text-primary mb-4" />
                                    <h3 className="text-2xl font-bold text-base-content">No Honor Students</h3>
                                    <p className="text-base-content mt-2">No students meet the honors criteria for this class.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <EmailHonorsCertificateModal
                isOpen={isEmailModalOpen}
                onClose={() => setIsEmailModalOpen(false)}
                honorStudents={honorStudents}
                gradeAndSection={honorsCertificateSettings.gradeAndSection || ''}
                settings={settings}
                honorsCertificateSettings={honorsCertificateSettings}
            />
            <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title="AI Content Assistant">
                <AiContentForm
                    onGenerate={handleAiGenerate}
                    onClose={() => setIsAiModalOpen(false)}
                    isLoading={isGenerating}
                />
            </Modal>
        </>
    );
};

const AiContentForm: React.FC<{onGenerate: (data: any) => void, onClose: () => void, isLoading: boolean}> = ({ onGenerate, onClose, isLoading }) => {
    const [formData, setFormData] = useState({ awardTitle: '', tone: 'Formal', achievements: '' });
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.awardTitle.trim()) {
          toast.error("Please provide an award title.");
          return;
      }
      onGenerate(formData);
    };
  
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="awardTitle" className="block text-sm font-medium text-base-content">Award / Recognition Title</label>
            <input type="text" id="awardTitle" name="awardTitle" value={formData.awardTitle} onChange={handleChange} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md p-2 h-10" placeholder="e.g., Top Performer in English" />
        </div>
        <div>
            <label htmlFor="tone" className="block text-sm font-medium text-base-content">Tone</label>
            <select id="tone" name="tone" value={formData.tone} onChange={handleChange} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                <option>Formal</option>
                <option>Inspirational</option>
                <option>Celebratory</option>
                <option>Heartfelt</option>
            </select>
        </div>
        <div>
            <label htmlFor="achievements" className="block text-sm font-medium text-base-content">Key Achievements (Optional)</label>
            <textarea id="achievements" name="achievements" value={formData.achievements} onChange={handleChange} rows={3} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md p-2" placeholder="e.g., Won the school spelling bee, consistently high scores..."></textarea>
        </div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-base-300 mt-6">
          <button type="button" onClick={onClose} disabled={isLoading} className="bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={isLoading} className="flex items-center justify-center bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50">
            <SparklesIcon className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Generating...' : 'Generate Content'}
          </button>
        </div>
      </form>
    );
}

export default HonorsCertificateModal;