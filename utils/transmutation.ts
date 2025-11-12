import { StudentQuarterlyRecord, SubjectQuarterSettings } from '../types';

const TRANSMUTATION_TABLE: {min: number, max: number, grade: number}[] = [
    { min: 100, max: 100, grade: 100 },
    { min: 98.40, max: 99.99, grade: 99 },
    { min: 96.80, max: 98.39, grade: 98 },
    { min: 95.20, max: 96.79, grade: 97 },
    { min: 93.60, max: 95.19, grade: 96 },
    { min: 92.00, max: 93.59, grade: 95 },
    { min: 90.40, max: 91.99, grade: 94 },
    { min: 88.80, max: 90.39, grade: 93 },
    { min: 87.20, max: 88.79, grade: 92 },
    { min: 85.60, max: 87.19, grade: 91 },
    { min: 84.00, max: 85.59, grade: 90 },
    { min: 82.40, max: 83.99, grade: 89 },
    { min: 80.80, max: 82.39, grade: 88 },
    { min: 79.20, max: 80.79, grade: 87 },
    { min: 77.60, max: 79.19, grade: 86 },
    { min: 76.00, max: 77.59, grade: 85 },
    { min: 74.40, max: 75.99, grade: 84 },
    { min: 72.80, max: 74.39, grade: 83 },
    { min: 71.20, max: 72.79, grade: 82 },
    { min: 69.60, max: 71.19, grade: 81 },
    { min: 68.00, max: 69.59, grade: 80 },
    { min: 66.40, max: 67.99, grade: 79 },
    { min: 64.80, max: 66.39, grade: 78 },
    { min: 63.20, max: 64.79, grade: 77 },
    { min: 61.60, max: 63.19, grade: 76 },
    { min: 60.00, max: 61.59, grade: 75 },
    { min: 56.00, max: 59.99, grade: 74 },
    { min: 52.00, max: 55.99, grade: 73 },
    { min: 48.00, max: 51.99, grade: 72 },
    { min: 44.00, max: 47.99, grade: 71 },
    { min: 40.00, max: 43.99, grade: 70 },
    { min: 36.00, max: 39.99, grade: 69 },
    { min: 32.00, max: 35.99, grade: 68 },
    { min: 28.00, max: 31.99, grade: 67 },
    { min: 24.00, max: 27.99, grade: 66 },
    { min: 20.00, max: 23.99, grade: 65 },
    { min: 16.00, max: 19.99, grade: 64 },
    { min: 12.00, max: 15.99, grade: 63 },
    { min: 8.00, max: 11.99, grade: 62 },
    { min: 4.00, max: 7.99, grade: 61 },
    { min: 0, max: 3.99, grade: 60 },
];

export const transmuteGrade = (initialGrade: number): number => {
    if (initialGrade < 0) return 60;
    const found = TRANSMUTATION_TABLE.find(row => initialGrade >= row.min && initialGrade <= row.max);
    return found ? found.grade : 60;
};

export const getSubjectWeightDefaults = (subject: string): { ww: number, pt: number, qa: number } => {
    const s = subject.toLowerCase().trim();

    const isMapehTle = ['mapeh', 'music', 'arts', 'pe', 'health', 'epp', 'tle', 'technology and livelihood education', 'edukasyong pantahanan at pangkabuhayan'].some(term => s.includes(term));
    if (isMapehTle) {
        return { ww: 0.20, pt: 0.60, qa: 0.20 };
    }

    const isScienceMath = ['math', 'mathematics', 'science'].some(term => s.includes(term));
    if (isScienceMath) {
        return { ww: 0.40, pt: 0.40, qa: 0.20 };
    }

    // Default for Languages, AP (Araling Panlipunan), EsP (Edukasyon sa Pagpapakatao), Filipino, English
    return { ww: 0.30, pt: 0.50, qa: 0.20 };
};


export const calculateInitialGrade = (record: StudentQuarterlyRecord, settings: SubjectQuarterSettings) => {
    const wwWeight = settings.wwPercentage ?? 0.30;
    const ptWeight = settings.ptPercentage ?? 0.50;
    const qaWeight = settings.qaPercentage ?? 0.20;
    
    // Written Works
    const wwScores = record.writtenWorks.filter(s => s !== null) as number[];
    const wwMaxScoresTotal = settings.writtenWorksMax.reduce((acc, max, i) => {
        // Only include max score if student has a score for that item
        return record.writtenWorks[i] !== null ? acc + (max || 0) : acc;
    }, 0);
    const wwTotal = wwScores.reduce((a, b) => a + b, 0);
    const wwPs = wwMaxScoresTotal > 0 ? (wwTotal / wwMaxScoresTotal) * 100 : 0;
    const wwWs = wwPs * wwWeight;

    // Performance Tasks
    const ptScores = record.performanceTasks.filter(s => s !== null) as number[];
    const ptMaxScoresTotal = settings.performanceTasksMax.reduce((acc, max, i) => {
        return record.performanceTasks[i] !== null ? acc + (max || 0) : acc;
    }, 0);
    const ptTotal = ptScores.reduce((a, b) => a + b, 0);
    const ptPs = ptMaxScoresTotal > 0 ? (ptTotal / ptMaxScoresTotal) * 100 : 0;
    const ptWs = ptPs * ptWeight;

    // Quarterly Assessment
    const qaScore = record.quarterlyAssessment;
    const qaMaxScore = settings.quarterlyAssessmentMax;
    const qaPs = (qaScore !== null && qaMaxScore !== null && qaMaxScore > 0) ? (qaScore / qaMaxScore) * 100 : 0;
    const qaWs = qaPs * qaWeight;

    const hasGrades = wwTotal > 0 || ptTotal > 0 || qaScore !== null;
    const initialGrade = hasGrades ? wwWs + ptWs + qaWs : null;

    return {
        wwTotal, wwPs, wwWs,
        ptTotal, ptPs, ptWs,
        qaPs, qaWs,
        initialGrade
    };
};

export const getHonorStatus = (grade: number | null): string => {
    if (grade === null) return '';
    const roundedGrade = Math.round(grade);
    if (roundedGrade >= 98) return 'With Highest Honors';
    if (roundedGrade >= 95) return 'With High Honors';
    if (roundedGrade >= 90) return 'With Honors';
    return '';
};

export const getRemark = (grade: number | null): string => {
    if (grade === null) return '';
    const roundedGrade = Math.round(grade);
    return roundedGrade >= 75 ? 'PASSED' : 'FAILED';
};
