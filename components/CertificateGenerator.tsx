import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import Header from './Header';
import { AwardIcon, PrinterIcon, SendIcon, UndoIcon, RedoIcon, SparklesIcon } from './icons';
import { useAppContext } from '../contexts/AppContext';
import { Student, Quarter, CertificateSettings, SchoolSettings } from '../types';
import { calculateInitialGrade, transmuteGrade, getHonorStatus } from '../utils/transmutation';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import EmailQuarterlyCertificateModal from './EmailQuarterlyCertificateModal';
import Modal from './Modal';
import { generateCertificateContent } from '../services/geminiService';
import ReactDOM from 'react-dom/client';


interface HonorStudent {
    student: Student;
    quarterlyGrade: number;
    honorStatus: string;
}

const FONT_CSS_MAPPING: { [key: string]: string } = {
    'font-playfair': '"Playfair Display", serif',
    'font-merriweather': '"Merriweather", serif',
    'font-great-vibes': '"Great Vibes", cursive',
    'font-dancing-script': '"Dancing Script", cursive',
    'font-lobster': '"Lobster", cursive',
    'font-roboto-slab': '"Roboto Slab", serif',
    'font-alegreya': '"Alegreya", serif',
    'font-cormorant': '"Cormorant Garamond", serif',
    'font-old-standard': '"Old Standard TT", serif',
    'font-sacramento': '"Sacramento", cursive',
    'font-cinzel': '"Cinzel", serif',
    'font-eb-garamond': '"EB Garamond", serif',
    'font-tangerine': '"Tangerine", cursive',
    'font-pinyon-script': '"Pinyon Script", cursive',
    'font-libre-baskerville': '"Libre Baskerville", serif',
    'font-arvo': '"Arvo", serif',
    'font-alex-brush': '"Alex Brush", cursive',
    'font-allura': '"Allura", cursive',
    'font-italianno': '"Italianno", cursive',
    'font-unifrakturcook': '"UnifrakturCook", cursive',
    'font-meddon': '"Meddon", cursive',
    'font-im-fell': '"IM Fell English", serif',
    'font-bookman': '"Bookman Old Style", serif',
};
const FONT_OPTIONS = [ { label: 'Serif (Formal)', options: [ { value: 'font-bookman', label: 'Bookman' }, { value: 'font-old-standard', label: 'Old Standard TT' }, { value: 'font-cinzel', label: 'Cinzel' }, { value: 'font-merriweather', label: 'Merriweather' }, { value: 'font-playfair', label: 'Playfair Display' }, { value: 'font-roboto-slab', label: 'Roboto Slab' }, { value: 'font-eb-garamond', label: 'EB Garamond' }, { value: 'font-libre-baskerville', label: 'Libre Baskerville' }, { value: 'font-im-fell', label: 'IM Fell English' }, { value: 'font-cormorant', label: 'Cormorant Garamond' }, { value: 'font-alegreya', label: 'Alegreya' } ] }, { label: 'Script (Elegant)', options: [ { value: 'font-great-vibes', label: 'Great Vibes' }, { value: 'font-pinyon-script', label: 'Pinyon Script' }, { value: 'font-dancing-script', label: 'Dancing Script' }, { value: 'font-sacramento', label: 'Sacramento' }, { value: 'font-tangerine', label: 'Tangerine' }, { value: 'font-alex-brush', label: 'Alex Brush' }, { value: 'font-allura', label: 'Allura' }, { value: 'font-italianno', label: 'Italianno' } ] }, { label: 'Classic & Decorative', options: [ { value: 'font-arvo', label: 'Arvo' }, { value: 'font-lobster', label: 'Lobster' }, { value: 'font-unifrakturcook', label: 'UnifrakturCook' }, { value: 'font-meddon', label: 'Meddon' } ] } ];
const BACKGROUND_OPTIONS = [
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

const parseAdvancedMarkdownToReact = (text: string, baseFontSize: number, studentNameFont: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|##.*?##|\^\^.*?\^\^|---|___)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
        if (part.startsWith('##') && part.endsWith('##')) return (
            <span key={index} style={{ 
                fontSize: `${baseFontSize * 1.5}px`, 
                fontWeight: 'bold',
            }}>
                {part.slice(2, -2)}
            </span>
        );
        if (part.startsWith('^^') && part.endsWith('^^')) {
             return (
                <span 
                    key={index} 
                    className={studentNameFont} 
                    style={{ 
                        fontSize: `${baseFontSize * 2.5}px`, 
                        lineHeight: 1.2, 
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                    }}
                >
                    {part.slice(2, -2)}
                </span>
            );
        };
        if (part === '---' || part === '___') return <hr key={index} className="w-1/2 mx-auto my-2" style={{ borderColor: 'currentColor', borderWidth: '0.5px' }} />;
        return part;
    });
};

const FormattingButton: React.FC<{ onClick: () => void; title: string; children: React.ReactNode; disabled?: boolean; }> = ({ onClick, title, children, disabled = false }) => ( <button type="button" onClick={onClick} title={title} disabled={disabled} className="px-2 py-1.5 text-sm text-base-content hover:bg-base-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"> {children} </button> );
const academicPlaceholders = [ "STUDENT_NAME", "GRADE_AND_SECTION", "AWARD_TYPE", "SUBJECT", "QUARTER", "SCHOOL_YEAR", "TEACHER_NAME", "TEACHER_DESIGNATION", "SCHOOL_NAME", "DAY", "MONTH", "YEAR" ];

const CertificateGenerator: React.FC = () => {
    const { students, classRecordSettings, classRecords, settings, certificateSettings, updateCertificateSettings } = useAppContext();
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedPreviewStudentId, setSelectedPreviewStudentId] = useState('');
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const certificatePreviewRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const currentSettings = certificateSettings;
    const updateSettings = updateCertificateSettings;
    const { selectedBatchId, selectedSubject, selectedQuarter } = certificateSettings;
    
    // Undo/Redo state management
    const [contentHistory, setContentHistory] = useState([currentSettings.content]);
    const [currentContentIndex, setCurrentContentIndex] = useState(0);
    const currentContent = contentHistory[currentContentIndex];

    useEffect(() => {
        // This effect should only reset history when the context (class/subject/quarter) changes.
        // The content itself is now managed by `setContentWithHistory`.
        setContentHistory([certificateSettings.content]);
        setCurrentContentIndex(0);
    }, [certificateSettings.selectedBatchId, certificateSettings.selectedSubject, certificateSettings.selectedQuarter]);
    
    const setContentWithHistory = (newContent: string) => {
        // If the new content is different from the current state in history, update history.
        if (newContent !== contentHistory[currentContentIndex]) {
            const newHistory = contentHistory.slice(0, currentContentIndex + 1);
            newHistory.push(newContent);
            setContentHistory(newHistory);
            setCurrentContentIndex(newHistory.length - 1);
        }
        // Always update the main context.
        updateSettings({ content: newContent });
    };

    const handleUndo = () => {
        if (currentContentIndex > 0) {
            const newIndex = currentContentIndex - 1;
            setCurrentContentIndex(newIndex);
            updateSettings({ content: contentHistory[newIndex] });
        }
    };
    const handleRedo = () => {
        if (currentContentIndex < contentHistory.length - 1) {
            const newIndex = currentContentIndex + 1;
            setCurrentContentIndex(newIndex);
            updateSettings({ content: contentHistory[newIndex] });
        }
    };

    const canUndo = currentContentIndex > 0;
    const canRedo = currentContentIndex < contentHistory.length - 1;
    
    const batches = useMemo(() => {
        const batchMap = new Map<string, string>();
        students.forEach(s => { if (s.importBatchId && !batchMap.has(s.importBatchId)) { batchMap.set(s.importBatchId, (s.gradeLevel && s.section) ? `${s.gradeLevel} - ${s.section}` : `Batch: ${s.importFileName}`); }});
        return Array.from(batchMap.entries()).map(([id, name]) => ({ id, name }));
    }, [students]);

    const subjects = useMemo(() => Array.from(new Set(classRecordSettings.map(s => s.subject).filter(Boolean))).sort(), [classRecordSettings]);
    
    const honorRoll = useMemo(() => {
        if (!selectedBatchId || !selectedSubject) return [];
        return students.filter(s => s.importBatchId === selectedBatchId).map(student => {
            const record = classRecords.find(r => r.studentId === student.id && r.subject === selectedSubject && r.quarter === selectedQuarter && r.batchId === selectedBatchId);
            const settingsRecord = classRecordSettings.find(s => s.subject === selectedSubject && s.quarter === selectedQuarter && s.batchId === selectedBatchId);
            
            if (record && settingsRecord) {
                const { initialGrade } = calculateInitialGrade(record, settingsRecord);
                if (initialGrade !== null) {
                    const quarterlyGrade = transmuteGrade(initialGrade);
                    const honorStatus = getHonorStatus(quarterlyGrade);
                    if (honorStatus) {
                        return { student, quarterlyGrade, honorStatus };
                    }
                }
            }
            return null;
        }).filter((s): s is HonorStudent => s !== null).sort((a, b) => b.quarterlyGrade - a.quarterlyGrade);
    }, [students, selectedBatchId, selectedSubject, selectedQuarter, classRecords, classRecordSettings]);
    
    useEffect(() => {
        if (honorRoll.length > 0 && !honorRoll.some(s => s.student.id === selectedPreviewStudentId)) {
            setSelectedPreviewStudentId(honorRoll[0].student.id);
        } else if (honorRoll.length === 0) {
            setSelectedPreviewStudentId('');
        }
    }, [honorRoll, selectedPreviewStudentId]);

    const studentToPreview = useMemo(() => {
        if (!selectedPreviewStudentId || honorRoll.length === 0) return null;
        return honorRoll.find(s => s.student.id === selectedPreviewStudentId) || honorRoll[0];
    }, [honorRoll, selectedPreviewStudentId]);

    // This effect now ONLY sets the default/auto-detected value. The UI input will handle user changes.
    useEffect(() => {
        // Do not run if there is no selected batch
        if (!selectedBatchId) {
            updateSettings({ gradeAndSection: "N/A" });
            return;
        }

        // Try to find from any student in the batch
        const studentsInBatch = students.filter(s => s.importBatchId === selectedBatchId);
        for (const student of studentsInBatch) {
            if (student.gradeLevel && student.section) {
                updateSettings({ gradeAndSection: `${student.gradeLevel} - ${student.section}` });
                return;
            }
        }

        // Fallback to parsing batch name
        const batch = batches.find(b => b.id === selectedBatchId);
        if (batch && batch.name.includes(' - ')) {
            const parts = batch.name.split(' (from')[0].trim();
            // Check if it looks like "Grade X - Section"
            if (parts.toLowerCase().includes('grade') || /^\d+\s*-\s*\w+/.test(parts)) {
                updateSettings({ gradeAndSection: parts });
                return;
            }
        }
        
        // Final fallback
        updateSettings({ gradeAndSection: "N/A" });
    }, [selectedBatchId, students, batches, updateSettings]);


    const insertPlaceholder = (placeholder: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const newText = `${text.substring(0, start)}[${placeholder}]${text.substring(end)}`;
        
        setContentWithHistory(newText);

        // Defer focusing to after React's state update cycle
        requestAnimationFrame(() => {
            if (textareaRef.current) {
                textarea.selectionStart = textarea.selectionEnd = start + placeholder.length + 2;
                textarea.focus();
            }
        });
    };
    
    const applyFormat = (formatType: 'bold' | 'italic' | 'large' | 'very-large') => {
        const textarea = textareaRef.current; if (!textarea) return;
        const start = textarea.selectionStart; const end = textarea.selectionEnd; const selectedText = currentContent.substring(start, end);
        if (selectedText.length === 0) { toast.error('Please select text to format.'); return; }
        const formatChars: Record<typeof formatType, string> = { bold: '**', italic: '*', large: '##', 'very-large': '^^' };
        const chars = formatChars[formatType]; const newText = `${chars}${selectedText}${chars}`;
        const updatedContent = currentContent.substring(0, start) + newText + currentContent.substring(end);
        setContentWithHistory(updatedContent);
        requestAnimationFrame(() => { if (textareaRef.current) { textareaRef.current.focus(); const newCursorPos = start + newText.length; textareaRef.current.setSelectionRange(newCursorPos, newCursorPos); }});
    };

    const handleGeneratePdf = async () => {
        if(honorRoll.length === 0) {
            toast.error("No honor students to generate certificates for.");
            return;
        }
        setIsGenerating(true);
        const toastId = toast.loading('Generating PDF for all honor students...');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        const previewNode = document.createElement('div');
        previewNode.style.position = 'fixed';
        previewNode.style.left = '-9999px';
        previewNode.style.top = '0';
        previewNode.style.width = '1123px'; // Pixel size for 11in at 102dpi approx
        previewNode.style.height = '794px'; // Pixel size for 8.5in at 102dpi approx
        document.body.appendChild(previewNode);
        const root = ReactDOM.createRoot(previewNode);

        const originalPreviewId = selectedPreviewStudentId;
        try {
            for (let i = 0; i < honorRoll.length; i++) {
                const studentData = honorRoll[i];
                toast.loading(`Processing ${studentData.student.firstName}... (${i+1}/${honorRoll.length})`, { id: toastId });
                
                // Render the specific student's certificate into the off-screen div
                root.render(
                    <React.StrictMode>
                        <QuarterlyCertificatePreview
                            studentData={studentData}
                            certificateSettings={currentSettings}
                            schoolSettings={settings}
                            gradeAndSection={currentSettings.gradeAndSection || ''}
                            subject={selectedSubject}
                            quarter={selectedQuarter}
                        />
                    </React.StrictMode>
                );
                
                // Give React a moment to render
                await new Promise(resolve => setTimeout(resolve, 300));

                const canvas = await html2canvas(previewNode.querySelector('.aspect-\\[297\\/210\\]') as HTMLElement, {
                    scale: 2,
                    logging: false,
                    useCORS: true,
                });
                const imgData = canvas.toDataURL('image/jpeg', 0.85);

                const { width, height } = pdf.internal.pageSize;

                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
            }

            pdf.save(`Certificates_${selectedSubject}_Q${selectedQuarter}.pdf`);
            toast.success('PDF with all certificates downloaded!', { id: toastId });

        } catch(e) {
            console.error("PDF generation failed", e);
            toast.error("Failed to generate PDF.", { id: toastId });
        }
        finally {
            // Cleanup
            root.unmount();
            document.body.removeChild(previewNode);
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
            let message = "An unknown error occurred.";
            if (err instanceof Error) message = err.message;
            toast.error(message, { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen">
            <Header title="Quarterly Awards Certificates" />
            <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1 bg-base-200 p-6 rounded-xl shadow-lg self-start space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-base-content mb-1">Class</label>
                            <select value={selectedBatchId} onChange={e => updateSettings({ selectedBatchId: e.target.value, selectedSubject: '' })} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                <option value="">Select a class...</option>
                                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-base-content mb-1">Subject</label>
                            <select value={selectedSubject} onChange={e => updateSettings({ selectedSubject: e.target.value })} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10" disabled={!selectedBatchId}>
                                <option value="">Select a subject...</option>
                                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-base-content mb-1">Grade & Section (Editable)</label>
                        <input
                            type="text"
                            value={currentSettings.gradeAndSection || ''}
                            onChange={e => updateSettings({ gradeAndSection: e.target.value })}
                            className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10"
                            placeholder="e.g., Grade 9 - Gentleness"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-base-content mb-1">Certificate Title</label>
                        <input
                            type="text"
                            value={currentSettings.title}
                            onChange={e => updateSettings({ title: e.target.value })}
                            className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10"
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-base-content mb-1">Quarter</label>
                         <div className="flex items-center bg-base-100 rounded-lg p-1 border border-base-300">
                            {[1, 2, 3, 4].map(q => (
                                <button key={q} onClick={() => updateSettings({ selectedQuarter: q as Quarter })} className={`w-1/4 py-1.5 rounded-md text-sm font-semibold transition-colors ${selectedQuarter === q ? 'bg-primary text-white' : 'text-base-content hover:bg-base-300'}`}>
                                    Q{q}
                                </button>
                            ))}
                        </div>
                    </div>
                    {honorRoll.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-base-content mb-1">Previewing Student</label>
                            <select value={selectedPreviewStudentId} onChange={e => setSelectedPreviewStudentId(e.target.value)} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                {honorRoll.map(s => <option key={s.student.id} value={s.student.id}>{s.student.lastName}, {s.student.firstName} ({s.honorStatus})</option>)}
                            </select>
                        </div>
                    )}
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
                            {academicPlaceholders.map(p => <button key={p} onClick={() => insertPlaceholder(p)} className="text-xs bg-base-300 hover:bg-primary/80 hover:text-white px-2 py-0.5 rounded-full transition-colors">{p}</button>)}
                        </div>
                        <div className="flex items-center gap-1 bg-base-100 border border-b-0 border-t-0 border-base-300 px-2">
                            <FormattingButton onClick={handleUndo} title="Undo" disabled={!canUndo}><UndoIcon className="w-4 h-4" /></FormattingButton>
                            <FormattingButton onClick={handleRedo} title="Redo" disabled={!canRedo}><RedoIcon className="w-4 h-4" /></FormattingButton>
                            <div className="w-px h-5 bg-base-300 mx-1"></div>
                            <FormattingButton onClick={() => applyFormat('bold')} title="Bold (**text**)"> <span className="font-bold">B</span> </FormattingButton>
                            <FormattingButton onClick={() => applyFormat('italic')} title="Italic (*text*)"> <span className="italic">I</span> </FormattingButton>
                            <div className="w-px h-5 bg-base-300 mx-1"></div>
                            <FormattingButton onClick={() => applyFormat('large')} title="Large (##text##)"> <span className="font-semibold text-xs">Large</span> </FormattingButton>
                            <FormattingButton onClick={() => applyFormat('very-large')} title="Very Large (^^text^^)"> <span className="font-bold text-xs">Very Large</span> </FormattingButton>
                        </div>
                         <textarea
                            ref={textareaRef}
                            value={currentContent}
                            onChange={e => setContentWithHistory(e.target.value)}
                            rows={6}
                            className="w-full bg-base-100 border border-base-300 rounded-b-md rounded-t-none p-2 text-sm focus:ring-primary focus:border-primary focus:z-10 relative"
                        />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-base-content mb-1">Font Style (Body)</label>
                            <select value={currentSettings.fontFamily} onChange={e => updateSettings({ fontFamily: e.target.value })} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10 text-sm">
                                {FONT_OPTIONS.map(group => (
                                    <optgroup label={group.label} key={group.label}>
                                        {group.options.map(font => (
                                            <option key={font.value} value={font.value} style={{ fontFamily: FONT_CSS_MAPPING[font.value], fontSize: '1rem' }}>{font.label}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-base-content mb-1">Font Style (Student Name)</label>
                            <select value={currentSettings.studentNameFontFamily} onChange={e => updateSettings({ studentNameFontFamily: e.target.value })} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10 text-sm">
                                {FONT_OPTIONS.map(group => (
                                    <optgroup label={group.label} key={group.label}>
                                        {group.options.map(font => (
                                            <option key={font.value} value={font.value} style={{ fontFamily: FONT_CSS_MAPPING[font.value], fontSize: '1rem' }}>{font.label}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-base-content mb-1">Body Font Size ({currentSettings.fontSize}px)</label>
                        <input type="range" min="12" max="32" step="0.5" value={currentSettings.fontSize} onChange={e => updateSettings({ fontSize: Number(e.target.value)})} className="w-full h-2 bg-base-100 rounded-lg appearance-none cursor-pointer accent-primary"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-base-content mb-1">Title Font Size ({currentSettings.titleFontSize}px)</label>
                        <input type="range" min="24" max="96" step="1" value={currentSettings.titleFontSize} onChange={e => updateSettings({ titleFontSize: Number(e.target.value)})} className="w-full h-2 bg-base-100 rounded-lg appearance-none cursor-pointer accent-primary"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-base-content mb-1">Spacing from Header ({currentSettings.verticalPadding}px)</label>
                        <input type="range" min="0" max="200" step="1" value={currentSettings.verticalPadding} onChange={e => updateSettings({ verticalPadding: Number(e.target.value)})} className="w-full h-2 bg-base-100 rounded-lg appearance-none cursor-pointer accent-primary" title="Adjusts the space between the school header and the certificate title."/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-base-content mb-1">Line Spacing ({currentSettings.lineHeight.toFixed(1)})</label>
                            <input type="range" min="1" max="3" step="0.1" value={currentSettings.lineHeight} onChange={e => updateSettings({ lineHeight: Number(e.target.value)})} className="w-full h-2 bg-base-100 rounded-lg appearance-none cursor-pointer accent-primary"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-base-content mb-1">Word Spacing ({currentSettings.wordSpacing.toFixed(1)}px)</label>
                            <input type="range" min="-2" max="10" step="0.5" value={currentSettings.wordSpacing} onChange={e => updateSettings({ wordSpacing: Number(e.target.value)})} className="w-full h-2 bg-base-100 rounded-lg appearance-none cursor-pointer accent-primary"/>
                        </div>
                    </div>
                    <div><label className="block text-sm font-medium text-base-content mb-1">Background Style</label><div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-1">{BACKGROUND_OPTIONS.map(opt => ( <button key={opt.id} onClick={() => updateSettings({ backgroundStyle: opt.id})} className={`h-12 rounded-md border-2 ${currentSettings.backgroundStyle === opt.id ? 'border-primary' : 'border-base-300'} ${opt.className}`} title={opt.name} /> ))}</div></div>
                     <div className="space-y-2">
                        <h4 className="text-sm font-medium text-base-content">Elements</h4>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={currentSettings.showSchoolLogo} onChange={e => updateSettings({ showSchoolLogo: e.target.checked})} className="checkbox checkbox-primary checkbox-sm" /> Show School Logo</label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={currentSettings.showSecondLogo} onChange={e => updateSettings({ showSecondLogo: e.target.checked})} className="checkbox checkbox-primary checkbox-sm" /> Show Second Logo</label>
                        <h4 className="text-sm font-medium text-base-content pt-2">Signatories</h4>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={currentSettings.showAdviser} onChange={e => updateSettings({ showAdviser: e.target.checked })} className="checkbox checkbox-primary checkbox-sm" /> Show Adviser/Teacher Signature</label>
                        {currentSettings.showAdviser && (
                            <div className="pl-6 space-y-2">
                                <label className="block text-sm font-medium text-base-content">Designation</label>
                                <select 
                                    value={currentSettings.teacherDesignationType} 
                                    onChange={e => updateSettings({ teacherDesignationType: e.target.value as any })} 
                                    className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10 text-sm"
                                >
                                    <option value="subjectTeacher">Subject Teacher</option>
                                    <option value="classAdviser">Class Adviser</option>
                                    <option value="custom">Custom...</option>
                                </select>
                                {currentSettings.teacherDesignationType === 'custom' && (
                                    <input
                                        type="text"
                                        value={currentSettings.customTeacherDesignation}
                                        onChange={e => updateSettings({ customTeacherDesignation: e.target.value })}
                                        className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10 text-sm"
                                        placeholder="Enter custom designation"
                                    />
                                )}
                            </div>
                        )}
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={currentSettings.showCoordinator} onChange={e => updateSettings({ showCoordinator: e.target.checked })} className="checkbox checkbox-primary checkbox-sm" /> Show Coordinator's Signature</label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={currentSettings.showPrincipal} onChange={e => updateSettings({ showPrincipal: e.target.checked })} className="checkbox checkbox-primary checkbox-sm" /> Show Principal's Signature</label>
                    </div>
                    <div className="pt-4 border-t border-base-300 space-y-3">
                        <button onClick={handleGeneratePdf} disabled={isGenerating || honorRoll.length === 0} className="w-full flex items-center justify-center bg-primary hover:bg-primary-focus text-white font-bold py-3 px-4 rounded-lg"><PrinterIcon className="w-5 h-5 mr-2" />{isGenerating ? 'Generating...' : `Generate PDF for All ${honorRoll.length} Students`}</button>
                        <button onClick={() => setIsEmailModalOpen(true)} disabled={isGenerating || honorRoll.length === 0} className="w-full flex items-center justify-center bg-info hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg"><SendIcon className="w-5 h-5 mr-2" />Email Center</button>
                    </div>
                </div>

                {/* Preview */}
                <div className="lg:col-span-2 flex items-center justify-center bg-base-300 p-4 rounded-xl">
                    {studentToPreview ? (
                        <div ref={certificatePreviewRef} className="w-full">
                            <QuarterlyCertificatePreview
                                studentData={studentToPreview}
                                certificateSettings={currentSettings}
                                schoolSettings={settings}
                                gradeAndSection={currentSettings.gradeAndSection || ''}
                                subject={selectedSubject}
                                quarter={selectedQuarter}
                            />
                        </div>
                    ) : (
                        <div className="text-center p-16">
                            <AwardIcon className="w-16 h-16 mx-auto text-primary mb-4" />
                            <h3 className="text-2xl font-bold text-base-content">No Honor Students</h3>
                            <p className="text-base-content mt-2">No students meet the honors criteria for the selected class, subject, and quarter.</p>
                        </div>
                    )}
                </div>
            </div>
            <EmailQuarterlyCertificateModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} honorStudents={honorRoll} gradeAndSection={currentSettings.gradeAndSection || ''} subject={selectedSubject} quarter={selectedQuarter} />
            <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title="AI Content Assistant"><AiContentForm onGenerate={handleAiGenerate} onClose={() => setIsAiModalOpen(false)} isLoading={isGenerating} /></Modal>
        </div>
    );
};

const QuarterlyCertificatePreview: React.FC<{studentData: HonorStudent, certificateSettings: CertificateSettings, schoolSettings: SchoolSettings, gradeAndSection: string, subject: string, quarter: Quarter}> =
 ({studentData, certificateSettings, schoolSettings, gradeAndSection, subject, quarter}) => {
    const { title, content, fontFamily, studentNameFontFamily, fontSize, titleFontSize, lineHeight, backgroundStyle, showAdviser, showCoordinator, showPrincipal, showSchoolLogo, showSecondLogo, teacherDesignationType, customTeacherDesignation, verticalPadding, wordSpacing } = certificateSettings;
    
    const getDesignationText = (type: 'custom' | 'classAdviser' | 'subjectTeacher', customText: string) => {
        if (type === 'classAdviser') return 'Class Adviser';
        if (type === 'subjectTeacher') return 'Subject Teacher';
        return customText;
    };
    const adviserDesignation = getDesignationText(teacherDesignationType, customTeacherDesignation);

    const getQuarterText = (q: Quarter) => { if (q === 1) return '1st'; if (q === 2) return '2nd'; if (q === 3) return '3rd'; return '4th'; };
    const replacePlaceholders = (template: string, data: HonorStudent) => {
        const now = new Date(); const day = now.getDate(); const dayWithSuffix = day + (day % 10 == 1 && day != 11 ? 'st' : day % 10 == 2 && day != 12 ? 'nd' : day % 10 == 3 && day != 13 ? 'rd' : 'th');
        const formattedStudentName = `${data.student.firstName} ${data.student.middleName ? data.student.middleName.charAt(0) + '.' : ''} ${data.student.lastName}`.toUpperCase();
        
        return template.replace(/\[STUDENT_NAME\]/g, formattedStudentName).replace(/\[GRADE_AND_SECTION\]/g, gradeAndSection).replace(/\[AWARD_TYPE\]/g, data.honorStatus).replace(/\[SUBJECT\]/g, subject).replace(/\[QUARTER\]/g, getQuarterText(quarter)).replace(/\[SCHOOL_YEAR\]/g, schoolSettings.schoolYear).replace(/\[TEACHER_NAME\]/g, schoolSettings.teacherName).replace(/\[TEACHER_DESIGNATION\]/g, adviserDesignation).replace(/\[SCHOOL_NAME\]/g, schoolSettings.schoolName).replace(/\[DAY\]/g, dayWithSuffix).replace(/\[MONTH\]/g, now.toLocaleString('default', { month: 'long' })).replace(/\[YEAR\]/g, now.getFullYear().toString());
    };
    
    const backgroundClassName = BACKGROUND_OPTIONS.find(b => b.id === backgroundStyle)?.className || '';
    
    const signatories = [
        showAdviser && { name: schoolSettings.teacherName, designation: adviserDesignation, signature: schoolSettings.teacherSignature },
        showCoordinator && { name: schoolSettings.checkedBy, designation: schoolSettings.checkerDesignation, signature: schoolSettings.checkerSignature },
        showPrincipal && { name: schoolSettings.principalName, designation: schoolSettings.principalDesignation, signature: schoolSettings.principalSignature },
    ].filter((s): s is NonNullable<typeof s> => !!s && s.name.trim() !== '');


    return (
        <div className={`aspect-[297/210] w-full bg-white text-black shadow-2xl overflow-hidden`}>
            <div className={`w-full h-full relative ${fontFamily} ${backgroundClassName}`}>
                <div className="relative z-10 w-full h-full p-8 flex flex-col items-center" style={{ fontSize: `${fontSize}px` }}>
                    <div className="w-full flex justify-center items-center gap-4 text-center" style={{ fontFamily: '"Times New Roman", serif' }}>
                        {showSchoolLogo && schoolSettings.schoolLogo ? <img src={schoolSettings.schoolLogo} alt="School Logo" className="h-24 w-24 object-contain" /> : <div className="w-24 h-24" />}
                        <div className="flex flex-col gap-1 text-sm">
                            <p>Republic of the Philippines</p>
                            <p className="font-bold">Department of Education</p>
                            <p className="font-bold text-base mt-2">{schoolSettings.schoolName.toUpperCase()}</p>
                        </div>
                        {showSecondLogo && schoolSettings.secondLogo ? <img src={schoolSettings.secondLogo} alt="Second Logo" className="h-24 w-24 object-contain" /> : <div className="w-24 h-24" />}
                    </div>

                    <div className="text-center flex-grow flex flex-col justify-start items-center w-full" style={{ paddingTop: `${verticalPadding}px`, paddingBottom: `${verticalPadding}px` }}>
                        <h1 style={{ fontSize: `${titleFontSize}px`, fontWeight: 'bold', margin: '0' }} className="font-unifrakturcook">
                            {title}
                        </h1>
                        <p className="text-center italic" style={{ fontSize: `${fontSize * 0.9}px`, margin: '0.5rem 0' }}>is given to</p>
                        <div className="whitespace-pre-wrap" style={{ lineHeight: lineHeight, wordSpacing: `${wordSpacing}px` }}>
                            {parseAdvancedMarkdownToReact(replacePlaceholders(content, studentData), fontSize, studentNameFontFamily)}
                        </div>
                    </div>
                    
                    <div className={`w-full flex ${signatories.length > 1 ? 'justify-around' : 'justify-center'} items-end pt-4 text-sm`}>
                        {signatories.map((sig, index) => (
                             <div key={index} className="text-center w-1/3 relative">
                                {sig.signature && ( <img src={sig.signature} alt={`${sig.name}'s Signature`} className="h-16 object-contain absolute -top-12 left-1/2 -translate-x-1/2 z-10" style={{width: '10rem'}}/> )}
                                <p className="font-bold pb-1 px-4 border-b-2 border-black uppercase">{sig.name}</p>
                                <div className="pt-1" style={{ whiteSpace: 'pre-wrap' }}>{sig.designation}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AiContentForm: React.FC<{onGenerate: (data: any) => void, onClose: () => void, isLoading: boolean}> = ({ onGenerate, onClose, isLoading }) => {
    const [formData, setFormData] = useState({ awardTitle: '', tone: 'Formal', achievements: '' });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!formData.awardTitle.trim()) { toast.error("Please provide an award title."); return; } onGenerate(formData); };
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label htmlFor="awardTitle" className="block text-sm font-medium">Award / Recognition Title</label><input type="text" id="awardTitle" name="awardTitle" value={formData.awardTitle} onChange={handleChange} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md p-2 h-10" placeholder="e.g., Top Performer in English" /></div>
        <div><label htmlFor="tone" className="block text-sm font-medium">Tone</label><select id="tone" name="tone" value={formData.tone} onChange={handleChange} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md p-2 h-10"><option>Formal</option><option>Inspirational</option><option>Celebratory</option><option>Heartfelt</option></select></div>
        <div><label htmlFor="achievements" className="block text-sm font-medium">Key Achievements (Optional)</label><textarea id="achievements" name="achievements" value={formData.achievements} onChange={handleChange} rows={3} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md p-2" placeholder="e.g., Won the school spelling bee..."></textarea></div>
        <div className="flex justify-end space-x-3 pt-4 border-t border-base-300 mt-6">
          <button type="button" onClick={onClose} disabled={isLoading} className="bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg">Cancel</button>
          <button type="submit" disabled={isLoading} className="flex items-center justify-center bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg"><SparklesIcon className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />{isLoading ? 'Generating...' : 'Generate Content'}</button>
        </div>
      </form>
    );
}

export default CertificateGenerator;