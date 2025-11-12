import { Student, Grade, Attendance, Anecdote, SchoolSettings, CommunicationLog, StudentQuarterlyRecord, SubjectQuarterSettings, CertificateSettings, Quarter, UiState, HonorsCalculationData, HonorsCertificateSettings, AttendanceCertificateSettings, ProfessionalDevelopmentLog } from '../types';

const STUDENTS_KEY = 'teachers_hub_students';
const GRADES_KEY = 'teachers_hub_grades';
const ATTENDANCE_KEY = 'teachers_hub_attendance';
const ANECDOTES_KEY = 'teachers_hub_anecdotes';
const SETTINGS_KEY = 'teachers_hub_settings';
const COMM_LOGS_KEY = 'teachers_hub_comm_logs';
const CLASS_RECORDS_KEY = 'teachers_hub_class_records';
const CLASS_RECORD_SETTINGS_KEY = 'teachers_hub_class_record_settings';
const CERTIFICATE_SETTINGS_KEY = 'teachers_hub_certificate_settings';
const HONORS_CALC_DATA_KEY = 'teachers_hub_honors_calc_data';
const HONORS_CERTIFICATE_SETTINGS_KEY = 'teachers_hub_honors_certificate_settings';
const ATTENDANCE_CERTIFICATE_SETTINGS_KEY = 'teachers_hub_attendance_certificate_settings';
const UI_STATE_KEY = 'teachers_hub_ui_state';
const PD_LOGS_KEY = 'teachers_hub_pd_logs';

export const ALL_DATA_KEYS = [
  STUDENTS_KEY,
  GRADES_KEY,
  ATTENDANCE_KEY,
  ANECDOTES_KEY,
  SETTINGS_KEY,
  COMM_LOGS_KEY,
  CLASS_RECORDS_KEY,
  CLASS_RECORD_SETTINGS_KEY,
  CERTIFICATE_SETTINGS_KEY,
  HONORS_CALC_DATA_KEY,
  HONORS_CERTIFICATE_SETTINGS_KEY,
  ATTENDANCE_CERTIFICATE_SETTINGS_KEY,
  UI_STATE_KEY,
  PD_LOGS_KEY,
];


const DEFAULT_SETTINGS: SchoolSettings = {
  schoolId: '',
  schoolYear: '2024-2025',
  schoolName: '',
  region: '',
  division: '',
  teacherName: '',
  sections: [],
  schoolLogo: '',
  secondLogo: '',
  checkedBy: '',
  checkerDesignation: 'Learning Area Coordinator',
  principalName: '',
  principalDesignation: 'School Principal',
  teacherSignature: '',
  checkerSignature: '',
  principalSignature: '',
};

const DEFAULT_CERTIFICATE_SETTINGS: CertificateSettings = {
  selectedBatchId: '',
  selectedClassId: '',
  selectedSubject: '',
  selectedQuarter: 1 as Quarter,
  gradeAndSection: '',
  title: 'Certificate of Recognition',
  content: `^^[STUDENT_NAME]^^

of [GRADE_AND_SECTION] for achieving commendable academic performance as

"##[AWARD_TYPE]##"

during the [QUARTER] Quarter of School Year [SCHOOL_YEAR].
Given this [DAY] day of [MONTH], [YEAR] at [SCHOOL_NAME].`,
  fontFamily: 'font-cinzel',
  studentNameFontFamily: 'font-playfair',
  fontSize: 19.5,
  titleFontSize: 48,
  lineHeight: 1.5,
  backgroundStyle: 'border-elegant',
  verticalPadding: 20,
  wordSpacing: 1.5,
  showSchoolLogo: true,
  showSecondLogo: true,
  showAdviser: true,
  showCoordinator: false,
  showPrincipal: false,
  teacherDesignationType: 'subjectTeacher',
  customTeacherDesignation: '',
  emailSubject: 'Congratulations on Your Academic Achievement!',
  emailBody: `Dear [STUDENT_NAME],

Congratulations on receiving the "[AWARD_TYPE]" award for your excellent performance in [SUBJECT] during the [QUARTER] Quarter!

Your hard work and dedication are truly paying off. Keep up the fantastic effort!

Sincerely,
[TEACHER_NAME]`
};

const DEFAULT_HONORS_CERTIFICATE_SETTINGS: HonorsCertificateSettings = {
  title: 'Certificate of Recognition',
  content: `^^[STUDENT_NAME]^^

of [GRADE_AND_SECTION] for achieving outstanding academic performance, earning the distinction of
^^"[AWARD_TYPE]"^^
with a General Average of **[GENERAL_AVERAGE]**.`,
  fontFamily: 'font-bookman',
  studentNameFontFamily: 'font-bookman',
  fontSize: 19.5,
  titleFontSize: 78,
  lineHeight: 1.9,
  backgroundStyle: 'border-elegant',
  verticalPadding: 40,
  gradeAndSection: '',
  showSchoolLogo: true,
  showSecondLogo: true,
  showAdviser: true,
  showCoordinator: true,
  showPrincipal: true,
  teacherDesignationType: 'classAdviser',
  customTeacherDesignation: '',
  emailSubject: 'Congratulations on Your Academic Award!',
  emailBody: `Dear [STUDENT_NAME],

Congratulations on receiving the "[AWARD_TYPE]" award for your excellent academic performance, with a General Average of [GENERAL_AVERAGE]!

Always remember: "The future belongs to those who believe in the beauty of their dreams." - Eleanor Roosevelt

Keep up the wonderful work.

Sincerely,
[TEACHER_NAME]`
};

const DEFAULT_ATTENDANCE_CERTIFICATE_SETTINGS: AttendanceCertificateSettings = {
  title: 'Certificate of Perfect Attendance',
  content: `is hereby awarded to

^^[STUDENT_NAME]^^

of [GRADE_AND_SECTION] for their outstanding commitment and dedication in achieving

##Perfect Attendance##

for the month of [MONTH], [YEAR].
This award is given this [DAY] day of [MONTH], [YEAR] at [SCHOOL_NAME] in recognition of this excellent accomplishment.`,
  fontFamily: 'font-roboto-slab',
  fontSize: 18,
  titleFontSize: 48,
  lineHeight: 1.8,
  backgroundStyle: 'border-simple',
  verticalPadding: 20,
  wordSpacing: 0,
  showSchoolLogo: true,
  showSecondLogo: true,
  showAdviser: true,
  showCoordinator: false,
  showPrincipal: false,
  teacherDesignationType: 'classAdviser',
  customTeacherDesignation: '',
  emailSubject: 'Congratulations on Your Perfect Attendance!',
  emailBody: `Dear [STUDENT_NAME],

We are thrilled to congratulate you on achieving perfect attendance for the month of [MONTH]!

Your commitment to being present and on time every day is a fantastic accomplishment. Keep up the great work!

Sincerely,
[TEACHER_NAME]`
};

const DEFAULT_UI_STATE: UiState = {
    roster: {
        selectedBatchId: '',
    },
    grades: {
        selectedBatchId: '',
        selectedSubject: '',
        selectedQuarter: 1 as Quarter,
        view: 'record',
    },
    forms: {
        selectedForm: null,
        selectedBatchId: '',
    },
    honorsCalculator: {
        selectedBatchId: '',
    },
    isResourcesUnlocked: false,
    isSidebarCollapsed: false,
};


// --- Helper Functions ---
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    if (!item) {
      if (key === UI_STATE_KEY) {
          const initialUiState = { ...(defaultValue as any) };
          // For tablets and small laptops, default to a collapsed sidebar for more screen space.
          if (window.innerWidth < 1280) {
              initialUiState.isSidebarCollapsed = true;
          }
          return initialUiState as T;
      }
      return defaultValue;
    }
    let parsed = JSON.parse(item);

    // ONE-TIME MIGRATION: Fix duplicated "is given to" in certificate content
    if ((key === CERTIFICATE_SETTINGS_KEY || key === HONORS_CERTIFICATE_SETTINGS_KEY) && parsed.content && typeof parsed.content === 'string') {
        const contentTrimmed = parsed.content.trim();
        if (contentTrimmed.toLowerCase().startsWith('is given to')) {
            const match = parsed.content.match(/^is given to\s*/i);
            if (match) {
                console.warn(`[Data Migration] Removing duplicated "is given to" from ${key}.`);
                parsed.content = parsed.content.substring(match[0].length);
                saveToStorage(key, parsed); // Save cleaned data immediately
            }
        }
    }
    // END MIGRATION

    // CRITICAL FIX: Validate array types. If a backup file has a corrupted value
    // (e.g., a string instead of a list of students), this prevents the app from
    // crashing on reload by falling back to the default empty array.
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
        console.warn(`Data for key "${key}" is not an array as expected. Reverting to default.`);
        return defaultValue;
    }
    
    // For non-array objects, merge with defaults to prevent crashes from missing keys.
    // This ensures that if new properties are added to a settings object, old data
    // from localStorage won't crash the app.
    if (typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue) &&
        typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return { ...defaultValue, ...parsed };
    }
    
    return parsed ?? defaultValue;
  } catch (error) {
    console.warn(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage key “${key}”:`, error);
  }
};

// This class is now a pure wrapper around localStorage.
class DataService {
  constructor() {
    // Ensure default values exist on first load
    if (localStorage.getItem(STUDENTS_KEY) === null) saveToStorage(STUDENTS_KEY, []);
    if (localStorage.getItem(GRADES_KEY) === null) saveToStorage(GRADES_KEY, []);
    if (localStorage.getItem(ATTENDANCE_KEY) === null) saveToStorage(ATTENDANCE_KEY, []);
    if (localStorage.getItem(ANECDOTES_KEY) === null) saveToStorage(ANECDOTES_KEY, []);
    if (localStorage.getItem(COMM_LOGS_KEY) === null) saveToStorage(COMM_LOGS_KEY, []);
    if (localStorage.getItem(SETTINGS_KEY) === null) saveToStorage(SETTINGS_KEY, DEFAULT_SETTINGS);
    if (localStorage.getItem(CLASS_RECORDS_KEY) === null) saveToStorage(CLASS_RECORDS_KEY, []);
    if (localStorage.getItem(CLASS_RECORD_SETTINGS_KEY) === null) saveToStorage(CLASS_RECORD_SETTINGS_KEY, []);
    if (localStorage.getItem(CERTIFICATE_SETTINGS_KEY) === null) saveToStorage(CERTIFICATE_SETTINGS_KEY, DEFAULT_CERTIFICATE_SETTINGS);
    if (localStorage.getItem(HONORS_CALC_DATA_KEY) === null) saveToStorage(HONORS_CALC_DATA_KEY, []);
    if (localStorage.getItem(HONORS_CERTIFICATE_SETTINGS_KEY) === null) saveToStorage(HONORS_CERTIFICATE_SETTINGS_KEY, DEFAULT_HONORS_CERTIFICATE_SETTINGS);
    if (localStorage.getItem(ATTENDANCE_CERTIFICATE_SETTINGS_KEY) === null) saveToStorage(ATTENDANCE_CERTIFICATE_SETTINGS_KEY, DEFAULT_ATTENDANCE_CERTIFICATE_SETTINGS);
    if (localStorage.getItem(UI_STATE_KEY) === null) saveToStorage(UI_STATE_KEY, DEFAULT_UI_STATE);
    if (localStorage.getItem(PD_LOGS_KEY) === null) saveToStorage(PD_LOGS_KEY, []);
  }

  // Student data
  getStudents = (): Student[] => getFromStorage(STUDENTS_KEY, []);
  saveStudents = (students: Student[]): void => saveToStorage(STUDENTS_KEY, students);

  // Grade data
  getGrades = (): Grade[] => getFromStorage(GRADES_KEY, []);
  saveGrades = (grades: Grade[]): void => saveToStorage(GRADES_KEY, grades);

  // Attendance data
  getAttendance = (): Attendance[] => getFromStorage(ATTENDANCE_KEY, []);
  saveAttendance = (attendance: Attendance[]): void => saveToStorage(ATTENDANCE_KEY, attendance);
  
  // Anecdote data
  getAnecdotes = (): Anecdote[] => getFromStorage(ANECDOTES_KEY, []);
  saveAnecdotes = (anecdotes: Anecdote[]): void => saveToStorage(ANECDOTES_KEY, anecdotes);
  
  // Comm Log data
  getCommunicationLogs = (): CommunicationLog[] => getFromStorage(COMM_LOGS_KEY, []);
  saveCommunicationLogs = (logs: CommunicationLog[]): void => saveToStorage(COMM_LOGS_KEY, logs);
  
  // Settings
  getSchoolSettings = (): SchoolSettings => getFromStorage(SETTINGS_KEY, DEFAULT_SETTINGS);
  saveSchoolSettings = (settings: SchoolSettings): void => saveToStorage(SETTINGS_KEY, settings);
  
  // Class Records
  getClassRecords = (): StudentQuarterlyRecord[] => getFromStorage(CLASS_RECORDS_KEY, []);
  saveClassRecords = (records: StudentQuarterlyRecord[]): void => saveToStorage(CLASS_RECORDS_KEY, records);
  
  // Class Record Settings
  getClassRecordSettings = (): SubjectQuarterSettings[] => getFromStorage(CLASS_RECORD_SETTINGS_KEY, []);
  saveClassRecordSettings = (settings: SubjectQuarterSettings[]): void => saveToStorage(CLASS_RECORD_SETTINGS_KEY, settings);
  
  // Certificate Settings
  getCertificateSettings = (): CertificateSettings => getFromStorage(CERTIFICATE_SETTINGS_KEY, DEFAULT_CERTIFICATE_SETTINGS);
  saveCertificateSettings = (settings: CertificateSettings): void => saveToStorage(CERTIFICATE_SETTINGS_KEY, settings);

  // Honors Certificate Settings
  getHonorsCertificateSettings = (): HonorsCertificateSettings => getFromStorage(HONORS_CERTIFICATE_SETTINGS_KEY, DEFAULT_HONORS_CERTIFICATE_SETTINGS);
  saveHonorsCertificateSettings = (settings: HonorsCertificateSettings): void => saveToStorage(HONORS_CERTIFICATE_SETTINGS_KEY, settings);
  
  // Attendance Certificate Settings
  getAttendanceCertificateSettings = (): AttendanceCertificateSettings => getFromStorage(ATTENDANCE_CERTIFICATE_SETTINGS_KEY, DEFAULT_ATTENDANCE_CERTIFICATE_SETTINGS);
  saveAttendanceCertificateSettings = (settings: AttendanceCertificateSettings): void => saveToStorage(ATTENDANCE_CERTIFICATE_SETTINGS_KEY, settings);

  // Honors Calc Data
  getHonorsCalculationData = (): HonorsCalculationData[] => getFromStorage(HONORS_CALC_DATA_KEY, []);
  saveHonorsCalculationData = (data: HonorsCalculationData[]): void => saveToStorage(HONORS_CALC_DATA_KEY, data);

  // UI State
  getUiState = (): UiState => getFromStorage(UI_STATE_KEY, DEFAULT_UI_STATE);
  saveUiState = (state: UiState): void => saveToStorage(UI_STATE_KEY, state);

  // Professional Development Logs
  getPdLogs = (): ProfessionalDevelopmentLog[] => getFromStorage(PD_LOGS_KEY, []);
  savePdLogs = (logs: ProfessionalDevelopmentLog[]): void => saveToStorage(PD_LOGS_KEY, logs);

  // File parsing logic
  parseStudentFileContent = (content: string): Omit<Student, 'id'>[] => {
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    const studentsToAdd: Omit<Student, 'id'>[] = [];
    let currentGender: 'Male' | 'Female' | 'Unspecified' = 'Unspecified';
    
    for (const line of lines) {
        if (line.toLowerCase().includes('male')) {
            currentGender = 'Male';
            continue;
        }
        if (line.toLowerCase().includes('female')) {
            currentGender = 'Female';
            continue;
        }

        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 2) {
            const lastName = parts[0];
            const firstName = parts[1];
            const middleName = parts[2] || '';
            const lrn = parts[3] || '';
            const gradeLevel = parts[4] || '';
            const section = parts[5] || '';
            studentsToAdd.push({
                lrn,
                firstName,
                lastName,
                middleName,
                gender: currentGender,
                gradeLevel,
                section,
            });
        }
    }
    return studentsToAdd;
  };
}

export const dataService = new DataService();