import React, { useMemo } from 'react';
import { Student, Quarter } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { calculateInitialGrade, transmuteGrade } from '../utils/transmutation';

interface MapehSummaryViewProps {
    students: Student[];
    batchId: string;
    quarter: Quarter;
}

const MAPEH_COMPONENTS = ['Music', 'Arts', 'PE', 'Health'];

const MapehSummaryView: React.FC<MapehSummaryViewProps> = ({ students, batchId, quarter }) => {
    const { classRecords, classRecordSettings } = useAppContext();

    const summaryData = useMemo(() => {
        return students.map(student => {
            const componentGrades: { [key: string]: number | null } = {};

            MAPEH_COMPONENTS.forEach(comp => {
                const record = classRecords.find(r => r.studentId === student.id && r.subject === comp && r.quarter === quarter && r.batchId === batchId);
                const settings = classRecordSettings.find(s => s.subject === comp && s.quarter === quarter && s.batchId === batchId);

                if (record && settings) {
                    const { initialGrade } = calculateInitialGrade(record, settings);
                    componentGrades[comp] = initialGrade !== null ? transmuteGrade(initialGrade) : null;
                } else {
                    componentGrades[comp] = null;
                }
            });

            const validGrades = Object.values(componentGrades).filter(g => g !== null) as number[];
            const finalMapehGrade = validGrades.length > 0 ? Math.round(validGrades.reduce((a, b) => a + b, 0) / validGrades.length) : null;
            
            return { student, componentGrades, finalMapehGrade };
        });
    }, [students, classRecords, classRecordSettings, quarter, batchId]);
    
    const { males, females } = useMemo(() => {
        const males = summaryData.filter(s => s.student.gender === 'Male').sort((a,b) => a.student.lastName.localeCompare(b.student.lastName));
        const females = summaryData.filter(s => s.student.gender === 'Female').sort((a,b) => a.student.lastName.localeCompare(b.student.lastName));
        return { males, females };
    }, [summaryData]);

    const renderStudentRow = (data: typeof summaryData[0], index: number) => {
        const { student, componentGrades, finalMapehGrade } = data;
        return (
            <tr key={student.id} className="hover:bg-base-300/30">
                <td className="p-2 border border-base-300 text-center">{index + 1}</td>
                <td className="p-2 border border-base-300 text-left truncate">{`${student.lastName}, ${student.firstName}${student.middleName && student.middleName.trim() ? ` ${student.middleName.trim().charAt(0)}.` : ''}`}</td>
                {MAPEH_COMPONENTS.map(comp => (
                    <td key={comp} className={`p-2 border border-base-300 text-center font-semibold ${(componentGrades[comp] ?? 100) < 75 ? 'text-error' : ''}`}>
                        {componentGrades[comp]}
                    </td>
                ))}
                <td className="p-2 border border-base-300 text-center font-bold text-lg text-primary bg-primary/10">
                    {finalMapehGrade}
                </td>
            </tr>
        )
    }

    return (
        <div className="overflow-x-auto">
            <h3 className="text-xl font-bold text-base-content mb-4">MAPEH Grade Summary - Q{quarter}</h3>
            <table className="w-full border-collapse text-sm whitespace-nowrap">
                <thead className="bg-base-300/50 text-center font-semibold">
                    <tr>
                        <th className="p-2 border border-base-300 w-[5%]">#</th>
                        <th className="p-2 border border-base-300 text-left w-[35%]">Student Name</th>
                        {MAPEH_COMPONENTS.map(comp => <th key={comp} className="p-2 border border-base-300">{comp}</th>)}
                        <th className="p-2 border border-base-300">Final MAPEH Grade</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="bg-base-300/30"><td colSpan={7} className="font-bold p-1 text-left">MALE</td></tr>
                    {males.length > 0 ? (
                        males.map((data, index) => renderStudentRow(data, index))
                    ) : (
                        <tr><td colSpan={7} className="text-center p-4 italic text-base-content/70">No male students.</td></tr>
                    )}
                    <tr className="bg-base-300/30"><td colSpan={7} className="font-bold p-1 text-left">FEMALE</td></tr>
                    {females.length > 0 ? (
                        females.map((data, index) => renderStudentRow(data, males.length + index))
                    ) : (
                         <tr><td colSpan={7} className="text-center p-4 italic text-base-content/70">No female students.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default MapehSummaryView;