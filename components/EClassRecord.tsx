import React, { useState, useMemo, useEffect } from 'react';
import { Student, Quarter, MapehRecordDocxData } from '../types';
import { useAppContext } from '../contexts/AppContext';
import ClassRecordGrid from './ClassRecordGrid';
import MapehSummaryView from './MapehSummaryView';
import { DownloadIcon } from './icons';
import { toast } from 'react-hot-toast';
import { docxService } from '../services/docxService';
import { excelService } from '../services/excelService';
import { calculateInitialGrade, transmuteGrade } from '../utils/transmutation';

interface EClassRecordProps {
    students: Student[];
    batchId: string;
    subject: string;
    quarter: Quarter;
}

const MAPEH_COMPONENTS = ['Music', 'Arts', 'PE', 'Health'] as const;
type MapehComponent = typeof MAPEH_COMPONENTS[number];
type MapehTab = MapehComponent | 'Summary';

const TabButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg ${isActive ? 'bg-base-200 text-primary border-b-2 border-primary' : 'text-base-content/70 hover:bg-base-300/30'}`}
    >
        {label}
    </button>
);


const EClassRecord: React.FC<EClassRecordProps> = (props) => {
    const { students, batchId, subject, quarter } = props;
    const { classRecords, classRecordSettings, settings } = useAppContext();
    const [activeMapehTab, setActiveMapehTab] = useState<MapehTab>('Music');
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const savedTab = localStorage.getItem('eClassRecordMapehTab');
        if (savedTab && (['Music', 'Arts', 'PE', 'Health', 'Summary'].includes(savedTab))) {
            setActiveMapehTab(savedTab as MapehTab);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('eClassRecordMapehTab', activeMapehTab);
    }, [activeMapehTab]);

    const isMapeh = useMemo(() => subject.toLowerCase().trim() === 'mapeh', [subject]);

    const summaryDataForExport = useMemo((): MapehRecordDocxData['summaryData'] => {
        if (!isMapeh) return [];
        return students.map(student => {
            const componentGrades: { [key: string]: number | null } = {};
            MAPEH_COMPONENTS.forEach(comp => {
                const record = classRecords.find(r => r.studentId === student.id && r.subject === comp && r.quarter === quarter && r.batchId === batchId);
                const recordSettings = classRecordSettings.find(s => s.subject === comp && s.quarter === quarter && s.batchId === batchId);
                if (record && recordSettings) {
                    const { initialGrade } = calculateInitialGrade(record, recordSettings);
                    componentGrades[comp] = initialGrade !== null ? transmuteGrade(initialGrade) : null;
                } else {
                    componentGrades[comp] = null;
                }
            });

            const validGrades = Object.values(componentGrades).filter(g => g !== null) as number[];
            const finalMapehGrade = validGrades.length > 0 ? Math.round(validGrades.reduce((a, b) => a + b, 0) / validGrades.length) : null;
            
            return { student, componentGrades, finalMapehGrade };
        });
    }, [isMapeh, students, classRecords, classRecordSettings, quarter, batchId]);


    const handleMapehExportDocx = async () => {
        setIsDownloading(true);
        const toastId = toast.loading('Exporting MAPEH Record to DOCX...');
        
        const studentInfo = students[0];
        const selectedSectionText = (studentInfo?.gradeLevel && studentInfo?.section)
            ? `${studentInfo.gradeLevel} - ${studentInfo.section}`
            : 'Class Record';

        try {
            await docxService.generateMapehRecordDocx({
                summaryData: summaryDataForExport,
                settings,
                quarter,
                selectedSectionText
            });
            toast.success('DOCX downloaded successfully!', { id: toastId });
        } catch (error) {
            console.error("Error generating DOCX:", error);
            toast.error('Failed to generate DOCX.', { id: toastId });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleMapehExportXlsx = async () => {
        setIsDownloading(true);
        const toastId = toast.loading('Exporting MAPEH Record to XLSX...');
        
        const studentInfo = students[0];
        const selectedSectionText = (studentInfo?.gradeLevel && studentInfo?.section)
            ? `${studentInfo.gradeLevel} - ${studentInfo.section}`
            : 'Class Record';

        try {
            excelService.generateMapehRecordXlsx({
                summaryData: summaryDataForExport,
                settings,
                quarter,
                selectedSectionText
            });
            toast.success('XLSX downloaded successfully!', { id: toastId });
        } catch (error) {
            console.error("Error generating XLSX:", error);
            toast.error('Failed to generate XLSX.', { id: toastId });
        } finally {
            setIsDownloading(false);
        }
    };
    
    if (!isMapeh) {
        return <ClassRecordGrid {...props} />;
    }

    return (
        <div className="bg-base-200 p-4 rounded-xl shadow-lg">
            <div className="flex flex-wrap justify-between items-end gap-4 mb-4">
                <div className="flex border-b border-base-300">
                    {(['Summary', ...MAPEH_COMPONENTS] as MapehTab[]).map(tab => (
                        <TabButton
                            key={tab}
                            label={tab}
                            isActive={activeMapehTab === tab}
                            onClick={() => setActiveMapehTab(tab)}
                        />
                    ))}
                </div>
                 <div className="flex items-center bg-secondary rounded-lg">
                     <button onClick={handleMapehExportDocx} disabled={isDownloading} className="flex items-center gap-2 px-4 py-2 text-white font-bold text-sm rounded-l-lg hover:bg-secondary-focus transition-colors disabled:opacity-50">
                        <DownloadIcon className="w-4 h-4" />
                        <span>Export as DOCX</span>
                    </button>
                    <div className="h-full w-px bg-base-300"></div>
                     <button onClick={handleMapehExportXlsx} disabled={isDownloading} className="flex items-center gap-2 px-4 py-2 text-white font-bold text-sm rounded-r-lg hover:bg-secondary-focus transition-colors disabled:opacity-50">
                        <DownloadIcon className="w-4 h-4" />
                        <span>Export as XLSX</span>
                    </button>
                </div>
            </div>
            <div className="mt-4">
                {activeMapehTab === 'Summary' ? (
                    <MapehSummaryView 
                        students={students}
                        batchId={batchId}
                        quarter={quarter}
                    />
                ) : (
                    <ClassRecordGrid
                        key={activeMapehTab} // Re-mounts the component when tab changes
                        students={students}
                        batchId={batchId}
                        subject={activeMapehTab}
                        quarter={quarter}
                    />
                )}
            </div>
        </div>
    );
};

export default EClassRecord;