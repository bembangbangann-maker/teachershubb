import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Student, AttendanceStatus } from '../types';
import { TrashIcon, IdCardIcon, EditIcon } from './icons';
import { useAppContext } from '../contexts/AppContext';

interface AttendanceGridProps {
  students: Student[];
  onDeleteStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  currentUTCDate: Date;
  changeMonth: (delta: number) => void;
}

const statusCycle: Record<string, AttendanceStatus | ''> = {
  '': 'present',
  'present': 'late',
  'late': 'absent',
  'absent': '',
};

const statusDisplay: Record<string, string> = {
    present: 'P',
    absent: 'A',
    late: 'L',
    '': '',
}

const statusColor: Record<string, string> = {
    present: 'text-green-400',
    absent: 'text-red-400',
    late: 'text-yellow-400',
}

const AttendanceGrid: React.FC<AttendanceGridProps> = ({ students, onDeleteStudent, onEditStudent, currentUTCDate, changeMonth }) => {
  const { attendance, setAttendance, removeAttendance } = useAppContext();

  const year = currentUTCDate.getUTCFullYear();
  const month = currentUTCDate.getUTCMonth(); // 0-indexed UTC month

  const { daysInMonth, monthDays } = useMemo(() => {
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return {
      daysInMonth: lastDay,
      monthDays: Array.from({ length: lastDay }, (_, i) => i + 1),
    };
  }, [year, month]);

  const attendanceMap = useMemo(() => {
    const map = new Map<string, Map<number, AttendanceStatus>>();
    for(const att of attendance) {
        const attDate = new Date(`${att.date}T00:00:00Z`);
        if (attDate.getUTCFullYear() === year && attDate.getUTCMonth() === month) {
            if (!map.has(att.studentId)) {
                map.set(att.studentId, new Map());
            }
            const day = attDate.getUTCDate();
            map.get(att.studentId)!.set(day, att.status);
        }
    }
    return map;
  }, [attendance, year, month]);

  const handleStatusChange = (studentId: string, day: number) => {
    const currentStatus = attendanceMap.get(studentId)?.get(day) || '';
    const nextStatus = statusCycle[currentStatus];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (nextStatus) {
      setAttendance(studentId, dateStr, nextStatus);
    } else {
      removeAttendance(studentId, dateStr);
    }
  };

  return (
    <div>
        <div className="p-4 border-b border-base-300 flex justify-between items-center print-hide">
            <h3 id="attendance-month-header" className="text-xl font-bold text-base-content">Monthly Attendance</h3>
            <div className="flex items-center gap-4">
                <button onClick={() => changeMonth(-1)} className="px-3 py-1 bg-base-300 hover:bg-primary rounded-md">&larr;</button>
                <span className="font-semibold text-lg w-36 text-center">{currentUTCDate.toLocaleString('default', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</span>
                <button onClick={() => changeMonth(1)} className="px-3 py-1 bg-base-300 hover:bg-primary rounded-md">&rarr;</button>
            </div>
        </div>
      <div id="attendance-grid-container" className="overflow-x-auto">
        <table className="w-full text-sm text-left text-base-content">
          <thead className="text-xs text-base-content/70 uppercase bg-base-300 sticky top-0">
            <tr>
              <th scope="col" className="px-2 py-3 w-32 md:min-w-[180px] z-10 sticky left-0 bg-base-300">Student Name</th>
              {monthDays.map(day => {
                  const d = new Date(Date.UTC(year, month, day));
                  const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
                  return (
                    <th key={day} scope="col" className={`py-3 text-center w-12 ${isWeekend ? 'bg-base-100' : ''}`}>
                        <div className="text-base-content/70 text-[10px]">{d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })[0]}</div>
                        <div>{day}</div>
                    </th>
                  )
              })}
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.id} className="bg-base-200 border-b border-base-300 hover:bg-base-300/50">
                <td 
                    title={`${student.lastName}, ${student.firstName}`}
                    className="px-2 py-2 font-medium text-base-content whitespace-nowrap z-10 sticky left-0 bg-base-200 hover:bg-base-300/50 flex items-center justify-between w-32 md:min-w-[180px]"
                >
                  <div className="flex-grow min-w-0">
                      <span className="truncate block">{student.lastName}, {student.firstName}{student.middleName && student.middleName.trim() ? ` ${student.middleName.trim().charAt(0)}.` : ''}</span>
                      {(student.gradeLevel || student.section) && (
                          <div className="text-xs text-base-content/70 font-normal hidden md:block">
                              {student.gradeLevel && `Grade ${student.gradeLevel}`}
                              {student.gradeLevel && student.section && ' - '}
                              {student.section}
                          </div>
                      )}
                  </div>
                  <div className="flex items-center print-hide">
                    <Link to={`/students/${student.id}`} title="View Student Profile" className="text-gray-500 hover:text-primary p-1 rounded-full transition-colors opacity-60 md:opacity-25 md:hover:opacity-100 flex-shrink-0 ml-2">
                        <IdCardIcon className="w-4 h-4"/>
                    </Link>
                    <button onClick={() => onEditStudent(student)} title="Edit Student" className="text-gray-500 hover:text-info p-1 rounded-full transition-colors opacity-60 md:opacity-25 md:hover:opacity-100 flex-shrink-0 ml-1">
                        <EditIcon className="w-4 h-4"/>
                    </button>
                    <button onClick={() => onDeleteStudent(student)} title="Delete Student" className="text-gray-500 hover:text-error p-1 rounded-full transition-colors opacity-60 md:opacity-25 md:hover:opacity-100 flex-shrink-0 ml-1">
                        <TrashIcon className="w-4 h-4"/>
                    </button>
                  </div>
                </td>
                {monthDays.map(day => {
                    const status = attendanceMap.get(student.id)?.get(day) || '';
                    const d = new Date(Date.UTC(year, month, day));
                    const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
                    return (
                        <td key={day} className={`text-center border-l border-base-300 ${isWeekend ? 'bg-base-100/50' : ''}`}>
                            <div 
                                onClick={() => !isWeekend && handleStatusChange(student.id, day)}
                                className={`w-full h-10 flex items-center justify-center font-bold text-base ${!isWeekend ? 'cursor-pointer hover:bg-primary/20' : ''} ${statusColor[status] || ''}`}
                            >
                                {statusDisplay[status]}
                            </div>
                        </td>
                    )
                })}
              </tr>
            ))}
             {students.length === 0 && (
                <tr>
                    <td colSpan={daysInMonth + 1} className="text-center py-8">
                        No students found for this class.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceGrid;