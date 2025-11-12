import React, { useState, useMemo, useCallback } from 'react';
import { Student, SchoolSettings } from '../types';
import { useAppContext } from '../contexts/AppContext';

interface SF2Props {
    schoolSettings: SchoolSettings;
    students: Student[];
    currentUTCDate: Date;
    setCurrentUTCDate: React.Dispatch<React.SetStateAction<Date>>;
}

const SF2: React.FC<SF2Props> = ({ schoolSettings, students, currentUTCDate, setCurrentUTCDate }) => {
    const { attendance } = useAppContext();
    
    const year = currentUTCDate.getUTCFullYear();
    const month = currentUTCDate.getUTCMonth(); // 0-indexed UTC month

    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const studentsByGender = useMemo(() => {
        const males = students.filter(s => s.gender === 'Male').sort((a,b) => a.lastName.localeCompare(b.lastName));
        const females = students.filter(s => s.gender === 'Female').sort((a,b) => a.lastName.localeCompare(b.lastName));
        return { males, females };
    }, [students]);

    const attendanceMap = useMemo(() => {
        const map = new Map<string, Map<number, string>>();
        for (const att of attendance) {
            const attDate = new Date(`${att.date}T00:00:00Z`);
            if (attDate.getUTCFullYear() === year && attDate.getUTCMonth() === month) {
                if (!map.has(att.studentId)) {
                    map.set(att.studentId, new Map());
                }
                const day = attDate.getUTCDate();
                const status = att.status === 'absent' ? 'x' : att.status === 'late' ? '.' : ''; // Present is blank
                if (status) { // Only add non-present records
                    map.get(att.studentId)!.set(day, status);
                }
            }
        }
        return map;
    }, [attendance, year, month]);

    const summary = useMemo(() => {
        const studentTotals = new Map<string, { absences: number; tardies: number }>();
        const dailyTotals = {
            male: { absences: Array(daysInMonth + 1).fill(0), tardies: Array(daysInMonth + 1).fill(0) },
            female: { absences: Array(daysInMonth + 1).fill(0), tardies: Array(daysInMonth + 1).fill(0) },
        };
        
        let schoolDays = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            const d = new Date(Date.UTC(year, month, day));
            // A school day is any day that is not a Saturday (6) or Sunday (0)
            if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) {
                schoolDays++;
            }
        }

        students.forEach(s => {
            let absences = 0;
            let tardies = 0;
            for (let day = 1; day <= daysInMonth; day++) {
                const status = attendanceMap.get(s.id)?.get(day);
                if (status === 'x') {
                    absences++;
                    if (s.gender === 'Male') dailyTotals.male.absences[day]++;
                    else if (s.gender === 'Female') dailyTotals.female.absences[day]++;
                } else if (status === '.') {
                    tardies++;
                    if (s.gender === 'Male') dailyTotals.male.tardies[day]++;
                    else if (s.gender === 'Female') dailyTotals.female.tardies[day]++;
                }
            }
            studentTotals.set(s.id, { absences, tardies });
        });

        const combinedDailyAbsences = monthDays.map(day => dailyTotals.male.absences[day] + dailyTotals.female.absences[day]);
        const combinedDailyTardies = monthDays.map(day => dailyTotals.male.tardies[day] + dailyTotals.female.tardies[day]);
        
        const monthlyMaleAbsences = dailyTotals.male.absences.reduce((a,b)=> a+b, 0);
        const monthlyFemaleAbsences = dailyTotals.female.absences.reduce((a,b)=> a+b, 0);
        const monthlyMaleTardies = dailyTotals.male.tardies.reduce((a,b)=> a+b, 0);
        const monthlyFemaleTardies = dailyTotals.female.tardies.reduce((a,b)=> a+b, 0);

        const totalEnrolmentMale = studentsByGender.males.length;
        const totalEnrolmentFemale = studentsByGender.females.length;

        const totalPossibleAttendanceMale = totalEnrolmentMale * schoolDays;
        const totalPossibleAttendanceFemale = totalEnrolmentFemale * schoolDays;

        const totalAttendanceMale = totalPossibleAttendanceMale - monthlyMaleAbsences;
        const totalAttendanceFemale = totalPossibleAttendanceFemale - monthlyFemaleAbsences;

        const percAttendanceMale = totalPossibleAttendanceMale > 0 ? (totalAttendanceMale / totalPossibleAttendanceMale) * 100 : 0;
        const percAttendanceFemale = totalPossibleAttendanceFemale > 0 ? (totalAttendanceFemale / totalPossibleAttendanceFemale) * 100 : 0;
        const totalPerc = (totalPossibleAttendanceMale + totalPossibleAttendanceFemale > 0) 
            ? ((totalAttendanceMale + totalAttendanceFemale) / (totalPossibleAttendanceMale + totalPossibleAttendanceFemale)) * 100
            : 0;

        return {
            studentTotals,
            dailyTotals,
            combinedDailyAbsences,
            combinedDailyTardies,
            monthlyMaleAbsences, monthlyFemaleAbsences, monthlyMaleTardies, monthlyFemaleTardies,
            percAttendanceMale, percAttendanceFemale, totalPerc,
            schoolDays
        };
    }, [students, studentsByGender.males.length, studentsByGender.females.length, daysInMonth, month, year, attendanceMap]);


    const changeMonth = useCallback((delta: number) => {
        setCurrentUTCDate(prev => {
            const newDate = new Date(prev.getTime());
            newDate.setUTCMonth(newDate.getUTCMonth() + delta);
            return newDate;
        });
    }, [setCurrentUTCDate]);
    
    const renderStudentRows = (studentList: Student[], startIndex: number) => {
        return studentList.map((student, index) => (
            <tr key={student.id} className="text-center">
                <td className="border border-base-300 p-1">{startIndex + index + 1}</td>
                <td className="border border-base-300 p-1 text-left">{`  ${student.lastName}, ${student.firstName} ${student.middleName?.[0] || ''}.`}</td>
                {monthDays.map(day => (
                    <td key={day} className="border border-base-300 p-1 font-mono">
                        {attendanceMap.get(student.id)?.get(day) || ''}
                    </td>
                ))}
                <td className="border border-base-300 p-1">{summary.studentTotals.get(student.id)?.absences || ''}</td>
                <td className="border border-base-300 p-1">{summary.studentTotals.get(student.id)?.tardies || ''}</td>
            </tr>
        ))
    }
    
    const { gradeLevel, section } = useMemo(() => {
        let foundGradeLevel = '';
        let foundSection = '';

        const studentWithInfo = students.find(s => s.gradeLevel && s.section);
        if (studentWithInfo) {
            foundGradeLevel = studentWithInfo.gradeLevel;
            foundSection = studentWithInfo.section;
        } else if (students.length > 0) {
            const firstStudent = students[0];
            const fileName = firstStudent.importFileName || '';
            const match = fileName.match(/(Grade\s*\d+|\d+)\s*-\s*([\w\s]+)/i);
            if (match) {
                foundGradeLevel = match[1].replace(/Grade\s*/i, 'Grade ').trim();
                foundSection = match[2].replace(/\.(xlsx|docx)$/i, '').trim();
            } else if (firstStudent.gradeLevel) {
                foundGradeLevel = firstStudent.gradeLevel;
            } else if (firstStudent.section) {
                foundSection = firstStudent.section;
            }
        }
        
        return { 
            gradeLevel: foundGradeLevel || '_______', 
            section: foundSection || '_______' 
        };
    }, [students]);

    return (
        <div className="bg-base-200 text-base-content p-4 font-serif">
            <div className="flex justify-between items-center mb-4 print-hide">
                <h1 className="font-bold text-lg text-base-content">School Form 2 Preview</h1>
                 <div className="flex items-center gap-4">
                    <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-base-300 hover:bg-primary rounded-md border border-base-300">&larr;</button>
                    <span className="font-semibold text-lg w-36 text-center">{currentUTCDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</span>
                    <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-base-300 hover:bg-primary rounded-md border border-base-300">&rarr;</button>
                </div>
            </div>
            
             <div className="text-center mb-2">
                <p className="text-sm font-bold">School Form 2 (SF2) Daily Attendance Report of Learners</p>
                <p className="text-sm">For the Month of <span className="font-bold underline">{currentUTCDate.toLocaleString('default', { month: 'long', timeZone: 'UTC' })}</span></p>
            </div>

            {/* Form Header */}
            <table className="w-full text-[10px] mb-2">
                <tbody>
                    <tr>
                        <td className="w-1/6 text-right pr-2">School ID</td>
                        <td className="w-1/6 font-bold border-b border-base-300">{schoolSettings.schoolId}</td>
                        <td className="w-1/6 text-right pr-2">School Year</td>
                        <td className="w-1/6 font-bold border-b border-base-300">{schoolSettings.schoolYear}</td>
                        <td className="w-1/6 text-right pr-2">Grade Level</td>
                        <td className="w-1/6 font-bold border-b border-base-300">{gradeLevel}</td>
                    </tr>
                     <tr>
                        <td className="text-right pr-2">Name of School</td>
                        <td className="font-bold border-b border-base-300" colSpan={3}>{schoolSettings.schoolName}</td>
                        <td className="text-right pr-2">Section</td>
                        <td className="font-bold border-b border-base-300">{section}</td>
                    </tr>
                </tbody>
            </table>
            
            <table className="w-full border-collapse border border-base-300 mt-2 text-[8px]">
                <thead>
                    <tr className="font-bold">
                        <th rowSpan={2} className="border border-base-300 p-1">#</th>
                        <th rowSpan={2} className="border border-base-300 p-1 w-1/4">LEARNER'S NAME<br/>(Last Name, First Name, Middle Initial)</th>
                        <th colSpan={daysInMonth} className="border border-base-300 p-1">(Daily Attendance)</th>
                        <th colSpan={2} className="border border-base-300 p-1">Total for the Month</th>
                    </tr>
                    <tr className="font-bold">
                        {monthDays.map(day => <th key={day} className="border border-base-300 p-1 font-normal w-[1.5%]">{day}</th>)}
                        <th className="border border-base-300 p-1 font-normal">ABSENCES</th>
                        <th className="border border-base-300 p-1 font-normal">TARDINESS</th>
                    </tr>
                </thead>
                <tbody>
                    {studentsByGender.males.length > 0 && (
                        <>
                            <tr><td colSpan={daysInMonth + 4} className="font-bold text-left p-1 bg-base-300">MALE</td></tr>
                            {renderStudentRows(studentsByGender.males, 0)}
                        </>
                    )}
                    {studentsByGender.females.length > 0 && (
                        <>
                            <tr><td colSpan={daysInMonth + 4} className="font-bold text-left p-1 bg-base-300">FEMALE</td></tr>
                            {renderStudentRows(studentsByGender.females, studentsByGender.males.length)}
                        </>
                    )}
                </tbody>
                <tfoot className="font-bold text-center">
                    <tr>
                         <td colSpan={2} className="border border-base-300 p-1 text-left bg-base-300">MALE | Total per Day &rarr;</td>
                         {monthDays.map(day => <td key={day} className="border border-base-300 p-1 bg-base-300">{summary.dailyTotals.male.absences[day] || ''}</td>)}
                         <td className="border border-base-300 p-1 bg-base-300">{summary.monthlyMaleAbsences}</td>
                         <td className="border border-base-300 p-1 bg-base-300">{summary.monthlyMaleTardies}</td>
                    </tr>
                     <tr>
                         <td colSpan={2} className="border border-base-300 p-1 text-left bg-base-300">FEMALE | Total per Day &rarr;</td>
                         {monthDays.map(day => <td key={day} className="border border-base-300 p-1 bg-base-300">{summary.dailyTotals.female.absences[day] || ''}</td>)}
                         <td className="border border-base-300 p-1 bg-base-300">{summary.monthlyFemaleAbsences}</td>
                         <td className="border border-base-300 p-1 bg-base-300">{summary.monthlyFemaleTardies}</td>
                    </tr>
                     <tr>
                         <td colSpan={2} className="border border-base-300 p-1 text-left bg-base-300">COMBINED | Total per Day &rarr;</td>
                         {monthDays.map(day => <td key={day} className="border border-base-300 p-1 bg-base-300">{summary.combinedDailyAbsences[day-1] || ''}</td>)}
                         <td className="border border-base-300 p-1 bg-base-300">{summary.monthlyMaleAbsences + summary.monthlyFemaleAbsences}</td>
                         <td className="border border-base-300 p-1 bg-base-300">{summary.monthlyMaleTardies + summary.monthlyFemaleTardies}</td>
                    </tr>
                </tfoot>
            </table>

             <div className="grid grid-cols-2 mt-2 text-[10px]">
                <div className="pr-4">
                    <p className="font-bold">GUIDELINES:</p>
                    <ol className="list-decimal list-inside text-[9px]">
                        <li>The attendance shall be checked every day.</li>
                        <li>Dates shall be written in the columns after Learner's Name.</li>
                        <li>To mark the attendance, write the following symbols:
                            <ul className="list-disc list-inside pl-4">
                                <li>(blank) - Present</li>
                                <li>(x) - Absent on a particular day.</li>
                                <li>(.) - Tardy (late) in the morning or afternoon.</li>
                            </ul>
                        </li>
                        <li>The Total for the month is the sum of all absences and tardiness.</li>
                    </ol>
                </div>
                <div className="pl-4">
                    <table className="w-full border-collapse border border-base-300 text-[9px]">
                        <thead>
                            <tr className="font-bold bg-base-300">
                                <th className="border border-base-300 p-1">Month: {currentUTCDate.toLocaleString('default', { month: 'long', timeZone: 'UTC' })}</th>
                                <th className="border border-base-300 p-1">Male</th>
                                <th className="border border-base-300 p-1">Female</th>
                                <th className="border border-base-300 p-1">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                             <tr>
                                <td className="border border-base-300 p-1 font-bold">No. of Days of Classes</td>
                                <td className="border border-base-300 p-1 text-center">{summary.schoolDays}</td>
                                <td className="border border-base-300 p-1 text-center">{summary.schoolDays}</td>
                                <td className="border border-base-300 p-1 text-center">{summary.schoolDays}</td>
                            </tr>
                            <tr>
                                <td className="border border-base-300 p-1 font-bold">% of Attendance for the month</td>
                                <td className="border border-base-300 p-1 text-center">{summary.percAttendanceMale.toFixed(2).replace('.', ',')}%</td>
                                <td className="border border-base-300 p-1 text-center">{summary.percAttendanceFemale.toFixed(2).replace('.', ',')}%</td>
                                <td className="border border-base-300 p-1 text-center">{summary.totalPerc.toFixed(2).replace('.', ',')}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="mt-4 text-[10px]">
                <p>I certify that this is a true and correct report.</p>
                <div className="text-center w-1/3 float-right mt-4">
                    <p className="font-bold underline uppercase">{schoolSettings.teacherName}</p>
                    <p>(Signature of Teacher/Class Adviser over Printed Name)</p>
                </div>
            </div>
        </div>
    );
};

export default SF2;