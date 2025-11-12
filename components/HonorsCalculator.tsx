import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Student } from '../types';
import Header from './Header';
import { useAppContext } from '../contexts/AppContext';
import { AwardIcon, PlusIcon, TrashIcon, DownloadIcon } from './icons';
import { toast } from 'react-hot-toast';
import ConfirmationModal from './ConfirmationModal';
import { docxService } from '../services/docxService';
import HonorsCertificateModal from './HonorsCertificateModal';

const MAPEH_COMPONENTS = ["Music", "Arts", "PE", "Health"];

const HonorsCalculator: React.FC = () => {
    const { students, honorsCalculationData, updateHonorsCalculationData, uiState, updateUiState, settings } = useAppContext();
    const [newSubject, setNewSubject] = useState('');
    const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
    const [activeQuarter, setActiveQuarter] = useState<1 | 2 | 3 | 4>(1);

    useEffect(() => {
        const savedQuarter = localStorage.getItem('honorsCalculatorActiveQuarter');
        if (savedQuarter && ['1', '2', '3', '4'].includes(savedQuarter)) {
            setActiveQuarter(parseInt(savedQuarter, 10) as 1 | 2 | 3 | 4);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('honorsCalculatorActiveQuarter', activeQuarter.toString());
    }, [activeQuarter]);


    const { selectedBatchId } = uiState.honorsCalculator;

    const setSelectedBatchId = (id: string) => {
        updateUiState({ honorsCalculator: { ...uiState.honorsCalculator, selectedBatchId: id } });
    };

    const currentBatchData = useMemo(() => {
        return honorsCalculationData.find(d => d.batchId === selectedBatchId) || {
            id: selectedBatchId,
            batchId: selectedBatchId,
            subjects: [],
            studentGrades: {},
        };
    }, [honorsCalculationData, selectedBatchId]);
    
    const batches = useMemo(() => {
        const batchMap = new Map<string, { fileName: string; representativeStudent?: Student }>();
        students.forEach(student => {
            if (student.importBatchId && !batchMap.has(student.importBatchId)) {
                batchMap.set(student.importBatchId, {
                    fileName: student.importFileName || 'Unknown File',
                    representativeStudent: student
                });
            }
        });
        return Array.from(batchMap.entries()).map(([id, data]) => {
            const { gradeLevel, section } = data.representativeStudent || {};
            const name = (gradeLevel && section) 
                ? `${gradeLevel} - ${section} (from ${data.fileName})` 
                : `Import from ${data.fileName}`;
            return { id, name };
        });
    }, [students]);

    const { sortedStudents, femaleStartIndex } = useMemo(() => {
        if (!selectedBatchId) return { sortedStudents: [], femaleStartIndex: -1 };

        const genderSortOrder: { [key: string]: number } = { 'Male': 1, 'Female': 2 };

        const filtered = students.filter(s => s.importBatchId === selectedBatchId);
        
        const sorted = filtered.sort((a, b) => {
            const genderA = genderSortOrder[a.gender as keyof typeof genderSortOrder] || 3;
            const genderB = genderSortOrder[b.gender as keyof typeof genderSortOrder] || 3;

            if (genderA !== genderB) {
                return genderA - genderB;
            }
            
            return a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName);
        });

        const fStartIndex = sorted.findIndex(s => s.gender === 'Female');

        return {
            sortedStudents: sorted,
            femaleStartIndex: fStartIndex
        };
    }, [students, selectedBatchId]);

    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>, startStudentId: string, subject: string) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        const pastedGrades = pasteData.split(/\r?\n/).filter(line => line.trim() !== '');

        if (pastedGrades.length === 0) return;

        const startIndex = sortedStudents.findIndex(s => s.id === startStudentId);
        if (startIndex === -1) return;

        const updatedStudentGrades = JSON.parse(JSON.stringify(currentBatchData.studentGrades));
        let gradesPastedCount = 0;
        const quarterIndex = activeQuarter - 1;

        for (let i = 0; i < pastedGrades.length; i++) {
            const studentIndex = startIndex + i;
            if (studentIndex >= sortedStudents.length) break;

            const student = sortedStudents[studentIndex];
            const gradeValue = pastedGrades[i].trim();
            const numValue = parseInt(gradeValue, 10);

            if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                if (!updatedStudentGrades[student.id]) updatedStudentGrades[student.id] = {};
                if (!updatedStudentGrades[student.id][subject]) updatedStudentGrades[student.id][subject] = Array(4).fill(null);
                
                updatedStudentGrades[student.id][subject][quarterIndex] = numValue;
                gradesPastedCount++;
            }
        }

        if (gradesPastedCount > 0) {
            const updatedData = { ...currentBatchData, studentGrades: updatedStudentGrades };
            updateHonorsCalculationData(selectedBatchId, updatedData);
            toast.success(`${gradesPastedCount} grades pasted successfully for ${subject}!`);
        } else {
            toast.error("No valid grades found in pasted data.");
        }
    }, [sortedStudents, currentBatchData, activeQuarter, updateHonorsCalculationData, selectedBatchId]);


    const handleAddSubject = () => {
        if (!newSubject.trim()) {
            toast.error("Subject name cannot be empty.");
            return;
        }
        if (currentBatchData.subjects.includes(newSubject.trim())) {
            toast.error("This subject already exists.");
            return;
        }
        const updatedData = {
            ...currentBatchData,
            subjects: [...currentBatchData.subjects, newSubject.trim()],
        };
        updateHonorsCalculationData(selectedBatchId, updatedData);
        setNewSubject('');
    };
    
    const handleAddMapehComponents = () => {
        const subjectsToAdd = MAPEH_COMPONENTS.filter(comp => !currentBatchData.subjects.includes(comp));
        if (subjectsToAdd.length === 0) {
            toast.success("All MAPEH components are already in the list.");
            return;
        }

        const updatedData = {
            ...currentBatchData,
            subjects: [...currentBatchData.subjects, ...subjectsToAdd],
        };
        updateHonorsCalculationData(selectedBatchId, updatedData);
        toast.success("MAPEH components added.");
    };

    const confirmDeleteSubject = (subject: string) => {
        setSubjectToDelete(subject);
    };

    const handleDeleteSubject = () => {
        if (!subjectToDelete) return;

        const updatedSubjects = currentBatchData.subjects.filter(s => s !== subjectToDelete);
        const updatedStudentGrades = { ...currentBatchData.studentGrades };
        Object.keys(updatedStudentGrades).forEach(studentId => {
            delete updatedStudentGrades[studentId][subjectToDelete];
        });

        const updatedData = {
            ...currentBatchData,
            subjects: updatedSubjects,
            studentGrades: updatedStudentGrades,
        };
        updateHonorsCalculationData(selectedBatchId, updatedData);
        setSubjectToDelete(null);
        toast.success(`Subject "${subjectToDelete}" and its grades have been deleted.`);
    };
    
    const handleGradeChange = useCallback((studentId: string, subject: string, quarterIndex: number, value: string) => {
        const numValue = value === '' ? null : parseInt(value, 10);
        if (numValue !== null && (isNaN(numValue) || numValue < 0 || numValue > 100)) {
            toast.error("Grade must be between 0 and 100.");
            return;
        }

        const updatedStudentGrades = JSON.parse(JSON.stringify(currentBatchData.studentGrades));
        if (!updatedStudentGrades[studentId]) {
            updatedStudentGrades[studentId] = {};
        }
        if (!updatedStudentGrades[studentId][subject]) {
            updatedStudentGrades[studentId][subject] = Array(4).fill(null);
        }
        updatedStudentGrades[studentId][subject][quarterIndex] = numValue;
        
        const updatedData = { ...currentBatchData, studentGrades: updatedStudentGrades };
        updateHonorsCalculationData(selectedBatchId, updatedData);
    }, [currentBatchData, selectedBatchId, updateHonorsCalculationData]);


    const calculationResults = useMemo(() => {
        const results = new Map<string, { subjectAvgs: { [key: string]: number | null }, mapehAvg: number | null, generalAvg: number | null, remark: string }>();
        const hasMapehComponents = MAPEH_COMPONENTS.every(comp => currentBatchData.subjects.includes(comp));

        sortedStudents.forEach(student => {
            const studentGrades = currentBatchData.studentGrades[student.id] || {};
            let isEligible = true;
            let eligibilityReason = '';
            
            // 1. Check for any failing quarterly grade in any subject
            for (const subject of currentBatchData.subjects) {
                const grades = studentGrades[subject] || [];
                for (const grade of grades) {
                    if (grade !== null && grade < 75) {
                        isEligible = false;
                        eligibilityReason = 'Ineligible (Failing Grade)';
                        break;
                    }
                }
                if (!isEligible) break;
            }

            // 2. Calculate subject averages
            const subjectAvgs: { [key: string]: number | null } = {};
            currentBatchData.subjects.forEach(subject => {
                const grades = (studentGrades[subject] || []).filter(g => g !== null) as number[];
                if (grades.length > 0) {
                    const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
                    subjectAvgs[subject] = Math.round(avg);
                } else {
                    subjectAvgs[subject] = null;
                }
            });

            // 3. Check for any failing subject average
            if (isEligible) {
                for (const avg of Object.values(subjectAvgs)) {
                    if (avg !== null && avg < 75) {
                         isEligible = false;
                         eligibilityReason = 'Ineligible (Failing Subject)';
                         break;
                    }
                }
            }
            
            // 4. Calculate GWA
            let gradesForGwa: (number | null)[] = [];
            let mapehAvg: number | null = null;

            if (hasMapehComponents) {
                const mapehComponentAvgs = MAPEH_COMPONENTS.map(comp => subjectAvgs[comp]).filter(g => g !== null) as number[];
                if (mapehComponentAvgs.length === 4) { // Must have all 4 components
                    mapehAvg = Math.round(mapehComponentAvgs.reduce((a, b) => a + b, 0) / 4);
                    gradesForGwa.push(mapehAvg);
                }
                // Add non-MAPEH subjects
                Object.entries(subjectAvgs).forEach(([subject, avg]) => {
                    if (!MAPEH_COMPONENTS.includes(subject)) {
                        gradesForGwa.push(avg);
                    }
                });
            } else {
                gradesForGwa = Object.values(subjectAvgs);
            }
            
            const validGradesForGwa = gradesForGwa.filter(avg => avg !== null) as number[];
            const generalAvg = validGradesForGwa.length > 0 ? validGradesForGwa.reduce((a, b) => a + b, 0) / validGradesForGwa.length : null;

            if (isEligible && (generalAvg === null || generalAvg < 90)) {
                isEligible = false;
                eligibilityReason = 'Ineligible (Average < 90)';
            }
            
            let remark = eligibilityReason;
            if (isEligible && generalAvg !== null) {
                if (generalAvg >= 98) remark = 'With Highest Honors';
                else if (generalAvg >= 95) remark = 'With High Honors';
                else if (generalAvg >= 90) remark = 'With Honors';
            }
            
            results.set(student.id, { subjectAvgs, mapehAvg, generalAvg, remark });
        });
        return results;
    }, [sortedStudents, currentBatchData]);
    
    const honorStudents = useMemo(() => {
        const studentsWithHonors: any[] = [];
        calculationResults.forEach((result, studentId) => {
            if (result.remark.startsWith('With') && result.generalAvg !== null) {
                const student = sortedStudents.find(s => s.id === studentId);
                if (student) {
                    studentsWithHonors.push({
                        student,
                        generalAvg: result.generalAvg,
                        award: result.remark
                    });
                }
            }
        });
        return studentsWithHonors.sort((a, b) => b.generalAvg - a.generalAvg);
    }, [calculationResults, sortedStudents]);
    
     const hasMapeh = useMemo(() => {
        return MAPEH_COMPONENTS.every(comp => currentBatchData.subjects.includes(comp));
    }, [currentBatchData.subjects]);

    const handleExportDocx = async () => {
        if (calculationResults.size === 0) {
            toast.error("No data to export.");
            return;
        }
        setIsDownloading(true);
        const toastId = toast.loading('Generating Honors List DOCX...');
        
        const groupedHonors = {
            highest: honorStudents.filter(s => s.award === 'With Highest Honors'),
            high: honorStudents.filter(s => s.award === 'With High Honors'),
            regular: honorStudents.filter(s => s.award === 'With Honors'),
        };
        
        const selectedBatchInfo = batches.find(b => b.id === selectedBatchId);
        const sectionText = selectedBatchInfo?.name.split(' (from')[0] || '';

        try {
            await docxService.generateHonorsListDocx({
                honorStudents: groupedHonors,
                settings,
                selectedSectionText: sectionText,
            });
            toast.success("DOCX downloaded!", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate DOCX.", { id: toastId });
        } finally {
            setIsDownloading(false);
        }
    };
    
    return (
        <div className="min-h-screen">
            <Header title="Honors Calculator" />
            <div className="p-8">
                {/* Controls */}
                <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
                    <div>
                        <label htmlFor="batch-select" className="text-sm font-medium text-base-content block mb-1">Select Class:</label>
                        <select
                            id="batch-select"
                            value={selectedBatchId}
                            onChange={(e) => setSelectedBatchId(e.target.value)}
                            className="bg-base-200 border border-base-300 rounded-md h-10 px-3 text-base-content focus:outline-none focus:ring-primary focus:border-primary w-full sm:w-72"
                        >
                            <option value="">Select a class...</option>
                            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                     {selectedBatchId && (
                         <div className="flex items-end gap-2 flex-wrap">
                             <div className="flex-grow">
                                <label htmlFor="new-subject" className="text-sm font-medium text-base-content block mb-1">Add Subject:</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        id="new-subject"
                                        value={newSubject}
                                        onChange={(e) => setNewSubject(e.target.value)}
                                        className="bg-base-200 border border-base-300 rounded-md h-10 px-3 text-base-content focus:outline-none focus:ring-primary focus:border-primary"
                                        placeholder="e.g., Filipino"
                                    />
                                     <button onClick={handleAddSubject} className="h-10 px-4 flex-shrink-0 flex items-center bg-primary hover:bg-primary-focus text-white font-bold rounded-lg transition-colors">
                                        <PlusIcon className="w-5 h-5" />
                                    </button>
                                </div>
                             </div>
                            <div className="flex items-center bg-base-300 rounded-lg p-1 h-10">
                                {[1, 2, 3, 4].map(q => (
                                    <button 
                                        key={q} 
                                        onClick={() => setActiveQuarter(q as 1 | 2 | 3 | 4)} 
                                        className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeQuarter === q ? 'bg-primary text-white' : 'text-base-content hover:bg-base-100'}`}
                                    >
                                        Q{q}
                                    </button>
                                ))}
                            </div>
                            <button onClick={handleAddMapehComponents} className="h-10 px-4 flex items-center bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors text-sm">
                                Add MAPEH
                            </button>
                             <button onClick={handleExportDocx} disabled={isDownloading} className="h-10 px-4 flex items-center bg-secondary hover:bg-secondary-focus text-white font-bold rounded-lg transition-colors disabled:opacity-50">
                                <DownloadIcon className="w-5 h-5 mr-2" /> Export Honors
                            </button>
                            <button
                                onClick={() => setIsCertificateModalOpen(true)}
                                disabled={isDownloading || honorStudents.length === 0}
                                className="h-10 px-4 flex items-center bg-info hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                            >
                                <AwardIcon className="w-5 h-5 mr-2" /> Generate Certificates
                            </button>
                         </div>
                     )}
                </div>

                {/* Main Content */}
                {!selectedBatchId ? (
                    <div className="text-center p-16 bg-base-200 rounded-xl border-2 border-dashed border-base-300">
                        <AwardIcon className="w-16 h-16 mx-auto text-primary mb-4" />
                        <h3 className="text-2xl font-bold text-base-content">Select a Class</h3>
                        <p className="text-base-content mt-2">Choose a class from the dropdown to start calculating honors.</p>
                    </div>
                ) : (
                    <div className="bg-base-200 rounded-xl shadow-lg overflow-hidden">
                        {currentBatchData.subjects.length > 0 && (
                            <div className="p-4 border-b border-base-300 flex flex-wrap items-center gap-2">
                                <span className="font-semibold mr-2">Subjects:</span>
                                {currentBatchData.subjects.map(subject => (
                                    <div key={subject} className={`flex items-center gap-1 ${MAPEH_COMPONENTS.includes(subject) ? 'bg-teal-800/50' : 'bg-base-300'} rounded-full px-3 py-1 text-sm`}>
                                        <span>{subject}</span>
                                        <button onClick={() => confirmDeleteSubject(subject)} className="text-base-content/50 hover:text-error"><TrashIcon className="w-3 h-3"/></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-base-content whitespace-nowrap">
                                <thead className="text-xs text-base-content/70 uppercase bg-base-300 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 min-w-[200px] sticky left-0 bg-base-300 z-20">Student Name</th>
                                        {currentBatchData.subjects.map(subject => (
                                            <th key={subject} className="p-2 text-center" colSpan={2}>{subject}</th>
                                        ))}
                                        {hasMapeh && <th className="p-2 text-center bg-teal-900/50">MAPEH Avg.</th>}
                                        <th className="p-2 text-center" colSpan={2}>FINAL</th>
                                    </tr>
                                    <tr>
                                        <th className="px-4 py-3 min-w-[200px] sticky left-0 bg-base-300 z-20"></th>
                                         {currentBatchData.subjects.map(subject => (
                                            <React.Fragment key={`${subject}-q`}>
                                                <th className="p-2 text-center font-normal">{`Q${activeQuarter}`}</th>
                                                <th className="p-2 text-center font-semibold bg-base-100/50">Avg</th>
                                            </React.Fragment>
                                        ))}
                                        {hasMapeh && <th className="p-2 text-center font-semibold bg-teal-900/50"></th>}
                                        <th className="p-2 text-center font-semibold bg-primary/20">Gen. Avg</th>
                                        <th className="p-2 text-center font-semibold bg-primary/20">Remark</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedStudents.map((student, index) => {
                                        const result = calculationResults.get(student.id);
                                        return (
                                            <React.Fragment key={student.id}>
                                                {index === femaleStartIndex && (
                                                    <tr className="bg-base-300/80">
                                                        <td colSpan={1 + currentBatchData.subjects.length * 2 + (hasMapeh ? 1 : 0) + 2} className="px-4 py-1 font-bold text-base-content/80 text-center">FEMALES</td>
                                                    </tr>
                                                )}
                                                <tr className="bg-base-200 border-b border-base-300 hover:bg-base-300/50">
                                                    <td className="px-4 py-2 font-medium text-base-content sticky left-0 bg-base-200 hover:bg-base-300/50 z-10">{`${student.lastName}, ${student.firstName}${student.middleName && student.middleName.trim() ? ` ${student.middleName.trim().charAt(0)}.` : ''}`}</td>
                                                    {currentBatchData.subjects.map(subject => (
                                                        <React.Fragment key={`${student.id}-${subject}`}>
                                                            <td className="p-0 border-l border-base-300">
                                                                <input
                                                                    key={`${student.id}-${subject}-${activeQuarter}`}
                                                                    type="number"
                                                                    defaultValue={currentBatchData.studentGrades[student.id]?.[subject]?.[activeQuarter - 1] ?? ''}
                                                                    onBlur={(e) => handleGradeChange(student.id, subject, activeQuarter - 1, e.target.value)}
                                                                    onPaste={(e) => handlePaste(e, student.id, subject)}
                                                                    className={`w-16 bg-transparent text-center p-2 outline-none focus:bg-base-100 ${(currentBatchData.studentGrades[student.id]?.[subject]?.[activeQuarter - 1] ?? 100) < 75 ? 'text-error font-bold' : ''}`}
                                                                />
                                                            </td>
                                                             <td className={`p-2 w-16 text-center font-semibold border-l border-r border-base-300 bg-base-100/50 ${(result?.subjectAvgs[subject] ?? 100) < 75 ? 'text-error' : ''}`}>
                                                                {result?.subjectAvgs[subject]?.toFixed(0) ?? '-'}
                                                            </td>
                                                        </React.Fragment>
                                                    ))}
                                                    {hasMapeh && (
                                                         <td className={`p-2 text-center font-bold border-l border-r border-base-300 bg-teal-900/50 text-lg text-teal-300 ${(result?.mapehAvg ?? 100) < 75 ? 'text-error' : ''}`}>
                                                            {result?.mapehAvg?.toFixed(0) ?? '-'}
                                                        </td>
                                                    )}
                                                    <td className="p-2 text-center font-bold bg-primary/20 text-lg text-primary">{result?.generalAvg?.toFixed(2) ?? '-'}</td>
                                                    <td className={`p-2 text-center font-bold bg-primary/20 ${result?.remark.startsWith('With') ? 'text-success' : 'text-error/70'}`}>{result?.remark ?? ''}</td>
                                                </tr>
                                            </React.Fragment>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
             <ConfirmationModal
                isOpen={!!subjectToDelete}
                onClose={() => setSubjectToDelete(null)}
                onConfirm={handleDeleteSubject}
                title="Delete Subject"
                message={`Are you sure you want to delete the subject "${subjectToDelete}"? All grades entered for this subject will be permanently lost.`}
            />
            <HonorsCertificateModal
                isOpen={isCertificateModalOpen}
                onClose={() => setIsCertificateModalOpen(false)}
                honorStudents={honorStudents}
                selectedBatchId={selectedBatchId}
            />
        </div>
    );
};

export default HonorsCalculator;