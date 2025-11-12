// Fix: This file had circular dependencies. Redefining all types here to resolve the issue.
export type Quarter = 1 | 2 | 3 | 4;

export type Gender = 'Male' | 'Female' | 'Other' | 'Unspecified';

export interface Student {
    id: string;
    lrn: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    gender: Gender;
    contactInfo?: string;
    gradeLevel?: string;
    section?: string;
    importBatchId?: string;
    importFileName?: string;
    photo?: string; // base64
}

export type GradeType = 'Quiz' | 'Exam' | 'Project' | 'Assignment' | 'Performance Task';

export interface Grade {
    id: string;
    studentId: string;
    subject: string;
    quarter: Quarter;
    type: GradeType;
    score: number;
    maxScore: number;
    date: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface Attendance {
    id: string;
    studentId: string;
    date: string; // YYYY-MM-DD
    status: AttendanceStatus;
}

export interface Anecdote {
    id: string;
    studentId: string;
    date: string; // ISO string
    observation: string;
    tags: string[];
}

export interface CommunicationLog {
    id: string;
    studentId: string;
    date: string; // ISO string
    method: 'Email' | 'Phone Call' | 'Meeting';
    notes: string;
}

export interface ProfessionalDevelopmentLog {
    id: string;
    title: string;
    dateFrom: string; 
    dateTo: string; 
    hours: number;
    type: 'Seminar' | 'Workshop' | 'Training' | 'Graduate Studies' | 'Other';
    level: 'School' | 'District' | 'Regional' | 'National' | 'International';
    certificateImage?: string; // base64
    notes?: string;
}

export interface Section {
    id: string;
    gradeLevel: string;
    sectionName: string;
}

export interface SchoolSettings {
    schoolId: string;
    schoolYear: string;
    schoolName: string;
    region: string;
    division: string;
    teacherName: string;
    sections: Section[];
    schoolLogo: string; // base64
    secondLogo: string; // base64
    checkedBy: string;
    checkerDesignation: string;
    principalName: string;
    principalDesignation: string;
    teacherSignature: string; // base64
    checkerSignature: string; // base64
    principalSignature: string; //base64
}

export interface StudentQuarterlyRecord {
    id: string;
    studentId: string;
    subject: string;
    quarter: Quarter;
    batchId: string;
    writtenWorks: (number | null)[];
    performanceTasks: (number | null)[];
    quarterlyAssessment: number | null;
}

export interface SubjectQuarterSettings {
    id: string;
    subject: string;
    quarter: Quarter;
    batchId: string;
    writtenWorksMax: (number | null)[];
    performanceTasksMax: (number | null)[];
    quarterlyAssessmentMax: number | null;
    wwPercentage: number;
    ptPercentage: number;
    qaPercentage: number;
}

export interface CertificateSettings {
    selectedBatchId: string;
    selectedClassId: string;
    selectedSubject: string;
    selectedQuarter: Quarter;
    gradeAndSection?: string;
    title: string;
    content: string;
    fontFamily: string;
    studentNameFontFamily: string;
    fontSize: number;
    titleFontSize: number;
    lineHeight: number;
    backgroundStyle: string;
    verticalPadding: number;
    wordSpacing: number;
    showSchoolLogo: boolean;
    showSecondLogo: boolean;
    showAdviser: boolean;
    showCoordinator: boolean;
    showPrincipal: boolean;
    teacherDesignationType: 'custom' | 'classAdviser' | 'subjectTeacher';
    customTeacherDesignation: string;
    emailSubject: string;
    emailBody: string;
}

export interface HonorsCertificateSettings {
    title: string;
    content: string;
    fontFamily: string;
    studentNameFontFamily: string;
    fontSize: number;
    titleFontSize: number;
    lineHeight: number;
    backgroundStyle: string;
    verticalPadding: number;
    gradeAndSection?: string;
    showSchoolLogo: boolean;
    showSecondLogo: boolean;
    showAdviser: boolean;
    showCoordinator: boolean;
    showPrincipal: boolean;
    teacherDesignationType: 'classAdviser' | 'custom' | 'subjectTeacher';
    customTeacherDesignation: string;
    emailSubject: string;
    emailBody: string;
}

export interface AttendanceCertificateSettings {
    title: string;
    content: string;
    fontFamily: string;
    fontSize: number;
    titleFontSize: number;
    lineHeight: number;
    backgroundStyle: string;
    verticalPadding: number;
    wordSpacing: number;
    showSchoolLogo: boolean;
    showSecondLogo: boolean;
    showAdviser: boolean;
    showCoordinator: boolean;
    showPrincipal: boolean;
    teacherDesignationType: 'classAdviser' | 'custom' | 'subjectTeacher';
    customTeacherDesignation: string;
    emailSubject: string;
    emailBody: string;
}

export interface UiState {
    roster: {
        selectedBatchId: string;
    };
    grades: {
        selectedBatchId: string;
        selectedSubject: string;
        selectedQuarter: Quarter;
        view: 'record' | 'summary' | 'honors' | 'analysis';
    };
    forms: {
        selectedForm: string | null;
        selectedBatchId: string;
    };
    honorsCalculator: {
        selectedBatchId: string;
    };
    isResourcesUnlocked: boolean;
    isSidebarCollapsed: boolean;
}

export interface HonorsCalculationData {
    id: string;
    batchId: string;
    subjects: string[];
    studentGrades: {
        [studentId: string]: {
            [subject: string]: (number | null)[]; // Array of 4 quarters
        };
    };
}

export interface AIAnalysisResult {
    studentName: string;
    trendSummary: string;
    recommendation: string;
}

export interface ExtractedGrade {
    studentName: string;
    score: number;
    maxScore: number;
}

export interface ExtractedStudentData {
    grades: ExtractedGrade[];
}

export interface DlpRubricItem {
    criteria: string;
    points: number;
}

export interface DlpProcedure {
    title: string;
    content: string; // Will contain all teacher/student activities, instructions, questions, formatted as a string
    ppst: string;
}

export interface DlpContent {
    contentStandard: string;
    performanceStandard: string;
    topic: string;
    learningReferences: string;
    learningMaterials: string;
    procedures: DlpProcedure[];
    evaluationQuestions: { question: string; options: string[]; answer: string }[];
    remarksContent: string;
}


export type QuizType = 'Multiple Choice' | 'True or False' | 'Identification';

export interface GeneratedQuizQuestion {
    questionText: string;
    options?: string[];
    correctAnswer: string;
}

export interface GeneratedQuizSection {
    instructions: string;
    questions: GeneratedQuizQuestion[];
}

export interface TosItem {
    objective: string;
    cognitiveLevel: string;
    itemNumbers: string;
}

export interface GeneratedQuiz {
    quizTitle: string;
    tableOfSpecifications?: TosItem[];
    questionsByType: {
        [key in QuizType]?: GeneratedQuizSection;
    };
    activities: {
        activityName: string;
        activityInstructions: string;
        rubric?: DlpRubricItem[];
    }[];
}


export interface MapehRecordDocxData {
    summaryData: {
        student: Student;
        componentGrades: { [key: string]: number | null };
        finalMapehGrade: number | null;
    }[];
    settings: SchoolSettings;
    quarter: Quarter;
    selectedSectionText: string;
}

export interface SummaryOfGradesData {
    students: {
        males: any[];
        females: any[];
    };
    settings: SchoolSettings;
    subject: string;
    summaryStats: {
        malesPassed: number;
        malesFailed: number;
        femalesPassed: number;
        femalesFailed: number;
    };
    selectedSectionText: string;
}

export interface DllProcedure {
    procedure: string;
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
}

export interface DllObjectives {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
}

export interface DllDailyEntry {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
}

export interface DllLearningResources {
    teacherGuidePages: DllDailyEntry;
    learnerMaterialsPages: DllDailyEntry;
    textbookPages: DllDailyEntry;
    additionalMaterials: DllDailyEntry;
    otherResources: DllDailyEntry;
}

export interface DllContent {
    contentStandard: string;
    performanceStandard: string;
    learningCompetencies: DllObjectives;
    content: string;
    learningResources: DllLearningResources;
    procedures: DllProcedure[];
    remarks: string;
    reflection: DllProcedure[];
}

export interface StudentProfileDocxData {
    student: Student;
    academicSummary: { subject: string; grades: (number | null)[] }[];
    attendanceSummary: { month: string; absences: number; lates: number };
    recentAnecdotes: { date: string; observation: string }[];
    settings: SchoolSettings;
}

export interface LasConceptNotes {
    title: string;
    content: string; // Markdown supported content
}

export interface LasQuestion {
    questionText: string;
    type: 'Identification' | 'Essay' | 'Problem-solving' | 'Multiple Choice';
    options?: string[];
    answer?: string;
}

export interface LasActivity {
    title: string;
    instructions: string;
    questions?: LasQuestion[];
    rubric?: DlpRubricItem[];
}

export interface LearningActivitySheet {
    activityTitle: string;
    learningTarget: string;
    references: string;
    conceptNotes: LasConceptNotes[];
    activities: LasActivity[];
}