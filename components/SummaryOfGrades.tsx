import React, { useMemo, useState, useEffect } from 'react';
import { Student, Quarter, Section, SummaryOfGradesData } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { calculateInitialGrade, transmuteGrade, getRemark } from '../utils/transmutation';
import { docxService } from '../services/docxService';
import { excelService } from '../services/excelService';
import { toast } from 'react-hot-toast';
import { DownloadIcon } from './icons';

interface SummaryOfGradesProps {
    students: Student[];
    batchId: string;
    subject: string;
}

const HeaderField = ({ label, value }: { label: string, value: string | React.ReactNode }) => (
    <div className="flex items-baseline border-b border-base-300 pb-1">
        <span className="font-bold text-base-content/80 w-32">{label}</span>
        <span className="text-base-content font-semibold">{value}</span>
    </div>
);


const SummaryOfGrades: React.FC<SummaryOfGradesProps> = ({ students, batchId, subject }) => {
    const { classRecords, classRecordSettings, settings, saveSchoolSettings } = useAppContext();
    const [isDownloading, setIsDownloading] = useState(false);
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    
    useEffect(() => {
        const savedId = localStorage.getItem('summaryOfGradesSectionId');
        if (savedId) {
            setSelectedSectionId(savedId);
        }
    }, []);
  
    useEffect(() => {
        localStorage.setItem('summaryOfGradesSectionId', selectedSectionId);
    }, [selectedSectionId]);

    const selectedSectionText = useMemo(() => {
        if (!selectedSectionId) return '';
        const section = settings.sections.find(s => s.id === selectedSectionId);
        return section ? `${section.gradeLevel} - ${section.sectionName}` : '';
    }, [selectedSectionId, settings.sections]);

    useEffect(() => {
        const studentInfo = students.find(s => s.importBatchId === batchId);
        if(studentInfo && settings.sections.length > 0) {
            const matchedSection = settings.sections.find(s => s.gradeLevel === studentInfo.gradeLevel && s.sectionName === studentInfo.section);
            if (matchedSection) {
                setSelectedSectionId(matchedSection.id);
            } else if (settings.sections.length > 0) {
                setSelectedSectionId(settings.sections[0].id);
            }
        }
    }, [batchId, students, settings.sections]);

    const handleDownloadWord = async () => {
        if (!selectedSectionId) {
            toast.error("Please select a class first.");
            return;
        }
        setIsDownloading(true);
        const toastId = toast.loading('Generating Word document...');
        try {
            await docxService.generateSummaryOfGradesDocx({
                students: sortedStudents,
                settings: settings,
                subject: subject,
                summaryStats: summaryStats,
                selectedSectionText: selectedSectionText
            });
            toast.success('Word document downloaded successfully!', { id: toastId });
        } catch(error) {
            console.error("Error generating DOCX:", error);
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            toast.error(`Failed to generate Word document: ${message}`, { id: toastId });
        } finally {
            setIsDownloading(false);
        }
    }

    const handleDownloadXlsx = async () => {
        if (!selectedSectionId) {
            toast.error("Please select a class first.");
            return;
        }
        setIsDownloading(true);
        const toastId = toast.loading('Generating Excel spreadsheet...');
        try {
            const dataForExport: SummaryOfGradesData = {
                students: sortedStudents,
                settings: settings,
                subject: subject,
                selectedSectionText: selectedSectionText,
                summaryStats: summaryStats,
            };
            excelService.generateSummaryOfGradesXlsx(dataForExport);
            toast.success('Excel spreadsheet downloaded successfully!', { id: toastId });
        } catch(error) {
            console.error("Error generating XLSX:", error);
            const message = error instanceof Error ? error.message : "An unknown error occurred.";
            toast.error(`Failed to generate Excel spreadsheet: ${message}`, { id: toastId });
        } finally {
            setIsDownloading(false);
        }
    };

    const studentGrades = useMemo(() => {
        return students.map(student => {
            const quarterlyGrades: (number | null)[] = [];
            for (let q: Quarter = 1; q <= 4; q++) {
                const record = classRecords.find(r => r.studentId === student.id && r.subject === subject && r.quarter === q && r.batchId === batchId);
                const settingsRecord = classRecordSettings.find(s => s.subject === subject && s.quarter === q && s.batchId === batchId);
                if (record && settingsRecord) {
                    const { initialGrade } = calculateInitialGrade(record, settingsRecord);
                    if (initialGrade !== null) {
                        quarterlyGrades.push(transmuteGrade(initialGrade));
                    } else {
                        quarterlyGrades.push(null);
                    }
                } else {
                    quarterlyGrades.push(null);
                }
            }

            const validGrades = quarterlyGrades.filter(g => g !== null) as number[];
            const finalAverage = validGrades.length > 0 ? validGrades.reduce((a, b) => a + b, 0) / validGrades.length : null;
            const finalGrade = finalAverage !== null ? Math.round(finalAverage) : null;
            const remark = getRemark(finalAverage);
            
            return {
                student,
                quarterlyGrades,
                finalGrade,
                remark
            };
        });
    }, [students, subject, batchId, classRecords, classRecordSettings]);
    
    const sortedStudents = useMemo(() => {
        const males = studentGrades.filter(s => s.student.gender === 'Male').sort((a,b) => a.student.lastName.localeCompare(b.student.lastName));
        const females = studentGrades.filter(s => s.student.gender === 'Female').sort((a,b) => a.student.lastName.localeCompare(b.student.lastName));
        return { males, females };
    }, [studentGrades]);

    const summaryStats = useMemo(() => {
        let malesPassed = 0, malesFailed = 0, femalesPassed = 0, femalesFailed = 0;
        studentGrades.forEach(({ student, remark }) => {
            if (!remark) return;
            if (student.gender === 'Male') {
                if (remark === 'PASSED') malesPassed++;
                else malesFailed++;
            } else if (student.gender === 'Female') {
                if (remark === 'PASSED') femalesPassed++;
                else femalesFailed++;
            }
        });
        return { malesPassed, malesFailed, femalesPassed, femalesFailed };
    }, [studentGrades]);

    const getRemarkColor = (remark: string) => {
        if (remark === 'PASSED') return 'text-success';
        if (remark === 'FAILED') return 'text-error';
        return '';
    };
    
    return (
        <div>
            <div className="flex justify-end mb-4 print-hide">
                <div className="flex items-center bg-secondary rounded-lg">
                     <button
                        onClick={handleDownloadWord}
                        className="flex items-center gap-2 px-4 py-2 text-white font-bold text-sm rounded-l-lg hover:bg-secondary-focus transition-colors disabled:opacity-50"
                        disabled={isDownloading}
                    >
                        <DownloadIcon className="w-4 h-4" />
                        <span>{isDownloading ? 'Generating...' : 'Export as Word'}</span>
                    </button>
                    <div className="h-full w-px bg-base-300"></div>
                     <button
                        onClick={handleDownloadXlsx}
                        className="flex items-center gap-2 px-4 py-2 text-white font-bold text-sm rounded-r-lg hover:bg-secondary-focus transition-colors disabled:opacity-50"
                        disabled={isDownloading}
                    >
                        <DownloadIcon className="w-4 h-4" />
                        <span>{isDownloading ? 'Generating...' : 'Export as XLSX'}</span>
                    </button>
                </div>
            </div>
            <div className="bg-base-200 text-base-content rounded-lg shadow-lg overflow-x-auto p-6">
                 {/* Header */}
                 <div className="mb-6">
                    <div className="flex justify-between items-start mb-6">
                        {settings.schoolLogo ? ( <img src={settings.schoolLogo} alt="School Logo" className="h-24 w-24 object-contain" />) : (<div className="h-24 w-24"></div>) }
                        <div className="text-center pt-2">
                            <h2 className="text-4xl font-bold">Summary of Quarterly Grades</h2>
                            <p className="text-sm">(Pursuant to Deped Order 8, series of 2015)</p>
                        </div>
                        {settings.secondLogo ? ( <img src={settings.secondLogo} alt="Second Logo" className="h-24 w-24 object-contain" /> ) : ( <div className="h-24 w-24"></div> )}
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-lg">
                        <HeaderField label="REGION:" value={settings.region} />
                        <HeaderField label="DIVISION:" value={settings.division} />
                        <HeaderField label="SCHOOL NAME:" value={settings.schoolName} />
                        <HeaderField label="SCHOOL ID:" value={settings.schoolId} />
                         <HeaderField label="GRADE & SECTION:" value={
                            <select
                              value={selectedSectionId}
                              onChange={(e) => setSelectedSectionId(e.target.value)}
                              className="w-full bg-transparent outline-none appearance-none font-semibold text-base-content"
                            >
                                <option value="" disabled>Select a class</option>
                                {settings.sections.map((section) => (
                                    <option key={section.id} value={section.id} className="bg-base-300">
                                        {section.gradeLevel} - {section.sectionName}
                                    </option>
                                ))}
                            </select>
                         } />
                        <HeaderField label="SCHOOL YEAR:" value={settings.schoolYear} />
                        <HeaderField label="SUBJECT:" value={subject} />
                        <HeaderField label="TEACHER:" value={settings.teacherName} />
                     </div>
                </div>
                
                <table className="w-full border-collapse text-sm whitespace-nowrap table-auto mt-2">
                    <thead>
                        <tr className="bg-base-300 text-center">
                            <th className="p-2 border border-base-300" rowSpan={2}></th>
                            <th className="p-2 border border-base-300" rowSpan={2}>LEARNERS' NAMES</th>
                            <th colSpan={4} className="p-2 border border-base-300">QUARTERLY GRADE</th>
                            <th className="p-2 border border-base-300" rowSpan={2}>FINAL GRADE</th>
                            <th className="p-2 border border-base-300" rowSpan={2}>REMARK</th>
                        </tr>
                        <tr className="bg-base-300 text-center">
                            <th className="p-2 border border-base-300 font-normal">1</th>
                            <th className="p-2 border border-base-300 font-normal">2</th>
                            <th className="p-2 border border-base-300 font-normal">3</th>
                            <th className="p-2 border border-base-300 font-normal">4</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Male Students */}
                        <tr className="bg-base-300/30"><td colSpan={8} className="font-bold p-1 text-left">MALE</td></tr>
                        {sortedStudents.males.map(({ student, quarterlyGrades, finalGrade, remark }, index) => (
                            <tr key={student.id} className="hover:bg-base-300/30">
                                <td className="p-1 border border-base-300 text-center">{index + 1}</td>
                                <td className="p-1 border border-base-300 text-left truncate">{`${student.lastName}, ${student.firstName}${student.middleName && student.middleName.trim() ? ` ${student.middleName.trim().charAt(0)}.` : ''}`}</td>
                                {quarterlyGrades.map((grade, i) => <td key={i} className={`p-1 border border-base-300 text-center ${grade && grade < 75 ? 'text-error font-bold' : ''}`}>{grade}</td>)}
                                <td className="p-1 border border-base-300 text-center font-bold text-lg text-primary">{finalGrade}</td>
                                <td className={`p-1 border border-base-300 text-center font-bold ${getRemarkColor(remark)}`}>{remark}</td>
                            </tr>
                        ))}
                        {sortedStudents.males.length === 0 && ( <tr><td colSpan={8} className="text-center p-2 text-gray-400 italic border border-base-300">No male students.</td></tr> )}

                        {/* Female Students */}
                        <tr className="bg-base-300/30"><td colSpan={8} className="font-bold p-1 text-left">FEMALE</td></tr>
                        {sortedStudents.females.map(({ student, quarterlyGrades, finalGrade, remark }, index) => (
                            <tr key={student.id} className="hover:bg-base-300/30">
                                <td className="p-1 border border-base-300 text-center">{index + 1}</td>
                                <td className="p-1 border border-base-300 text-left truncate">{`${student.lastName}, ${student.firstName}${student.middleName && student.middleName.trim() ? ` ${student.middleName.trim().charAt(0)}.` : ''}`}</td>
                                {quarterlyGrades.map((grade, i) => <td key={i} className={`p-1 border border-base-300 text-center ${grade && grade < 75 ? 'text-error font-bold' : ''}`}>{grade}</td>)}
                                <td className="p-1 border border-base-300 text-center font-bold text-lg text-primary">{finalGrade}</td>
                                <td className={`p-1 border border-base-300 text-center font-bold ${getRemarkColor(remark)}`}>{remark}</td>
                            </tr>
                        ))}
                        {sortedStudents.females.length === 0 && ( <tr><td colSpan={8} className="text-center p-2 text-gray-400 italic border border-base-300">No female students.</td></tr> )}
                    </tbody>
                    <tfoot className="summary-footer">
                        <tr className="text-left bg-base-300/30">
                             <td className="p-2 font-bold border border-base-300" colSpan={4}>
                                Passed: Male - {summaryStats.malesPassed}, Female - {summaryStats.femalesPassed}
                            </td>
                            <td className="p-2 font-bold border border-base-300" colSpan={4}>
                                Failed: Male - {summaryStats.malesFailed}, Female - {summaryStats.femalesFailed}
                            </td>
                        </tr>
                        <tr><td colSpan={8} className="h-8"></td></tr>
                        <tr className="text-left">
                            <td colSpan={4} className="px-4 py-2">
                                <p className="text-sm">Submitted by:</p>
                                <p className="text-center font-bold uppercase py-4 mt-2 h-12">{settings.teacherName || ' '}</p>
                                <p className="text-center border-t border-base-content/50 pt-1 text-xs">(Signature over Printed Name)</p>
                            </td>
                            <td colSpan={4} className="px-4 py-2">
                                <p className="text-sm">Checked by:</p>
                                <input 
                                    type="text" 
                                    value={settings.checkedBy || ''} 
                                    onChange={(e) => saveSchoolSettings({ ...settings, checkedBy: e.target.value })} 
                                    className="w-full bg-transparent text-center font-bold uppercase outline-none py-4 mt-2 h-12" 
                                    placeholder="[ENTER NAME OF CHECKER]"
                                />
                                <p className="text-center border-t border-base-content/50 pt-1 text-xs">(Signature over Printed Name)</p>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default SummaryOfGrades;