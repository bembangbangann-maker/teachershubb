import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Student, Grade, Attendance, Anecdote, CommunicationLog, SchoolSettings, AttendanceStatus, StudentQuarterlyRecord, SubjectQuarterSettings, CertificateSettings, UiState, HonorsCalculationData, HonorsCertificateSettings, AttendanceCertificateSettings } from '../types';
import { dataService } from '../services/dataService';

interface AppContextType {
  students: Student[];
  grades: Grade[];
  attendance: Attendance[];
  anecdotes: Anecdote[];
  commLogs: CommunicationLog[];
  settings: SchoolSettings;
  classRecords: StudentQuarterlyRecord[];
  classRecordSettings: SubjectQuarterSettings[];
  certificateSettings: CertificateSettings;
  honorsCertificateSettings: HonorsCertificateSettings;
  attendanceCertificateSettings: AttendanceCertificateSettings;
  honorsCalculationData: HonorsCalculationData[];
  uiState: UiState;
  addStudent: (studentData: Omit<Student, 'id'>) => void;
  updateStudent: (studentId: string, updatedData: Partial<Student>) => void;
  deleteStudent: (studentId: string) => void;
  batchAddStudents: (studentsToAdd: Omit<Student, 'id'>[], fileName: string) => void;
  addGrades: (gradesData: Omit<Grade, 'id'>[]) => void;
  updateGrade: (gradeId: string, newScore: number) => void;
  deleteGrades: (gradeIds: string[]) => void;
  setAttendance: (studentId: string, date: string, status: AttendanceStatus) => void;
  // Fix: Allow status to be an empty string for batch updates to handle removals.
  batchUpdateAttendance: (updates: { studentId: string; date: string; status: AttendanceStatus | '' }[]) => void;
  removeAttendance: (studentId: string, date: string) => void;
  addAnecdote: (anecdoteData: Omit<Anecdote, 'id'>) => void;
  updateAnecdote: (anecdoteId: string, updatedData: Partial<Anecdote>) => void;
  addCommunicationLog: (logData: Omit<CommunicationLog, 'id'>) => void;
  saveSchoolSettings: (settings: SchoolSettings) => void;
  updateClassRecord: (record: StudentQuarterlyRecord) => void;
  batchUpdateClassRecords: (records: StudentQuarterlyRecord[]) => void;
  updateClassRecordSettings: (settings: SubjectQuarterSettings) => void;
  updateCertificateSettings: (settings: Partial<CertificateSettings>) => void;
  updateHonorsCertificateSettings: (settings: Partial<HonorsCertificateSettings>) => void;
  updateAttendanceCertificateSettings: (settings: Partial<AttendanceCertificateSettings>) => void;
  updateHonorsCalculationData: (batchId: string, data: HonorsCalculationData) => void;
  updateUiState: (updates: Partial<UiState>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>(() => dataService.getStudents());
  const [grades, setGrades] = useState<Grade[]>(() => dataService.getGrades());
  const [attendance, setAttendanceState] = useState<Attendance[]>(() => dataService.getAttendance());
  const [anecdotes, setAnecdotes] = useState<Anecdote[]>(() => dataService.getAnecdotes());
  const [commLogs, setCommLogs] = useState<CommunicationLog[]>(() => dataService.getCommunicationLogs());
  const [settings, setSettings] = useState<SchoolSettings>(() => dataService.getSchoolSettings());
  const [classRecords, setClassRecords] = useState<StudentQuarterlyRecord[]>(() => dataService.getClassRecords());
  const [classRecordSettings, setClassRecordSettings] = useState<SubjectQuarterSettings[]>(() => dataService.getClassRecordSettings());
  const [certificateSettings, setCertificateSettings] = useState<CertificateSettings>(() => dataService.getCertificateSettings());
  const [honorsCertificateSettings, setHonorsCertificateSettings] = useState<HonorsCertificateSettings>(() => dataService.getHonorsCertificateSettings());
  const [attendanceCertificateSettings, setAttendanceCertificateSettings] = useState<AttendanceCertificateSettings>(() => dataService.getAttendanceCertificateSettings());
  const [honorsCalculationData, setHonorsCalculationData] = useState<HonorsCalculationData[]>(() => dataService.getHonorsCalculationData());
  const [uiState, setUiState] = useState<UiState>(() => dataService.getUiState());

  // --- Persistence Effects ---
  useEffect(() => { dataService.saveStudents(students); }, [students]);
  useEffect(() => { dataService.saveGrades(grades); }, [grades]);
  useEffect(() => { dataService.saveAttendance(attendance); }, [attendance]);
  useEffect(() => { dataService.saveAnecdotes(anecdotes); }, [anecdotes]);
  useEffect(() => { dataService.saveCommunicationLogs(commLogs); }, [commLogs]);
  useEffect(() => { dataService.saveSchoolSettings(settings); }, [settings]);
  useEffect(() => { dataService.saveClassRecords(classRecords); }, [classRecords]);
  useEffect(() => { dataService.saveClassRecordSettings(classRecordSettings); }, [classRecordSettings]);
  useEffect(() => { dataService.saveCertificateSettings(certificateSettings); }, [certificateSettings]);
  useEffect(() => { dataService.saveHonorsCertificateSettings(honorsCertificateSettings); }, [honorsCertificateSettings]);
  useEffect(() => { dataService.saveAttendanceCertificateSettings(attendanceCertificateSettings); }, [attendanceCertificateSettings]);
  useEffect(() => { dataService.saveHonorsCalculationData(honorsCalculationData); }, [honorsCalculationData]);
  useEffect(() => { dataService.saveUiState(uiState); }, [uiState]);
  
  // Reset resource unlock on every app load for session-based access
  useEffect(() => {
    if (uiState.isResourcesUnlocked) {
        setUiState(prev => ({...prev, isResourcesUnlocked: false}));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Updater Functions ---
  const addStudent = useCallback((studentData: Omit<Student, 'id'>) => {
    setStudents(prev => [...prev, { ...studentData, id: `s${Date.now()}` }]);
  }, []);

  const updateStudent = useCallback((studentId: string, updatedData: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...updatedData } : s));
  }, []);

  const deleteStudent = useCallback((studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    setGrades(prev => prev.filter(g => g.studentId !== studentId));
    setAttendanceState(prev => prev.filter(a => a.studentId !== studentId));
    setAnecdotes(prev => prev.filter(a => a.studentId !== studentId));
    setCommLogs(prev => prev.filter(c => c.studentId !== studentId));
    setClassRecords(prev => prev.filter(r => r.studentId !== studentId));
    setHonorsCalculationData(prev => {
        return prev.map(batchData => {
            const newStudentGrades = { ...batchData.studentGrades };
            delete newStudentGrades[studentId];
            return { ...batchData, studentGrades: newStudentGrades };
        }).filter(batchData => Object.keys(batchData.studentGrades).length > 0);
    });
}, []);
  
  const batchAddStudents = useCallback((studentsToAdd: Omit<Student, 'id'>[], fileName: string) => {
      const batchId = `batch_${Date.now()}`;
      const newFullStudents = studentsToAdd.map((s, i) => ({
          ...s,
          id: `s_${batchId}_${i}`,
          importBatchId: batchId,
          importFileName: fileName,
      }));
      setStudents(prev => [...prev, ...newFullStudents]);
  }, []);
  
  const addGrades = useCallback((gradesData: Omit<Grade, 'id'>[]) => {
      const newGrades = gradesData.map(g => ({...g, id: `g${Date.now()}_${Math.random()}`}));
      setGrades(prev => [...prev, ...newGrades]);
  }, []);

  const updateGrade = useCallback((gradeId: string, newScore: number) => {
    setGrades(prev => prev.map(g => g.id === gradeId ? { ...g, score: newScore } : g));
  }, []);

  const deleteGrades = useCallback((gradeIds: string[]) => {
    const idsToDelete = new Set(gradeIds);
    setGrades(prev => prev.filter(g => !idsToDelete.has(g.id)));
  }, []);
  
  const setAttendance = useCallback((studentId: string, date: string, status: AttendanceStatus) => {
    setAttendanceState(prev => {
        const existingIndex = prev.findIndex(att => att.studentId === studentId && att.date === date);
        const newAttendance = [...prev];
        if (existingIndex > -1) {
            newAttendance[existingIndex] = { ...newAttendance[existingIndex], status };
        } else {
            newAttendance.push({ id: `att${Date.now()}`, studentId, date, status });
        }
        return newAttendance;
    });
  }, []);

  // Fix: Allow status to be an empty string for batch updates to handle removals.
  const batchUpdateAttendance = useCallback((updates: { studentId: string; date: string; status: AttendanceStatus | '' }[]) => {
    if (updates.length === 0) return;

    setAttendanceState(prev => {
        const updatesMap = new Map(updates.map(u => [`${u.studentId}-${u.date}`, u.status]));
        const updatedStudentDateKeys = new Set(updates.map(u => `${u.studentId}-${u.date}`));

        // Filter out records that are being updated or removed
        const otherRecords = prev.filter(att => !updatedStudentDateKeys.has(`${att.studentId}-${att.date}`));

        // Create new records for non-empty statuses
        const newRecords = updates
            .filter((u): u is { studentId: string; date: string; status: AttendanceStatus } => u.status !== '') // Don't create records for 'present' if it means blank
            .map(u => ({
                id: `att${Date.now()}_${u.studentId}_${Math.random()}`,
                studentId: u.studentId,
                date: u.date,
                status: u.status,
            }));

        return [...otherRecords, ...newRecords];
    });
  }, []);

  const removeAttendance = useCallback((studentId: string, date: string) => {
    setAttendanceState(prev => prev.filter(att => !(att.studentId === studentId && att.date === date)));
  }, []);

  const addAnecdote = useCallback((anecdoteData: Omit<Anecdote, 'id'>) => {
    const newAnecdote: Anecdote = { ...anecdoteData, id: `anec${Date.now()}` };
    setAnecdotes(prev => [newAnecdote, ...prev]);
  }, []);
  
  const updateAnecdote = useCallback((anecdoteId: string, updatedData: Partial<Anecdote>) => {
      setAnecdotes(prev => prev.map(a => a.id === anecdoteId ? { ...a, ...updatedData } : a));
  }, []);
  
  const addCommunicationLog = useCallback((logData: Omit<CommunicationLog, 'id'>) => {
    const newLog: CommunicationLog = { ...logData, id: `comm${Date.now()}` };
    setCommLogs(prev => [newLog, ...prev]);
  }, []);
  
  const saveSchoolSettings = useCallback((newSettings: SchoolSettings) => {
      setSettings(newSettings);
  }, []);

  const updateClassRecord = useCallback((record: StudentQuarterlyRecord) => {
    setClassRecords(prev => {
        const index = prev.findIndex(r => r.id === record.id);
        if (index > -1) {
            const newRecords = [...prev];
            newRecords[index] = record;
            return newRecords;
        }
        return [...prev, record];
    });
  }, []);

  const batchUpdateClassRecords = useCallback((recordsToUpdate: StudentQuarterlyRecord[]) => {
    setClassRecords(prevRecords => {
        const recordsToUpdateMap = new Map(recordsToUpdate.map(rec => [rec.id, rec]));
        
        const updatedRecords = prevRecords.map(rec => {
            return recordsToUpdateMap.get(rec.id) || rec;
        });

        recordsToUpdate.forEach(updatedRec => {
            if (!updatedRecords.some(r => r.id === updatedRec.id)) {
                updatedRecords.push(updatedRec);
            }
        });

        return updatedRecords;
    });
  }, []);

  const updateClassRecordSettings = useCallback((settings: SubjectQuarterSettings) => {
    setClassRecordSettings(prev => {
        const index = prev.findIndex(s => s.id === settings.id);
        if (index > -1) {
            const newSettings = [...prev];
            newSettings[index] = settings;
            return newSettings;
        }
        return [...prev, settings];
    });
  }, []);

  const updateCertificateSettings = useCallback((newSettings: Partial<CertificateSettings>) => {
    setCertificateSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const updateHonorsCertificateSettings = useCallback((newSettings: Partial<HonorsCertificateSettings>) => {
    setHonorsCertificateSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const updateAttendanceCertificateSettings = useCallback((newSettings: Partial<AttendanceCertificateSettings>) => {
    setAttendanceCertificateSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const updateHonorsCalculationData = useCallback((batchId: string, data: HonorsCalculationData) => {
    setHonorsCalculationData(prev => {
        const index = prev.findIndex(d => d.batchId === batchId);
        if (index > -1) {
            const newData = [...prev];
            newData[index] = data;
            return newData;
        }
        return [...prev, data];
    });
  }, []);

  const updateUiState = useCallback((updates: Partial<UiState>) => {
      setUiState(prev => ({ ...prev, ...updates }));
  }, []);
  
  const value = useMemo(() => ({
    students,
    grades,
    attendance,
    anecdotes,
    commLogs,
    settings,
    classRecords,
    classRecordSettings,
    certificateSettings,
    honorsCertificateSettings,
    attendanceCertificateSettings,
    honorsCalculationData,
    uiState,
    addStudent,
    updateStudent,
    deleteStudent,
    batchAddStudents,
    addGrades,
    updateGrade,
    deleteGrades,
    setAttendance,
    batchUpdateAttendance,
    removeAttendance,
    addAnecdote,
    updateAnecdote,
    addCommunicationLog,
    saveSchoolSettings,
    updateClassRecord,
    batchUpdateClassRecords,
    updateClassRecordSettings,
    updateCertificateSettings,
    updateHonorsCertificateSettings,
    updateAttendanceCertificateSettings,
    updateHonorsCalculationData,
    updateUiState,
  }), [students, grades, attendance, anecdotes, commLogs, settings, classRecords, classRecordSettings, certificateSettings, honorsCertificateSettings, attendanceCertificateSettings, honorsCalculationData, uiState, addStudent, updateStudent, deleteStudent, batchAddStudents, addGrades, updateGrade, deleteGrades, setAttendance, batchUpdateAttendance, removeAttendance, addAnecdote, updateAnecdote, addCommunicationLog, saveSchoolSettings, updateClassRecord, batchUpdateClassRecords, updateClassRecordSettings, updateCertificateSettings, updateHonorsCertificateSettings, updateAttendanceCertificateSettings, updateHonorsCalculationData, updateUiState]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
