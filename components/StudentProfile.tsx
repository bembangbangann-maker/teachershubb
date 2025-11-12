import React, { useMemo, useState } from 'react';
import { Student, Quarter } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { calculateInitialGrade, transmuteGrade } from '../utils/transmutation';
import { PrinterIcon, SparklesIcon } from './icons';
import { toast } from 'react-hot-toast';
import ReportCardCommentGenerator from './ReportCardCommentGenerator';

interface StudentProfileProps {
    student: Student;
}

const MAPEH_COMPONENTS = ["Music", "Arts", "PE", "Health"];

const StudentProfile: React.FC<StudentProfileProps> = ({ student }) => {
    const { classRecords, classRecordSettings, attendance, anecdotes, honorsCalculationData } = useAppContext();
    const [isCommentGeneratorOpen, setIsCommentGeneratorOpen] = useState(false);

    const academicSummary = useMemo(() => {
        // Define the desired subject order
        const subjectOrder = [
            'Fil', 
            'Eng', 
            'Math', 
            'Sci', 
            'AP', 
            'EsP', 
            'TLE', 
            'MAPEH', 
            'Music', 
            'Arts', 
            'PE', 
            'Health'
        ];

        const customSort = (a: { subject: string }, b: { subject: string }) => {
            // Normalize names to handle variations like 'Filipino' vs 'Fil'
            const normalize = (subjectName: string): string => {
                const s = subjectName.toLowerCase();
                if (s.startsWith('fil')) return 'Fil';
                if (s.startsWith('eng')) return 'Eng';
                if (s.startsWith('math')) return 'Math';
                if (s.startsWith('scien')) return 'Sci';
                if (s === 'ap' || s.startsWith('araling')) return 'AP';
                if (s === 'esp' || s.startsWith('edukasyon sa pag')) return 'EsP';
                if (s === 'tle' || s.startsWith('technology')) return 'TLE';
                if (s === 'physical education') return 'PE';
                return subjectName; // Return original case for matching
            };
            
            const normalizedA = normalize(a.subject);
            const normalizedB = normalize(b.subject);

            const indexA = subjectOrder.indexOf(normalizedA);
            const indexB = subjectOrder.indexOf(normalizedB);
        
            if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB; // Both subjects are in the ordered list
            }
            if (indexA !== -1) {
                return -1; // a is in the list, b is not; a comes first
            }
            if (indexB !== -1) {
                return 1; // b is in the list, a is not; b comes first
            }
            return a.subject.localeCompare(b.subject); // Neither is in the list, sort alphabetically
        };

        // Priority 1: Use data from Honors Calculator if available for the student's batch
        const honorsDataForBatch = honorsCalculationData.find(d => d.batchId === student.importBatchId);
        if (honorsDataForBatch) {
            const studentHonorsGrades = honorsDataForBatch.studentGrades[student.id];
            if (studentHonorsGrades) {
                const summary = honorsDataForBatch.subjects.map(subject => ({
                    subject,
                    grades: studentHonorsGrades[subject] || [null, null, null, null]
                }));
                // A special case: if MAPEH components exist, calculate and add a MAPEH average row.
                const hasMapehComponents = MAPEH_COMPONENTS.every(comp => honorsDataForBatch.subjects.includes(comp));
                if (hasMapehComponents) {
                    const mapehGrades: (number | null)[] = [null, null, null, null];
                    for (let i = 0; i < 4; i++) { // For each quarter
                        const quarterlyMapehGrades = MAPEH_COMPONENTS.map(comp => {
                            return studentHonorsGrades[comp]?.[i];
                        }).filter(g => g !== null && g !== undefined) as number[];
                        
                        if (quarterlyMapehGrades.length === 4) {
                            mapehGrades[i] = Math.round(quarterlyMapehGrades.reduce((a, b) => a + b, 0) / 4);
                        }
                    }
                    summary.push({ subject: 'MAPEH', grades: mapehGrades });
                }

                return summary.sort(customSort);
            }
        }

        // Fallback: Calculate from class records if honors data isn't available
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
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        let absences = 0;
        let lates = 0;

        attendance.forEach(att => {
            if (att.studentId === student.id) {
                const attDate = new Date(att.date + 'T00:00:00Z');
                if (attDate.getUTCFullYear() === year && attDate.getUTCMonth() === month) {
                    if (att.status === 'absent') absences++;
                    if (att.status === 'late') lates++;
                }
            }
        });

        return { month: now.toLocaleString('default', { month: 'long' }), absences, lates };
    }, [student, attendance]);

    const recentAnecdotes = useMemo(() => {
        return anecdotes
            .filter(a => a.studentId === student.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3);
    }, [student, anecdotes]);
    
    const handlePrint = () => {
        const modalContent = document.getElementById('student-profile-printable');
        if (!modalContent) {
            toast.error("Could not find profile content to print.");
            return;
        }
        
        // This relies on the @media print styles in index.html
        window.print();
    };

    return (
        <>
            <div id="student-profile-printable">
                <div className="bg-base-100 p-6 rounded-lg">
                    {/* Header */}
                    <div className="flex justify-between items-center pb-4 border-b border-base-300">
                        <div>
                            <h3 className="text-2xl font-bold text-base-content">{student.firstName} {student.lastName}</h3>
                            <p className="text-sm text-base-content/70">LRN: {student.lrn || 'N/A'}</p>
                            <p className="text-sm text-base-content/70">Grade {student.gradeLevel || 'N/A'} - {student.section || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-2 print-hide">
                             <button onClick={() => setIsCommentGeneratorOpen(true)} className="flex items-center gap-2 bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                <SparklesIcon className="w-5 h-5" />
                                Generate AI Comment
                            </button>
                            <button onClick={handlePrint} className="flex items-center gap-2 bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                <PrinterIcon className="w-5 h-5" />
                                Print Profile
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        {/* Academic Summary */}
                        <div>
                            <h4 className="text-lg font-bold text-primary mb-2">Quarterly Grades</h4>
                            <div className="bg-base-200 p-3 rounded-md">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-base-content/70">
                                            <th className="p-1 font-semibold">Subject</th>
                                            <th className="p-1 text-center font-semibold">Q1</th>
                                            <th className="p-1 text-center font-semibold">Q2</th>
                                            <th className="p-1 text-center font-semibold">Q3</th>
                                            <th className="p-1 text-center font-semibold">Q4</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {academicSummary.map(({ subject, grades }) => (
                                            <tr key={subject} className="border-t border-base-300">
                                                <td className="p-1 font-semibold">{subject}</td>
                                                {grades.map((g, i) => <td key={i} className={`p-1 text-center font-mono ${g && g < 75 ? 'text-error' : ''}`}>{g ?? '-'}</td>)}
                                            </tr>
                                        ))}
                                        {academicSummary.length === 0 && (
                                            <tr><td colSpan={5} className="text-center p-4 italic text-base-content/70">No grades recorded.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Attendance & Records */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-lg font-bold text-primary mb-2">Attendance Summary ({attendanceSummary.month})</h4>
                                 <div className="bg-base-200 p-4 rounded-md text-center">
                                    <span className="text-2xl font-bold">{attendanceSummary.absences}</span> <span className="text-base-content/70">Absences</span>
                                    <span className="mx-4 text-base-content/30">|</span>
                                    <span className="text-2xl font-bold">{attendanceSummary.lates}</span> <span className="text-base-content/70">Tardies</span>
                                 </div>
                            </div>
                             <div>
                                <h4 className="text-lg font-bold text-primary mb-2">Recent Anecdotal Records</h4>
                                 <div className="space-y-2">
                                    {recentAnecdotes.map(anecdote => (
                                        <div key={anecdote.id} className="bg-base-200 p-3 rounded-md">
                                            <p className="text-xs text-base-content/70">{new Date(anecdote.date).toLocaleDateString()}</p>
                                            <p className="text-sm italic">"{anecdote.observation}"</p>
                                        </div>
                                    ))}
                                    {recentAnecdotes.length === 0 && (
                                         <div className="bg-base-200 p-3 rounded-md text-center italic text-sm text-base-content/70">No records found.</div>
                                    )}
                                 </div>
                            </div>
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
        </>
    );
};

export default StudentProfile;