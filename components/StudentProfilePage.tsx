import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Quarter, Student, StudentProfileDocxData } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { calculateInitialGrade, transmuteGrade } from '../utils/transmutation';
import { SparklesIcon, UsersIcon, EditIcon, UploadIcon, DownloadIcon } from './icons';
import { toast } from 'react-hot-toast';
import ReportCardCommentGenerator from './ReportCardCommentGenerator';
import Header from './Header';
import Modal from './Modal';
import StudentForm from './StudentForm';
import { docxService } from '../services/docxService';
import html2canvas from 'html2canvas';


const MAPEH_COMPONENTS = ["Music", "Arts", "PE", "Health"];

const StudentProfilePage: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const { students, classRecords, classRecordSettings, attendance, anecdotes, honorsCalculationData, updateStudent, settings } = useAppContext();
    const [isCommentGeneratorOpen, setIsCommentGeneratorOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const photoUploadRef = React.useRef<HTMLInputElement>(null);

    const student = useMemo(() => students.find(s => s.id === studentId), [students, studentId]);

    const academicSummary = useMemo(() => {
        if (!student) return [];
        const subjectOrder = ['Fil', 'Eng', 'Math', 'Sci', 'AP', 'EsP', 'TLE', 'MAPEH', 'Music', 'Arts', 'PE', 'Health'];
        const customSort = (a: { subject: string }, b: { subject: string }) => {
            const normalize = (subjectName: string): string => {
                const s = subjectName.toLowerCase();
                if (s.startsWith('fil')) return 'Fil'; if (s.startsWith('eng')) return 'Eng'; if (s.startsWith('math')) return 'Math'; if (s.startsWith('scien')) return 'Sci'; if (s === 'ap' || s.startsWith('araling')) return 'AP'; if (s === 'esp' || s.startsWith('edukasyon sa pag')) return 'EsP'; if (s === 'tle' || s.startsWith('technology')) return 'TLE'; if (s === 'physical education') return 'PE';
                return subjectName;
            };
            const normalizedA = normalize(a.subject); const normalizedB = normalize(b.subject);
            const indexA = subjectOrder.indexOf(normalizedA); const indexB = subjectOrder.indexOf(normalizedB);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB; if (indexA !== -1) return -1; if (indexB !== -1) return 1;
            return a.subject.localeCompare(b.subject);
        };

        const honorsDataForBatch = honorsCalculationData.find(d => d.batchId === student.importBatchId);
        if (honorsDataForBatch) {
            const studentHonorsGrades = honorsDataForBatch.studentGrades[student.id];
            if (studentHonorsGrades) {
                const summary = honorsDataForBatch.subjects.map(subject => ({ subject, grades: studentHonorsGrades[subject] || Array(4).fill(null) }));
                const hasMapehComponents = MAPEH_COMPONENTS.every(comp => honorsDataForBatch.subjects.includes(comp));
                if (hasMapehComponents) {
                    const mapehGrades: (number | null)[] = Array(4).fill(null);
                    for (let i = 0; i < 4; i++) {
                        const quarterlyMapehGrades = MAPEH_COMPONENTS.map(comp => studentHonorsGrades[comp]?.[i]).filter(g => g != null) as number[];
                        if (quarterlyMapehGrades.length === 4) {
                            mapehGrades[i] = Math.round(quarterlyMapehGrades.reduce((a, b) => a + b, 0) / 4);
                        }
                    }
                    summary.push({ subject: 'MAPEH', grades: mapehGrades });
                }
                return summary.sort(customSort);
            }
        }

        const subjects = new Set<string>();
        classRecords.filter(r => r.studentId === student.id).forEach(r => subjects.add(r.subject));
        const summary = Array.from(subjects).map(subject => {
            const grades: (number | null)[] = [];
            for (let q: Quarter = 1; q <= 4; q++) {
                const record = classRecords.find(r => r.studentId === student.id && r.subject === subject && r.quarter === q);
                const settings = classRecordSettings.find(s => s.subject === subject && s.quarter === q && s.batchId === student.importBatchId);
                if (record && settings) {
                    const { initialGrade } = calculateInitialGrade(record, settings);
                    grades.push(initialGrade !== null ? transmuteGrade(initialGrade) : null);
                } else {
                    grades.push(null);
                }
            }
            return { subject, grades };
        });
        return summary.sort(customSort);
    }, [student, classRecords, classRecordSettings, honorsCalculationData]);

    const attendanceSummary = useMemo(() => {
        if (!student) return { month: '', absences: 0, lates: 0 };
        const now = new Date(); const year = now.getFullYear(); const month = now.getMonth();
        let absences = 0, lates = 0;
        attendance.forEach(att => {
            if (att.studentId === student.id) {
                const attDate = new Date(att.date + 'T00:00:00Z');
                if (attDate.getUTCFullYear() === year && attDate.getUTCMonth() === month) {
                    if (att.status === 'absent') absences++; if (att.status === 'late') lates++;
                }
            }
        });
        return { month: now.toLocaleString('default', { month: 'long' }), absences, lates };
    }, [student, attendance]);

    const recentAnecdotes = useMemo(() => {
        if (!student) return [];
        return anecdotes.filter(a => a.studentId === student.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
    }, [student, anecdotes]);

    const handleDownloadDocx = async () => {
        if (!student) return;
        setIsDownloading(true);
        const toastId = toast.loading('Generating Word document...');

        try {
            const dataForDocx: StudentProfileDocxData = {
                student,
                academicSummary,
                attendanceSummary,
                recentAnecdotes,
                settings,
            };

            await docxService.generateStudentProfileDocx(dataForDocx);

            toast.success('Word document downloaded!', { id: toastId });
        } catch (error) {
            console.error("DOCX generation failed:", error);
            toast.error('Failed to generate Word document.', { id: toastId });
        } finally {
            setIsDownloading(false);
        }
    };
    
    const handleDownloadPng = async () => {
        if (!student) return;

        const profileElement = document.getElementById('student-profile-printable');
        if (!profileElement) {
            toast.error("Profile element not found for capture.");
            return;
        }
        
        setIsDownloading(true);
        const toastId = toast.loading('Generating PNG image...');

        document.body.classList.add('png-export-active');

        try {
            const canvas = await html2canvas(profileElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            const image = canvas.toDataURL('image/png', 1.0);
            
            const link = document.createElement('a');
            link.download = `${student.lastName}_${student.firstName}_Profile.png`;
            link.href = image;
            link.click();

            toast.success('PNG downloaded!', { id: toastId });
        } catch (error) {
            console.error("PNG generation failed:", error);
            toast.error('Failed to generate PNG.', { id: toastId });
        } finally {
            document.body.classList.remove('png-export-active');
            setIsDownloading(false);
        }
    };

    const handleSaveProfile = (studentData: Omit<Student, 'id'>) => {
        if (student) {
            updateStudent(student.id, studentData);
            toast.success("Profile updated successfully!");
            setIsEditModalOpen(false);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!student) return;
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateStudent(student.id, { photo: reader.result as string });
                toast.success("Photo updated!");
            };
            reader.readAsDataURL(file);
        } else if (file) {
            toast.error("Please select a valid image file (PNG, JPG).");
        }
    };

    if (!student) {
        return (
            <div>
                <Header title="Student Not Found" />
                <div className="p-8 text-center">
                    <p>The requested student could not be found.</p>
                    <Link to="/students" className="text-primary hover:underline mt-4 inline-block">Return to Class Roster</Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <Header title="Student Profile" />
            <div className="p-4 md:p-8">
                <div id="student-profile-printable">
                    <div className="bg-base-200 p-6 rounded-lg shadow-lg">
                        <div className="print-header-info flex items-center justify-center gap-4 text-center mb-4 border-b border-base-300 pb-4">
                            {settings.schoolLogo && (
                                <img src={settings.schoolLogo} alt="School Logo" className="h-20 w-20 object-contain" />
                            )}
                            <div>
                                <h1 className="text-xl font-bold">{settings.schoolName}</h1>
                                <h2 className="text-md">Student Profile Summary</h2>
                                <p className="text-sm">SY {settings.schoolYear}</p>
                            </div>
                        </div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-base-300">
                            <div>
                                <h3 className="text-3xl font-bold text-base-content">{student.firstName} {student.lastName}</h3>
                                <p className="text-sm text-base-content/70">LRN: {student.lrn || 'N/A'} | Grade {student.gradeLevel || 'N/A'} - {student.section || 'N/A'}</p>
                            </div>
                            <div className="flex items-center gap-2 print-hide flex-wrap">
                                <Link to="/students" className="flex items-center gap-2 bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                    <UsersIcon className="w-5 h-5" /> Back to Roster
                                </Link>
                                 <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                    <EditIcon className="w-5 h-5" /> Edit Profile
                                </button>
                                <button onClick={() => setIsCommentGeneratorOpen(true)} className="flex items-center gap-2 bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                    <SparklesIcon className="w-5 h-5" /> AI Comment
                                </button>
                                <div className="flex items-center bg-primary rounded-lg">
                                    <button onClick={handleDownloadDocx} disabled={isDownloading} className="flex items-center gap-2 px-4 py-2 text-white font-bold rounded-l-lg hover:bg-primary-focus transition-colors disabled:opacity-50">
                                        <DownloadIcon className="w-5 h-5" />
                                        <span>Word</span>
                                    </button>
                                    <div className="h-full w-px bg-primary-focus"></div>
                                    <button onClick={handleDownloadPng} disabled={isDownloading} className="flex items-center gap-2 px-4 py-2 text-white font-bold rounded-r-lg hover:bg-primary-focus transition-colors disabled:opacity-50">
                                        <DownloadIcon className="w-5 h-5" />
                                        <span>PNG</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                            <div className="lg:col-span-1 space-y-6">
                                {/* Photo */}
                                <div className="group relative">
                                    <div className="aspect-square w-full max-w-sm mx-auto bg-base-100 rounded-lg flex items-center justify-center overflow-hidden">
                                        {student.photo ? (
                                            <img src={student.photo} alt={`${student.firstName} ${student.lastName}`} className="w-full h-full object-cover" />
                                        ) : (
                                            <UsersIcon className="w-24 h-24 text-base-300" />
                                        )}
                                    </div>
                                    <button onClick={() => photoUploadRef.current?.click()} className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-lg print-hide">
                                        <UploadIcon className="w-12 h-12" />
                                    </button>
                                    <input type="file" ref={photoUploadRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                                </div>

                                {/* Attendance & Records */}
                                <div>
                                    <h4 className="text-xl font-bold text-primary mb-2">Attendance ({attendanceSummary.month})</h4>
                                    <div className="bg-base-100 p-4 rounded-md text-center">
                                        <span className="text-3xl font-bold">{attendanceSummary.absences}</span> <span className="text-base-content/70">Absences</span>
                                        <span className="mx-4 text-base-content/30">|</span>
                                        <span className="text-3xl font-bold">{attendanceSummary.lates}</span> <span className="text-base-content/70">Tardies</span>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-primary mb-2">Recent Anecdotal Records</h4>
                                    <div className="space-y-2">
                                        {recentAnecdotes.map(anecdote => (
                                            <div key={anecdote.id} className="bg-base-100 p-3 rounded-md">
                                                <p className="text-xs text-base-content/70">{new Date(anecdote.date).toLocaleDateString()}</p>
                                                <p className="text-sm italic">"{anecdote.observation}"</p>
                                            </div>
                                        ))}
                                        {recentAnecdotes.length === 0 && (
                                            <div className="bg-base-100 p-3 rounded-md text-center italic text-sm text-base-content/70">No records found.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-2">
                                <h4 className="text-xl font-bold text-primary mb-2">Quarterly Grades Summary</h4>
                                <div className="bg-base-100 p-3 rounded-md overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-base-content/70">
                                                <th className="p-2 font-semibold">Subject</th>
                                                <th className="p-2 text-center font-semibold">Q1</th>
                                                <th className="p-2 text-center font-semibold">Q2</th>
                                                <th className="p-2 text-center font-semibold">Q3</th>
                                                <th className="p-2 text-center font-semibold">Q4</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {academicSummary.map(({ subject, grades }) => (
                                                <tr key={subject} className="border-t border-base-300">
                                                    <td className="p-2 font-semibold">{subject}</td>
                                                    {grades.map((g, i) => <td key={i} className={`p-2 text-center font-mono ${g && g < 75 ? 'text-error font-bold' : ''}`}>{g ?? '-'}</td>)}
                                                </tr>
                                            ))}
                                            {academicSummary.length === 0 && (
                                                <tr><td colSpan={5} className="text-center p-4 italic text-base-content/70">No grades recorded.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div className="print-footer-info text-right mt-8 pt-4 border-t border-base-300 text-sm">
                            <p>Prepared by:</p>
                            <div className="h-12"></div>
                            <p className="font-bold uppercase">{settings.teacherName}</p>
                            <p>Class Adviser</p>
                        </div>
                    </div>
                </div>
            </div>
            {isCommentGeneratorOpen && (
                <ReportCardCommentGenerator
                    isOpen={isCommentGeneratorOpen}
                    onClose={() => setIsCommentGeneratorOpen(false)}
                    student={student}
                />
            )}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Student Profile">
                <StudentForm
                    onSave={handleSaveProfile}
                    onClose={() => setIsEditModalOpen(false)}
                    studentToEdit={student}
                />
            </Modal>
        </>
    );
};

export default StudentProfilePage;