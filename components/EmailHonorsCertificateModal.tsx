import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Student, HonorsCertificateSettings, SchoolSettings } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { XIcon, SendIcon } from './icons';
import { toast } from 'react-hot-toast';
import CertificatePreview from './CertificatePreview';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface HonorStudentData {
    student: Student;
    generalAvg: number;
    award: string;
}

interface EmailHonorsCertificateModalProps {
    isOpen: boolean;
    onClose: () => void;
    honorStudents: HonorStudentData[];
    gradeAndSection: string;
    settings: SchoolSettings;
    honorsCertificateSettings: HonorsCertificateSettings;
}

const EmailHonorsCertificateModal: React.FC<EmailHonorsCertificateModalProps> = ({ isOpen, onClose, honorStudents, gradeAndSection, settings, honorsCertificateSettings }) => {
    const { updateHonorsCertificateSettings, updateStudent } = useAppContext();
    const [emailSubject, setEmailSubject] = useState(honorsCertificateSettings.emailSubject);
    const [emailBody, setEmailBody] = useState(honorsCertificateSettings.emailBody);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setEmailSubject(honorsCertificateSettings.emailSubject);
            setEmailBody(honorsCertificateSettings.emailBody);
        }
    }, [honorsCertificateSettings, isOpen]);

    const handleSaveTemplate = () => {
        updateHonorsCertificateSettings({ emailSubject, emailBody });
        toast.success("Email template saved!");
    };
    
    const replacePlaceholders = (template: string, studentData: HonorStudentData) => {
        return template
            .replace(/\[STUDENT_NAME\]/g, `${studentData.student.firstName} ${studentData.student.lastName}`)
            .replace(/\[AWARD_TYPE\]/g, studentData.award)
            .replace(/\[GENERAL_AVERAGE\]/g, studentData.generalAvg.toFixed(2))
            .replace(/\[TEACHER_NAME\]/g, settings.teacherName)
            .replace(/\[GRADE_AND_SECTION\]/g, gradeAndSection);
    };

    const handlePrepareEmail = async (studentData: HonorStudentData) => {
        if (!studentData.student.contactInfo?.trim()) {
            toast.error(`Please enter a valid email for ${studentData.student.firstName}.`);
            return;
        }
        setIsProcessing(studentData.student.id);
        const toastId = toast.loading(`Generating certificate for ${studentData.student.firstName}...`);

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = '1123px';
        tempContainer.style.height = '794px';
        document.body.appendChild(tempContainer);

        const root = ReactDOM.createRoot(tempContainer);
        root.render(
            <React.StrictMode>
                <CertificatePreview
                    studentData={studentData}
                    certificateSettings={honorsCertificateSettings}
                    gradeAndSection={gradeAndSection}
                    schoolSettings={settings}
                />
            </React.StrictMode>
        );

        try {
            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(tempContainer.querySelector('.aspect-\\[297\\/210\\]') as HTMLElement, { scale: 2, logging: false, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 0.85);
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            pdf.addImage(imgData, 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
            const studentFullName = `${studentData.student.lastName}, ${studentData.student.firstName}`;
            pdf.save(`Certificate - ${studentFullName}.pdf`);
            
            const subject = replacePlaceholders(emailSubject, studentData);
            const body = replacePlaceholders(emailBody, studentData);
            const mailtoLink = `mailto:${studentData.student.contactInfo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoLink;

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
                    {/* Email Template */}
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
                            <p>[STUDENT_NAME], [AWARD_TYPE], [GENERAL_AVERAGE], [TEACHER_NAME]</p>
                        </div>
                        <button onClick={handleSaveTemplate} className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg">Save Template</button>
                    </div>

                    {/* Student List */}
                    <div className="space-y-3">
                         <h3 className="text-xl font-bold text-primary">Honor Students ({honorStudents.length})</h3>
                         <div className="space-y-3 overflow-y-auto max-h-[calc(90vh-200px)] pr-2">
                             {honorStudents.map(studentData => (
                                <div key={studentData.student.id} className="bg-base-200 p-3 rounded-md">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-grow">
                                            <p className="font-semibold text-base-content">{`${studentData.student.lastName}, ${studentData.student.firstName}`}</p>
                                            <p className="text-xs text-info">{studentData.award} ({studentData.generalAvg.toFixed(2)})</p>
                                        </div>
                                        <button
                                            onClick={() => handlePrepareEmail(studentData)}
                                            disabled={!!isProcessing}
                                            className="flex-shrink-0 flex items-center justify-center bg-primary hover:bg-primary-focus text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors disabled:opacity-50"
                                        >
                                            <SendIcon className="w-4 h-4 mr-2" />
                                            {isProcessing === studentData.student.id ? 'Processing...' : 'Send Email'}
                                        </button>
                                    </div>
                                     <input
                                        type="email"
                                        defaultValue={studentData.student.contactInfo || ''}
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

export default EmailHonorsCertificateModal;