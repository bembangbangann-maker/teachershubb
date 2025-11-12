import React, { useMemo } from 'react';
import { Student, Quarter } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { calculateInitialGrade, transmuteGrade, getHonorStatus } from '../utils/transmutation';
import { SparklesIcon } from './icons';

interface HonorsListProps {
    students: Student[];
    batchId: string;
    subject: string;
    quarter: Quarter;
}

interface HonorStudent {
    student: Student;
    quarterlyGrade: number;
    honorStatus: string;
}

const HonorsList: React.FC<HonorsListProps> = ({ students, batchId, subject, quarter }) => {
    const { classRecords, classRecordSettings } = useAppContext();

    const honorRoll: HonorStudent[] = useMemo(() => {
        return students.map(student => {
            const record = classRecords.find(r => r.studentId === student.id && r.subject === subject && r.quarter === quarter && r.batchId === batchId);
            const settingsRecord = classRecordSettings.find(s => s.subject === subject && s.quarter === quarter && s.batchId === batchId);
            
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
        })
        .filter((s): s is HonorStudent => s !== null)
        .sort((a, b) => b.quarterlyGrade - a.quarterlyGrade);
    }, [students, batchId, subject, quarter, classRecords, classRecordSettings]);
    
    const getHonorBadgeColor = (status: string) => {
        if (status === 'With Highest Honors') return 'bg-yellow-400 text-yellow-900';
        if (status === 'With High Honors') return 'bg-gray-300 text-gray-800';
        if (status === 'With Honors') return 'bg-orange-400 text-orange-900';
        return 'bg-gray-500';
    }

    if (honorRoll.length === 0) {
        return (
            <div className="text-center p-16 bg-base-200 rounded-xl border-2 border-dashed border-base-300">
                <SparklesIcon className="w-16 h-16 mx-auto text-primary mb-4" />
                <h3 className="text-2xl font-bold text-base-content">No Honors Achieved</h3>
                <p className="text-base-content mt-2">No students met the criteria for honors in this subject for the selected quarter.</p>
            </div>
        );
    }

    return (
        <div className="bg-base-200 rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-base-300">
                 <h3 className="text-xl font-bold text-base-content flex items-center">
                    <SparklesIcon className="w-6 h-6 mr-3 text-primary"/>
                    Quarterly Honor Roll
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-base-content">
                    <thead className="text-xs text-base-content/70 uppercase bg-base-300">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-center">Rank</th>
                            <th scope="col" className="px-6 py-3">Student Name</th>
                            <th scope="col" className="px-6 py-3 text-center">Quarterly Grade</th>
                            <th scope="col" className="px-6 py-3 text-center">Award</th>
                        </tr>
                    </thead>
                    <tbody>
                        {honorRoll.map((item, index) => (
                            <tr key={item.student.id} className="bg-base-200 border-b border-base-300 hover:bg-base-300/50">
                                <td className="px-6 py-4 text-center font-bold text-lg">{index + 1}</td>
                                <td className="px-6 py-4 font-medium text-base-content whitespace-nowrap">
                                    {`${item.student.lastName}, ${item.student.firstName}${item.student.middleName && item.student.middleName.trim() ? ` ${item.student.middleName.trim().charAt(0)}.` : ''}`}
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-lg text-primary">{item.quarterlyGrade}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getHonorBadgeColor(item.honorStatus)}`}>
                                        {item.honorStatus}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HonorsList;