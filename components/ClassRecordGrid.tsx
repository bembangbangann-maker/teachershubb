import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Student, Quarter, StudentQuarterlyRecord, SubjectQuarterSettings } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { calculateInitialGrade, transmuteGrade, getSubjectWeightDefaults } from '../utils/transmutation';
import ClassRecordHeader from './ClassRecordHeader';
import { DownloadIcon, PlusIcon, TrashIcon } from './icons';
import { toast } from 'react-hot-toast';
import { docxService } from '../services/docxService';
import { excelService } from '../services/excelService';
import Modal from './Modal';
import StudentForm from './StudentForm';
import ConfirmationModal from './ConfirmationModal';

interface ClassRecordGridProps {
    students: Student[];
    batchId: string;
    subject: string;
    quarter: Quarter;
}

const ClassRecordGrid: React.FC<ClassRecordGridProps> = ({ students, batchId, subject, quarter }) => {
    const { settings, classRecords, classRecordSettings, updateClassRecord, batchUpdateClassRecords, updateClassRecordSettings, addStudent, deleteStudent } = useAppContext();
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    
    useEffect(() => {
        const firstStudent = students[0];
        if (firstStudent && settings.sections.length > 0) {
            const matchedSection = settings.sections.find(s => s.gradeLevel === firstStudent.gradeLevel && s.sectionName === firstStudent.section);
            setSelectedSectionId(matchedSection?.id || settings.sections[0]?.id || '');
        }
    }, [students, settings.sections]);
    
    const selectedSection = useMemo(() => {
        return settings.sections.find(s => s.id === selectedSectionId);
    }, [selectedSectionId, settings.sections]);

    const selectedSectionText = useMemo(() => {
        if (selectedSection) {
            return `${selectedSection.gradeLevel} - ${selectedSection.sectionName}`;
        }
        const studentInfo = students.find(s => s.importBatchId === batchId);
        if(studentInfo?.gradeLevel && studentInfo?.section) {
            return `${studentInfo.gradeLevel} - ${studentInfo.section}`;
        }
        return 'Class';
    }, [selectedSection, students, batchId]);


    const [recordSettings, setRecordSettings] = useState<SubjectQuarterSettings>(() => {
        const existing = classRecordSettings.find(s => s.batchId === batchId && s.subject === subject && s.quarter === quarter);
        const defaults = getSubjectWeightDefaults(subject);
        
        if (existing) {
            return {
                ...existing,
                wwPercentage: existing.wwPercentage ?? defaults.ww,
                ptPercentage: existing.ptPercentage ?? defaults.pt,
                qaPercentage: existing.qaPercentage ?? defaults.qa,
            };
        }
        
        return {
            id: `${subject}-${quarter}-${batchId}`, subject, quarter, batchId,
            writtenWorksMax: Array(10).fill(null),
            performanceTasksMax: Array(10).fill(null),
            quarterlyAssessmentMax: null,
            wwPercentage: defaults.ww,
            ptPercentage: defaults.pt,
            qaPercentage: defaults.qa,
        };
    });

    const studentRecords = useMemo(() => {
        return students.map(student => {
            return classRecords.find(r => 
                r.studentId === student.id && 
                r.subject === subject && 
                r.quarter === quarter &&
                r.batchId === batchId
            ) || {
                id: `${student.id}-${subject}-${quarter}-${batchId}`, studentId: student.id,
                subject, quarter, batchId,
                writtenWorks: Array(10).fill(null),
                performanceTasks: Array(10).fill(null),
                quarterlyAssessment: null
            };
        });
    }, [students, classRecords, subject, quarter, batchId]);
    
     useEffect(() => {
        const settingsToSave = { ...recordSettings };
        updateClassRecordSettings(settingsToSave);
    }, [recordSettings, updateClassRecordSettings]);
    

    const sortedStudents = useMemo(() => {
        const males = students.filter(s => s.gender === 'Male').sort((a,b) => a.lastName.localeCompare(b.lastName));
        const females = students.filter(s => s.gender === 'Female').sort((a,b) => a.lastName.localeCompare(b.lastName));
        return { males, females };
    }, [students]);

    const handleMaxScoreChange = (category: 'WW' | 'PT' | 'QA', index: number, value: string) => {
        const numValue = value === '' ? null : parseInt(value, 10);
        setRecordSettings(prev => {
            if (category === 'WW') {
                const newMaxScores = [...prev.writtenWorksMax];
                newMaxScores[index] = numValue;
                return { ...prev, writtenWorksMax: newMaxScores };
            }
            if (category === 'PT') {
                const newMaxScores = [...prev.performanceTasksMax];
                newMaxScores[index] = numValue;
                return { ...prev, performanceTasksMax: newMaxScores };
            }
            if (category === 'QA') {
                return { ...prev, quarterlyAssessmentMax: numValue };
            }
            return prev;
        });
    };
    
    const handleScoreChange = (studentId: string, category: 'WW' | 'PT' | 'QA', index: number, value: string) => {
        const numValue = value === '' ? null : parseInt(value, 10);
        const maxScore = category === 'WW' ? recordSettings.writtenWorksMax[index] : category === 'PT' ? recordSettings.performanceTasksMax[index] : recordSettings.quarterlyAssessmentMax;

        if (numValue !== null && maxScore !== null && numValue > maxScore) {
            toast.error(`Score cannot be higher than the maximum of ${maxScore}.`);
             // Revert the input visually if the change was invalid
            const input = document.getElementById(`${studentId}-${category}-${index}`) as HTMLInputElement;
            if(input) {
                const record = studentRecords.find(r => r.studentId === studentId);
                const originalValue = category === 'QA' ? record?.quarterlyAssessment : (category === 'WW' ? record?.writtenWorks[index] : record?.performanceTasks[index]);
                input.value = originalValue?.toString() ?? '';
            }
            return;
        }

        const record = studentRecords.find(r => r.studentId === studentId);
        if (!record) return;

        const updatedRecord = JSON.parse(JSON.stringify(record));
        if (category === 'WW') updatedRecord.writtenWorks[index] = numValue;
        else if (category === 'PT') updatedRecord.performanceTasks[index] = numValue;
        else if (category === 'QA') updatedRecord.quarterlyAssessment = numValue;
        
        updateClassRecord(updatedRecord);
    };

    const handlePaste = useCallback((e: React.ClipboardEvent, startStudentId: string, category: 'WW' | 'PT' | 'QA', itemIndex: number) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        const pastedGrades = pasteData.trimEnd().split(/\r?\n/);
    
        if (pastedGrades.length === 0) return;
    
        const maxScore = category === 'WW' ? recordSettings.writtenWorksMax[itemIndex] : category === 'PT' ? recordSettings.performanceTasksMax[itemIndex] : recordSettings.quarterlyAssessmentMax;
        if (maxScore === null) {
            toast.error("Set a maximum score for this item before pasting grades.");
            return;
        }
        
        const allStudents = [...sortedStudents.males, ...sortedStudents.females];
        const startIndex = allStudents.findIndex(s => s.id === startStudentId);
        if (startIndex === -1) return;
    
        let gradesSkippedCount = 0;
        const recordsToUpdate: StudentQuarterlyRecord[] = [];
    
        for (let i = 0; i < pastedGrades.length; i++) {
            const studentIndex = startIndex + i;
            if (studentIndex >= allStudents.length) break;
    
            const student = allStudents[studentIndex];
            const gradeValue = pastedGrades[i].trim();
            const numValue = gradeValue === '' ? null : parseInt(gradeValue, 10);
            
            if (gradeValue !== '' && (isNaN(numValue) || numValue < 0)) continue;
            if (numValue !== null && numValue > maxScore) { gradesSkippedCount++; continue; }
    
            const record = studentRecords.find(r => r.studentId === student.id);
            if (record) {
                const updatedRecord = JSON.parse(JSON.stringify(record));
                if (category === 'WW') updatedRecord.writtenWorks[itemIndex] = numValue;
                else if (category === 'PT') updatedRecord.performanceTasks[itemIndex] = numValue;
                else if (category === 'QA') updatedRecord.quarterlyAssessment = numValue;
                recordsToUpdate.push(updatedRecord);
            }
        }
    
        if (recordsToUpdate.length > 0) {
            batchUpdateClassRecords(recordsToUpdate);
        }
        
        const numAffected = recordsToUpdate.length;
        let toastMessage = '';
        if (numAffected > 0) toastMessage += `${numAffected} cells affected.`;
        if (gradesSkippedCount > 0) toastMessage += ` ${gradesSkippedCount} grades were skipped because they exceeded the max score of ${maxScore}.`;
        
        if (toastMessage) {
            if (gradesSkippedCount > 0 && numAffected === 0) toast.error(toastMessage.trim());
            else toast.success(toastMessage.trim());
        } else {
            toast.error("No valid grades were found in the pasted data.");
        }
    }, [sortedStudents, recordSettings, studentRecords, batchUpdateClassRecords]);


    const calculationResults = useMemo(() => {
        const results = new Map<string, any>();
        studentRecords.forEach(record => {
            const calcs = calculateInitialGrade(record, recordSettings);
            const quarterlyGrade = calcs.initialGrade !== null ? transmuteGrade(calcs.initialGrade) : null;
            results.set(record.studentId, { ...calcs, quarterlyGrade });
        });
        return results;
    }, [studentRecords, recordSettings]);

    const handlePercentageChange = (component: 'ww' | 'pt' | 'qa', value: string) => {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0 || numValue > 100) return;

        setRecordSettings(prev => ({
            ...prev,
            [`${component}Percentage`]: numValue / 100,
        }));
    };
    
    const handleSaveStudent = (studentData: Omit<Student, 'id'>) => {
        const firstStudent = students[0];
        const studentWithBatch = {
            ...studentData,
            importBatchId: batchId,
            importFileName: firstStudent?.importFileName || 'Manual Entry',
            gradeLevel: studentData.gradeLevel || selectedSection?.gradeLevel || firstStudent?.gradeLevel,
            section: studentData.section || selectedSection?.sectionName || firstStudent?.section,
        };
        addStudent(studentWithBatch);
        setIsStudentFormOpen(false);
        toast.success('Student added successfully!');
    };

    const handleDeleteConfirmed = () => {
        if (studentToDelete) {
            deleteStudent(studentToDelete.id);
            toast.success(`Student ${studentToDelete.firstName} deleted.`);
            setStudentToDelete(null);
        }
    };

    const percentageTotal = useMemo(() => {
        const total = (recordSettings.wwPercentage + recordSettings.ptPercentage + recordSettings.qaPercentage) * 100;
        return Math.round(total);
    }, [recordSettings]);

    const wwMaxTotal = useMemo(() => recordSettings.writtenWorksMax.reduce((a, b) => a + (b || 0), 0), [recordSettings.writtenWorksMax]);
    const ptMaxTotal = useMemo(() => recordSettings.performanceTasksMax.reduce((a, b) => a + (b || 0), 0), [recordSettings.performanceTasksMax]);
    
    const handleExportDocx = async () => {
        setIsDownloading(true);
        const toastId = toast.loading('Exporting E-Class Record to DOCX...');

        let malesPassed = 0, malesFailed = 0, femalesPassed = 0, femalesFailed = 0;

        sortedStudents.males.forEach(student => {
            const result = calculationResults.get(student.id);
            if (result && result.quarterlyGrade !== null) {
                if (result.quarterlyGrade >= 75) malesPassed++;
                else malesFailed++;
            }
        });

        sortedStudents.females.forEach(student => {
            const result = calculationResults.get(student.id);
            if (result && result.quarterlyGrade !== null) {
                if (result.quarterlyGrade >= 75) femalesPassed++;
                else femalesFailed++;
            }
        });
    
        const passed = malesPassed + femalesPassed;
        const failed = malesFailed + femalesFailed;
    
        const dataForDocx = {
            allStudents: sortedStudents,
            settings,
            subject,
            quarter,
            selectedSectionText,
            recordSettings,
            studentRecords,
            calculationResults,
            summary: { passed, failed, malesPassed, malesFailed, femalesPassed, femalesFailed },
        };
    
        try {
            await docxService.generateEClassRecordDocx(dataForDocx);
            toast.success('DOCX downloaded successfully!', { id: toastId });
        } catch (error) {
            console.error("Error generating DOCX:", error);
            toast.error('Failed to generate DOCX.', { id: toastId });
        } finally {
            setIsDownloading(false);
        }
    };
    
    const handleExportXlsx = () => {
        setIsDownloading(true);
        const toastId = toast.loading('Exporting E-Class Record to XLSX...');

        let malesPassed = 0, malesFailed = 0, femalesPassed = 0, femalesFailed = 0;

        sortedStudents.males.forEach(student => {
            const result = calculationResults.get(student.id);
            if (result && result.quarterlyGrade !== null) {
                if (result.quarterlyGrade >= 75) malesPassed++;
                else malesFailed++;
            }
        });

        sortedStudents.females.forEach(student => {
            const result = calculationResults.get(student.id);
            if (result && result.quarterlyGrade !== null) {
                if (result.quarterlyGrade >= 75) femalesPassed++;
                else femalesFailed++;
            }
        });
    
        const passed = malesPassed + femalesPassed;
        const failed = malesFailed + femalesFailed;
    
        const dataForXlsx = {
            allStudents: sortedStudents,
            settings,
            subject,
            quarter,
            selectedSectionText,
            recordSettings,
            studentRecords,
            calculationResults,
            summary: { passed, failed, malesPassed, malesFailed, femalesPassed, femalesFailed },
        };
    
        try {
            excelService.generateEClassRecordXlsx(dataForXlsx);
            toast.success('XLSX downloaded successfully!', { id: toastId });
        } catch (error) {
            console.error("Error generating XLSX:", error);
            toast.error('Failed to generate XLSX.', { id: toastId });
        } finally {
            setIsDownloading(false);
        }
    };

    const renderStudentRow = (student: Student, index: number) => {
        const record = studentRecords.find(r => r.studentId === student.id);
        const calcs = calculationResults.get(student.id) || {};
        if (!record) return null;

        return (
            <tr key={student.id} className={`text-center ${student.gender === 'Male' ? 'male-student-row' : 'female-student-row'}`}>
                <td className="border border-base-300 p-1 text-center">{index + 1}</td>
                <td className="text-left border border-base-300 p-1">
                     <div className="flex justify-between items-center">
                        <span>{`${student.lastName}, ${student.firstName}${student.middleName && student.middleName.trim() ? ` ${student.middleName.trim().charAt(0)}.` : ''}`}</span>
                        <button onClick={() => setStudentToDelete(student)} title="Delete Student" className="text-gray-500 hover:text-error p-1 rounded-full transition-colors opacity-25 hover:opacity-100 flex-shrink-0 ml-2 print-hide">
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    </div>
                </td>
                {Array.from({length: 10}).map((_, i) => (
                    <td key={`ww-score-${i}`} className="p-0 border border-base-300 min-w-[45px]">
                        <input id={`${student.id}-WW-${i}`} type="number" defaultValue={record.writtenWorks[i] ?? ''} onBlur={e => handleScoreChange(student.id, 'WW', i, e.target.value)} onPaste={e => handlePaste(e, student.id, 'WW', i)} className="w-full h-full p-1 bg-transparent text-center outline-none focus:bg-base-100"/>
                    </td>
                ))}
                <td className="border border-base-300 p-1">{calcs.wwTotal}</td>
                <td className="border border-base-300 p-1">{calcs.wwPs?.toFixed(2)}</td>
                <td className="border border-base-300 p-1 font-bold bg-primary/10">{calcs.wwWs?.toFixed(2)}</td>
                {Array.from({length: 10}).map((_, i) => (
                    <td key={`pt-score-${i}`} className="p-0 border border-base-300 min-w-[45px]">
                        <input id={`${student.id}-PT-${i}`} type="number" defaultValue={record.performanceTasks[i] ?? ''} onBlur={e => handleScoreChange(student.id, 'PT', i, e.target.value)} onPaste={e => handlePaste(e, student.id, 'PT', i)} className="w-full h-full p-1 bg-transparent text-center outline-none focus:bg-base-100"/>
                    </td>
                ))}
                <td className="border border-base-300 p-1">{calcs.ptTotal}</td>
                <td className="border border-base-300 p-1">{calcs.ptPs?.toFixed(2)}</td>
                <td className="border border-base-300 p-1 font-bold bg-primary/10">{calcs.ptWs?.toFixed(2)}</td>
                <td className="p-0 border border-base-300 min-w-[45px]">
                    <input id={`${student.id}-QA-0`} type="number" defaultValue={record.quarterlyAssessment ?? ''} onBlur={e => handleScoreChange(student.id, 'QA', 0, e.target.value)} onPaste={e => handlePaste(e, student.id, 'QA', 0)} className="w-full h-full p-1 bg-transparent text-center outline-none focus:bg-base-100"/>
                </td>
                <td className="border border-base-300 p-1">{calcs.qaPs?.toFixed(2)}</td>
                <td className="border border-base-300 p-1 font-bold bg-primary/10">{calcs.qaWs?.toFixed(2)}</td>
                <td className="border border-base-300 p-1 font-bold bg-secondary/20">{calcs.initialGrade?.toFixed(2)}</td>
                <td className="border border-base-300 p-1 font-bold text-lg bg-success/20">{calcs.quarterlyGrade}</td>
            </tr>
        );
    };
    
    const quarterText = useMemo(() => {
        switch(quarter) {
            case 1: return "FIRST QUARTER";
            case 2: return "SECOND QUARTER";
            case 3: return "THIRD QUARTER";
            case 4: return "FOURTH QUARTER";
            default: return "";
        }
    }, [quarter]);

    return (
        <div className="bg-base-200 text-base-content e-class-record-container">
            <div className="flex justify-end gap-3 mb-4 print-hide">
                 <button onClick={() => setIsStudentFormOpen(true)} className="flex items-center bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Student
                </button>
                 <div className="flex items-center bg-secondary rounded-lg">
                    <button onClick={handleExportDocx} disabled={isDownloading} className="flex items-center gap-2 px-4 py-2 text-white font-bold text-sm rounded-l-lg hover:bg-secondary-focus transition-colors disabled:opacity-50">
                        <DownloadIcon className="w-4 h-4" />
                        <span>Export as DOCX</span>
                    </button>
                    <div className="h-full w-px bg-base-300"></div>
                    <button onClick={handleExportXlsx} disabled={isDownloading} className="flex items-center gap-2 px-4 py-2 text-white font-bold text-sm rounded-r-lg hover:bg-secondary-focus transition-colors disabled:opacity-50">
                        <DownloadIcon className="w-4 h-4" />
                        <span>Export as XLSX</span>
                    </button>
                </div>
            </div>
             <div className="p-4 mb-4 border border-base-300 rounded-lg print-hide">
                <h4 className="font-bold text-base-content mb-2">Component Weights</h4>
                <div className="flex flex-wrap items-end gap-4">
                    <div className="form-control">
                        <label className="label pb-1"><span className="label-text">Written Works %</span></label>
                        <input type="number" value={recordSettings.wwPercentage * 100} onChange={e => handlePercentageChange('ww', e.target.value)} className="w-24 bg-base-100 border border-base-300 rounded-md p-2 h-10 text-center" />
                    </div>
                    <div className="form-control">
                        <label className="label pb-1"><span className="label-text">Performance Tasks %</span></label>
                        <input type="number" value={recordSettings.ptPercentage * 100} onChange={e => handlePercentageChange('pt', e.target.value)} className="w-24 bg-base-100 border border-base-300 rounded-md p-2 h-10 text-center" />
                    </div>
                    <div className="form-control">
                        <label className="label pb-1"><span className="label-text">Quarterly Assessment %</span></label>
                        <input type="number" value={recordSettings.qaPercentage * 100} onChange={e => handlePercentageChange('qa', e.target.value)} className="w-24 bg-base-100 border border-base-300 rounded-md p-2 h-10 text-center" />
                    </div>
                    <div className={`flex items-center h-10 px-4 rounded-md ${percentageTotal === 100 ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                        <span className="font-bold text-lg">Total: {percentageTotal}%</span>
                    </div>
                </div>
                {percentageTotal !== 100 && <p className="text-xs text-error mt-2">The sum of component weights must be 100%.</p>}
            </div>
            <div className="overflow-x-auto">
                <ClassRecordHeader schoolSettings={settings} />
                 <table className="w-full border-collapse text-[10px] border border-base-300 mt-2">
                    <thead className="whitespace-nowrap">
                        <tr className="text-left font-bold">
                          <th className="p-1 border border-base-300 align-middle print-hide-col" colSpan={2}>{quarterText}</th>
                          <th className="p-1 border border-base-300 align-middle" colSpan={13}>
                            <div className="flex items-center">
                                <span className="mr-2">GRADE & SECTION:</span>
                                <select
                                    value={selectedSectionId}
                                    onChange={(e) => setSelectedSectionId(e.target.value)}
                                    className="w-full bg-base-200 outline-none appearance-none font-bold"
                                >
                                    <option value="" disabled>Select a class...</option>
                                    {settings.sections.map((section) => (
                                        <option key={section.id} value={section.id} className="bg-base-300 text-base-content">
                                            {section.gradeLevel} - {section.sectionName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                          </th>
                          <th className="p-1 border border-base-300 align-middle" colSpan={13}>TEACHER: {settings.teacherName}</th>
                          <th className="p-1 border border-base-300 align-middle" colSpan={5}>SUBJECT: {subject}</th>
                        </tr>
                        <tr className="text-center font-bold">
                            <th rowSpan={2} colSpan={2} className="border border-base-300 p-1 align-middle print-category-header">LEARNERS' NAMES</th>
                            <th colSpan={13} className="border border-base-300 p-1 print-category-header">WRITTEN WORKS ({recordSettings.wwPercentage * 100}%)</th>
                            <th colSpan={13} className="border border-base-300 p-1 print-category-header">PERFORMANCE TASKS ({recordSettings.ptPercentage * 100}%)</th>
                            <th colSpan={3} className="border border-base-300 p-1 print-category-header">QUARTERLY ASSESSMENT ({recordSettings.qaPercentage * 100}%)</th>
                            <th rowSpan={2} className="border border-base-300 p-1 align-middle text-[9px] leading-tight print-final-grade-header">Initial Grade</th>
                            <th rowSpan={2} className="border border-base-300 p-1 align-middle text-[9px] leading-tight print-final-grade-header">Quarterly Grade</th>
                        </tr>
                        <tr className="text-center font-normal print-component-header">
                            {Array.from({length: 10}).map((_,i) => <th key={`h-ww-${i}`} className="border border-base-300 p-1">{i+1}</th>)}
                            <th className="border border-base-300 p-1">Total</th><th className="border border-base-300 p-1">PS</th><th className="border border-base-300 p-1">WS</th>
                            {Array.from({length: 10}).map((_,i) => <th key={`h-pt-${i}`} className="border border-base-300 p-1">{i+1}</th>)}
                            <th className="border border-base-300 p-1">Total</th><th className="border border-base-300 p-1">PS</th><th className="border border-base-300 p-1">WS</th>
                            <th className="border border-base-300 p-1">1</th><th className="border border-base-300 p-1">PS</th><th className="border border-base-300 p-1">WS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="font-bold text-center bg-base-300">
                            <td colSpan={2} className="text-left border border-base-300 p-1">HIGHEST POSSIBLE SCORE</td>
                            {Array.from({length: 10}).map((_,i) => <td key={`hps-ww-${i}`} className="p-0 border border-base-300"><input type="number" value={recordSettings.writtenWorksMax[i] ?? ''} onChange={e => handleMaxScoreChange('WW', i, e.target.value)} className="w-full h-full p-1 bg-transparent text-center outline-none focus:bg-base-100 font-bold"/></td>)}
                            <td className="border border-base-300 p-1">{wwMaxTotal}</td>
                            <td className="border border-base-300 p-1">100.00</td>
                            <td className="border border-base-300 p-1">{(recordSettings.wwPercentage * 100).toFixed(2)}</td>
                            {Array.from({length: 10}).map((_,i) => <td key={`hps-pt-${i}`} className="p-0 border border-base-300"><input type="number" value={recordSettings.performanceTasksMax[i] ?? ''} onChange={e => handleMaxScoreChange('PT', i, e.target.value)} className="w-full h-full p-1 bg-transparent text-center outline-none focus:bg-base-100 font-bold"/></td>)}
                            <td className="border border-base-300 p-1">{ptMaxTotal}</td>
                            <td className="border border-base-300 p-1">100.00</td>
                            <td className="border border-base-300 p-1">{(recordSettings.ptPercentage * 100).toFixed(2)}</td>
                            <td className="p-0 border border-base-300"><input type="number" value={recordSettings.quarterlyAssessmentMax ?? ''} onChange={e => handleMaxScoreChange('QA', 0, e.target.value)} className="w-full h-full p-1 bg-transparent text-center outline-none focus:bg-base-100 font-bold"/></td>
                            <td className="border border-base-300 p-1">100.00</td>
                            <td className="border border-base-300 p-1">{(recordSettings.qaPercentage * 100).toFixed(2)}</td>
                            <td className="border border-base-300 p-1">100.00</td>
                            <td className="border border-base-300 p-1">100</td>
                        </tr>
                        {/* Male Students */}
                        <tr className="male-section"><td colSpan={33} className="bg-base-300 font-bold p-1">MALES</td></tr>
                        {sortedStudents.males.map((student, index) => renderStudentRow(student, index))}
                        
                        {/* Female Students */}
                        <tr className="female-section"><td colSpan={33} className="bg-base-300 font-bold p-1">FEMALES</td></tr>
                        {sortedStudents.females.map((student, index) => renderStudentRow(student, sortedStudents.males.length + index))}

                    </tbody>
                </table>
            </div>
             <Modal isOpen={isStudentFormOpen} onClose={() => setIsStudentFormOpen(false)} title="Add New Student to Class">
                <StudentForm
                    onSave={handleSaveStudent}
                    onClose={() => setIsStudentFormOpen(false)}
                    defaultGradeLevel={selectedSection?.gradeLevel}
                    defaultSection={selectedSection?.sectionName}
                />
            </Modal>
             <ConfirmationModal
                isOpen={!!studentToDelete}
                onClose={() => setStudentToDelete(null)}
                onConfirm={handleDeleteConfirmed}
                title="Delete Student"
                message={`Are you sure you want to delete ${studentToDelete?.firstName} ${studentToDelete?.lastName}? This will remove the student and all of their associated data (grades, attendance, etc.) from the entire application.`}
            />
        </div>
    );
};

export default ClassRecordGrid;
