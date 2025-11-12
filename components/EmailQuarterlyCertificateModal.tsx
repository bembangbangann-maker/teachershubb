import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Student, CertificateSettings, SchoolSettings, Quarter } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { XIcon, SendIcon } from './icons';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface HonorStudent {
    student: Student;
    quarterlyGrade: number;
    honorStatus: string;
}

interface EmailQuarterlyCertificateModalProps {
    isOpen: boolean;
    onClose: () => void;
    honorStudents: HonorStudent[];
    gradeAndSection: string;
    subject: string;
    quarter: Quarter;
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
    'font-bookman': '"Bookman Old Style", serif'
};
const backgroundOptions = [
    { id: 'plain', name: 'Plain White', className: 'certificate-bg-plain' }, { id: 'parchment', name: 'Parchment', className: 'certificate-bg-parchment' }, { id: 'gradient', name: 'Subtle Gradient', className: 'certificate-bg-gradient' }, { id: 'border-simple', name: 'Simple Border', className: 'certificate-bg-border-simple' }, { id: 'border-double', name: 'Double Border', className: 'certificate-bg-border-double' }, { id: 'border-elegant', name: 'Elegant Corners', className: 'certificate-bg-border-elegant' }, { id: 'foil-corners', name: 'Foil Corners', className: 'certificate-bg-foil-corners' }, { id: 'floral-border', name: 'Floral Border', className: 'certificate-bg-floral-border' }, { id: 'watermark', name: 'Watermark', className: 'certificate-bg-watermark' }, { id: 'school-emblem', name: 'School Emblem', className: 'certificate-bg-school-emblem' }, { id: 'guilloche', name: 'Guilloche', className: 'certificate-bg-guilloche' }, { id: 'geometric', name: 'Geometric', className: 'certificate-bg-geometric' }, { id: 'dots', name: 'Dotted Pattern', className: 'certificate-bg-dots' }, { id: 'lines', name: 'Hatch Lines', className: 'certificate-bg-lines' }, { id: 'wavy-lines', name: 'Wavy Lines', className: 'certificate-bg-wavy-lines' }, { id: 'confetti', name: 'Confetti', className: 'certificate-bg-confetti' }];
const parseAdvancedMarkdownToReact = (text: string, baseFontSize: number, studentNameFont: string) => { const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|##.*?##|\^\^.*?\^\^|---|___)/g); return parts.map((part, index) => { if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>; if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>; if (part.startsWith('##') && part.endsWith('##')) return (
            <span key={index} style={{ 
                fontSize: `${baseFontSize * 1.5}px`, 
                fontWeight: 'bold',
            }}>
                {part.slice(2, -2)}
            </span>
        ); if (part.startsWith('^^') && part.endsWith('^^')) return (
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
            ); if (part === '---' || part === '___') return <hr key={index} className="w-1/2 mx-auto my-2" style={{ borderColor: 'currentColor', borderWidth: '0.5px' }} />; return part; }); };

// A self-contained preview component for PDF generation
const DynamicCertificatePreview: React.FC<{studentData: HonorStudent, certificateSettings: CertificateSettings, schoolSettings: SchoolSettings, gradeAndSection: string, subject: string, quarter: Quarter}> =
 ({studentData, certificateSettings, schoolSettings, gradeAndSection, subject, quarter}) => {
    const { title, content, fontFamily, studentNameFontFamily, fontSize, titleFontSize, lineHeight, backgroundStyle, showAdviser, showCoordinator, showPrincipal, showSchoolLogo, showSecondLogo, teacherDesignationType, customTeacherDesignation, verticalPadding, wordSpacing } = certificateSettings;
    
    const getDesignationText = (type: 'subjectTeacher' | 'classAdviser' | 'custom', customText: string) => {
        if (type === 'classAdviser') return 'Class Adviser';
        if (type === 'subjectTeacher') return 'Subject Teacher';
        return customText;
    };
    const adviserDesignation = getDesignationText(teacherDesignationType, customTeacherDesignation);

    const getQuarterText = (q: Quarter) => { if (q === 1) return '1st'; if (q === 2) return '2nd'; if (q === 3) return '3rd'; return '4th'; };
    
    const replacePlaceholders = (template: string, data: HonorStudent) => {
        const now = new Date(); const day = now.getDate(); const dayWithSuffix = day + (day % 10 == 1 && day != 11 ? 'st' : day % 10 == 2 && day != 12 ? 'nd' : day % 10 == 3 && day != 13 ? 'rd' : 'th');
        const formattedStudentName = `${data.student.firstName} ${data.student.middleName ? data.student.middleName.charAt(0) + '.' : ''} ${data.student.lastName}`.toUpperCase();
        
        return template.replace(/\[STUDENT_NAME\]/g, formattedStudentName).replace(/\[GRADE_AND_SECTION\]/g, gradeAndSection).replace(/\[AWARD_TYPE\]/g, data.honorStatus).replace(/\[SUBJECT\]/g, subject).replace(/\[QUARTER\]/g, getQuarterText(quarter)).replace(/\[SCHOOL_YEAR\]/g, schoolSettings.schoolYear).replace(/\[TEACHER_NAME\]/g, schoolSettings.teacherName).replace(/\[SCHOOL_NAME\]/g, schoolSettings.schoolName).replace(/\[DAY\]/g, dayWithSuffix).replace(/\[MONTH\]/g, now.toLocaleString('default', { month: 'long' })).replace(/\[YEAR\]/g, now.getFullYear().toString());
    };
    
    const backgroundClassName = backgroundOptions.find(b => b.id === backgroundStyle)?.className || '';

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


const EmailQuarterlyCertificateModal: React.FC<EmailQuarterlyCertificateModalProps> = ({ isOpen, onClose, honorStudents, gradeAndSection, subject, quarter }) => {
    const { settings, certificateSettings, updateCertificateSettings, updateStudent } = useAppContext();
    const [emailSubject, setEmailSubject] = useState(certificateSettings.emailSubject);
    const [emailBody, setEmailBody] = useState(certificateSettings.emailBody);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setEmailSubject(certificateSettings.emailSubject);
            setEmailBody(certificateSettings.emailBody);
        }
    }, [certificateSettings, isOpen]);

    const handleSaveTemplate = () => {
        updateCertificateSettings({ emailSubject, emailBody });
        toast.success("Email template saved!");
    };
    
    const getQuarterText = (q: Quarter) => { if (q === 1) return '1st'; if (q === 2) return '2nd'; if (q === 3) return '3rd'; return '4th'; };
    const replacePlaceholders = (template: string, studentData: HonorStudent) => {
        return template
            .replace(/\[STUDENT_NAME\]/g, `${studentData.student.firstName} ${studentData.student.lastName}`)
            .replace(/\[AWARD_TYPE\]/g, studentData.honorStatus)
            .replace(/\[SUBJECT\]/g, subject)
            .replace(/\[QUARTER\]/g, getQuarterText(quarter))
            .replace(/\[TEACHER_NAME\]/g, settings.teacherName);
    };

    const handlePrepareEmail = async (studentData: HonorStudent) => {
        if (!studentData.student.contactInfo?.trim()) {
            toast.error(`Please enter a valid email for ${studentData.student.firstName}.`);
            return;
        }
        setIsProcessing(studentData.student.id);
        const toastId = toast.loading(`Generating certificate for ${studentData.student.firstName}...`);

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed'; tempContainer.style.left = '-9999px'; tempContainer.style.top = '0'; tempContainer.style.width = '1123px'; tempContainer.style.height = '794px';
        document.body.appendChild(tempContainer);

        const root = ReactDOM.createRoot(tempContainer);
        root.render(
            <React.StrictMode>
                <DynamicCertificatePreview studentData={studentData} certificateSettings={certificateSettings} schoolSettings={settings} gradeAndSection={gradeAndSection} subject={subject} quarter={quarter} />
            </React.StrictMode>
        );

        try {
            await new Promise(resolve => setTimeout(resolve, 300));
            const canvas = await html2canvas(tempContainer.querySelector('.aspect-\\[297\\/210\\]') as HTMLElement, { scale: 2, logging: false, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 0.85);
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            pdf.addImage(imgData, 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
            pdf.save(`Certificate - ${studentData.student.lastName}, ${studentData.student.firstName}.pdf`);
            
            const finalSubject = replacePlaceholders(emailSubject, studentData);
            const finalBody = replacePlaceholders(emailBody, studentData);
            window.location.href = `mailto:${studentData.student.contactInfo}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
            toast.success(`Certificate downloaded. Please attach it to the new email.`, { id: toastId, duration: 8000 });
        } catch (e) {
            console.error("Email prep failed", e);
            toast.error("Failed to prepare email.", { id: toastId });
        } finally {
            root.unmount();
            document.body.removeChild(tempContainer);
            setIsProcessing(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-base-100 bg-opacity-90 z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-base-300 rounded-xl shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-base-100">
                    <h2 className="text-2xl font-bold text-base-content flex items-center gap-3"><SendIcon />Certificate Email Center</h2>
                    <button onClick={onClose} className="text-base-content hover:text-white"><XIcon /></button>
                </div>
                <div className="flex-grow p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-primary">Email Template</h3>
                        <div>
                            <label className="block text-sm font-medium text-base-content mb-1">Email Subject</label>
                            <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="w-full bg-base-100 border border-base-200 rounded-md p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-base-content mb-1">Email Body</label>
                            <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={10} className="w-full bg-base-100 border border-base-200 rounded-md p-2 text-sm" />
                        </div>
                        <div className="text-xs text-base-content/70">
                            <p className="font-semibold">Available Placeholders:</p>
                            <p>[STUDENT_NAME], [AWARD_TYPE], [SUBJECT], [QUARTER], [TEACHER_NAME]</p>
                        </div>
                        <button onClick={handleSaveTemplate} className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg">Save Template</button>
                    </div>

                    <div className="space-y-3">
                         <h3 className="text-xl font-bold text-primary">Honor Students ({honorStudents.length})</h3>
                         <div className="space-y-3 overflow-y-auto max-h-[calc(90vh-200px)] pr-2">
                             {honorStudents.map(studentData => (
                                <div key={studentData.student.id} className="bg-base-200 p-3 rounded-md">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-grow">
                                            <p className="font-semibold text-base-content">{`${studentData.student.lastName}, ${studentData.student.firstName}`}</p>
                                            <p className="text-xs text-info">{studentData.honorStatus} ({studentData.quarterlyGrade})</p>
                                        </div>
                                        <button onClick={() => handlePrepareEmail(studentData)} disabled={!!isProcessing} className="flex-shrink-0 flex items-center justify-center bg-primary hover:bg-primary-focus text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors disabled:opacity-50">
                                            <SendIcon className="w-4 h-4 mr-2" />
                                            {isProcessing === studentData.student.id ? 'Processing...' : 'Send Email'}
                                        </button>
                                    </div>
                                     <input type="email" defaultValue={studentData.student.contactInfo || ''}
                                        onBlur={(e) => {
                                            const newEmail = e.target.value.trim();
                                            if (newEmail !== (studentData.student.contactInfo || '')) {
                                                updateStudent(studentData.student.id, { contactInfo: newEmail });
                                                toast.success(`Email updated for ${studentData.student.firstName}`);
                                            }
                                        }}
                                        placeholder="Enter and save student's email"
                                        className="w-full bg-base-100 border border-base-200 rounded-md py-1 px-2 text-sm mt-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                             ))}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailQuarterlyCertificateModal;