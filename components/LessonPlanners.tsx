import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '../contexts/AppContext';
import { generateDlpContent, generateQuizContent, generateRubricForActivity, generateDllContent, generateLearningActivitySheet } from '../services/geminiService';
import { DlpContent, GeneratedQuiz, QuizType, DlpRubricItem, GeneratedQuizSection, DllContent, DlpProcedure, LearningActivitySheet, SchoolSettings } from '../types';
import Header from './Header';
import { SparklesIcon, DownloadIcon, ClipboardCheckIcon } from './icons';
import { docxService } from '../services/docxService';

const TabButton: React.FC<{ label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }> = ({ label, icon, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${isActive ? 'border-primary text-primary' : 'border-transparent text-base-content/70 hover:text-base-content'}`}>
        {icon} {label}
    </button>
);

const InputField: React.FC<{ id: string, label: string, value: string, onChange: any, type?: string, required?: boolean, placeholder?: string }> = ({ id, label, value, onChange, type = 'text', required = false, placeholder='' }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-base-content mb-1">{label}{required && <span className="text-error">*</span>}</label>
        <input type={type} id={id} value={value} onChange={onChange} required={required} placeholder={placeholder} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10 text-base-content" />
    </div>
);

const TextAreaField: React.FC<{ id: string, label: string, value: string, onChange: any, rows?: number, required?: boolean, placeholder?: string }> = ({ id, label, value, onChange, rows = 3, required = false, placeholder='' }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-base-content mb-1">{label}{required && <span className="text-error">*</span>}</label>
        <textarea id={id} value={value} onChange={onChange} rows={rows} required={required} placeholder={placeholder} className="w-full bg-base-100 border border-base-300 rounded-md p-2 text-base-content" />
    </div>
);

const gradeLevels = ['Kindergarten', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const jhsGradeLevels = ['7', '8', '9', '10'];

const subjectAreas = {
  "Elementary (K-6)": ["Kindergarten (Domains)", "Mother Tongue", "Filipino", "English", "Mathematics", "Science", "Araling Panlipunan (AP)", "Edukasyon sa Pagpapakatao (EsP)", "Music", "Arts", "Physical Education (PE)", "Health", "Edukasyong Pantahanan at Pangkabuhayan (EPP)", "Technology and Livelihood Education (TLE)"],
  "Junior High School (Grades 7-10)": ["Filipino", "English", "Mathematics", "Science", "Araling Panlipunan (AP)", "Edukasyon sa Pagpapakatao (EsP)", "Technology and Livelihood Education (TLE)", "Music", "Arts", "Physical Education (PE)", "Health"],
  "Senior High School - Core (Grades 11-12)": ["21st Century Literature from the Philippines and the World", "Contemporary Philippine Arts from the Regions", "Earth and Life Science", "General Mathematics", "Introduction to the Philosophy of the Human Person", "Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino", "Media and Information Literacy", "Oral Communication in Context", "Pagbasa at Pagsusuri ng Iba't Ibang Teksto Tungo sa Pananaliksik", "Personal Development", "Physical Education and Health", "Physical Science", "Reading and Writing Skills", "Statistics and Probability", "Understanding Culture, Society and Politics"],
  "Senior High School - Applied (Grades 11-12)": ["Empowerment Technologies", "English for Academic and Professional Purposes", "Entrepreneurship", "Filipino sa Piling Larang", "Practical Research 1", "Practical Research 2"]
};

type ActiveTab = 'dlp' | 'dll' | 'quiz' | 'las';

const LessonPlanners: React.FC = () => {
    const { settings } = useAppContext();
    const [activeTab, setActiveTab] = useState<ActiveTab>('dlp');
    const [isLoading, setIsLoading] = useState(false);
    
    // DLP State
    const [teacherPosition, setTeacherPosition] = useState<'Beginning' | 'Proficient' | 'Highly Proficient' | 'Distinguished'>('Beginning');
    const [dlpForm, setDlpForm] = useState({
        teacher: settings.teacherName || '',
        schoolName: settings.schoolName || '',
        subject: 'English',
        teachingDates: '',
        classSchedule: '',
        gradeLevel: '9',
        quarterSelect: '1ST QUARTER',
        learningCompetency: '',
        lessonObjective: '',
        previousLesson: '',
        preparedByName: settings.teacherName.toUpperCase() || '',
        preparedByDesignation: 'Secondary School Teacher I, Grade 9\nENGLISH Teacher',
        checkedByName: (settings.checkedBy || '').toUpperCase(),
        checkedByDesignation: settings.checkerDesignation || 'Learning Area Coordinator',
        approvedByName: (settings.principalName || '').toUpperCase(),
        approvedByDesignation: settings.principalDesignation || 'School Principal II',
        language: 'English',
        dlpFormat: 'Standard DepEd',
    });
    const [dlpContent, setDlpContent] = useState<DlpContent | null>(null);

    // Quiz State
    const [quizForm, setQuizForm] = useState({
        quizTopic: '',
        numQuestions: 10,
        quizTypes: ['Multiple Choice'] as QuizType[],
        subject: 'English',
        gradeLevel: '9',
    });
    const [quizContent, setQuizContent] = useState<GeneratedQuiz | null>(null);
    const [activityPoints, setActivityPoints] = useState<{ [index: number]: string }>({});
    const [generatingRubricIndex, setGeneratingRubricIndex] = useState<number | null>(null);

    // DLL State
    const [dllFormat, setDllFormat] = useState('Standard');
    const [dllForm, setDllForm] = useState({
        subject: 'English',
        gradeLevel: '10',
        weeklyTopic: '',
        contentStandard: '',
        performanceStandard: '',
        teachingDates: '',
        quarter: '3',
        preparedByName: settings.teacherName.toUpperCase() || '',
        preparedByDesignation: 'Teacher',
        checkedByName: (settings.checkedBy || '').toUpperCase(),
        checkedByDesignation: settings.checkerDesignation || 'Learning Area Coordinator',
        approvedByName: (settings.principalName || '').toUpperCase(),
        approvedByDesignation: settings.principalDesignation || 'School Principal II',
        language: 'English',
    });
    const [dllContent, setDllContent] = useState<DllContent | null>(null);

    // LAS State
    const [lasForm, setLasForm] = useState({
        subject: 'Filipino',
        gradeLevel: '7',
        learningCompetency: '',
        lessonObjective: '',
        activityType: 'Guided Practice',
        language: 'Filipino',
    });
    const [lasContent, setLasContent] = useState<LearningActivitySheet | null>(null);


    // Persist form state to localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('lessonPlannersState');
        if (savedState) {
            const { dlpForm: savedDlp, dllForm: savedDll, quizForm: savedQuiz, lasForm: savedLas, activeTab: savedTab, dlpContent: savedDlpContent, dllContent: savedDllContent, quizContent: savedQuizContent, lasContent: savedLasContent, teacherPosition: savedTeacherPosition, dllFormat: savedDllFormat } = JSON.parse(savedState);
            if (savedDlp) setDlpForm(prev => ({...prev, ...savedDlp}));
            if (savedDll) setDllForm(prev => ({...prev, ...savedDll}));
            if (savedQuiz) setQuizForm(prev => ({...prev, ...savedQuiz}));
            if (savedLas) setLasForm(prev => ({...prev, ...savedLas}));
            if (savedTab) setActiveTab(savedTab);
            if (savedDlpContent) setDlpContent(savedDlpContent);
            if (savedDllContent) setDllContent(savedDllContent);
            if (savedQuizContent) setQuizContent(savedQuizContent);
            if (savedLasContent) setLasContent(savedLasContent);
            if (savedTeacherPosition) setTeacherPosition(savedTeacherPosition);
            if (savedDllFormat) setDllFormat(savedDllFormat);
        }
    }, []);

    useEffect(() => {
        const stateToSave = { dlpForm, dllForm, quizForm, lasForm, activeTab, dlpContent, dllContent, quizContent, lasContent, teacherPosition, dllFormat };
        localStorage.setItem('lessonPlannersState', JSON.stringify(stateToSave));
    }, [dlpForm, dllForm, quizForm, lasForm, activeTab, dlpContent, dllContent, quizContent, lasContent, teacherPosition, dllFormat]);


    useEffect(() => {
        setDlpForm(prev => ({
            ...prev,
            teacher: settings.teacherName,
            schoolName: settings.schoolName,
            preparedByName: settings.teacherName.toUpperCase(),
            checkedByName: (settings.checkedBy || '').toUpperCase(),
            checkedByDesignation: settings.checkerDesignation || 'Learning Area Coordinator',
            approvedByName: (settings.principalName || '').toUpperCase(),
            approvedByDesignation: settings.principalDesignation || 'School Principal II',
        }));
        setDllForm(prev => ({
            ...prev,
            preparedByName: settings.teacherName.toUpperCase(),
            checkedByName: (settings.checkedBy || '').toUpperCase(),
            checkedByDesignation: settings.checkerDesignation || 'Learning Area Coordinator',
            approvedByName: (settings.principalName || '').toUpperCase(),
            approvedByDesignation: settings.principalDesignation || 'School Principal II',
        }));
    }, [settings]);

    const handleDlpFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setDlpForm(prev => ({ ...prev, [id]: value }));
        if (id === 'teacher') {
            setDlpForm(prev => ({ ...prev, preparedByName: value.toUpperCase() }));
        }
    };
    
    const handleDllFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setDllForm(prev => ({...prev, [id]: value}));
    };

    const handleLasFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setLasForm(prev => ({ ...prev, [id]: value }));
    };

    const handleQuizFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setQuizForm(prev => ({
            ...prev,
            [id]: id === 'numQuestions' ? Number(value) : value,
        }));
    };

    const handleQuizTypeChange = (quizType: QuizType) => {
        setQuizForm(prev => {
            const newQuizTypes = prev.quizTypes.includes(quizType)
                ? prev.quizTypes.filter(t => t !== quizType)
                : [...prev.quizTypes, quizType];
            return { ...prev, quizTypes: newQuizTypes };
        });
    };

    const handleActivityPointsChange = (index: number, value: string) => {
        setActivityPoints(prev => ({ ...prev, [index]: value }));
    };

    const handleGenerateRubric = async (activityIndex: number) => {
        if (!quizContent?.activities[activityIndex]) return;

        const points = parseInt(activityPoints[activityIndex] || '0', 10);
        if (isNaN(points) || points <= 0) {
            toast.error("Please enter a valid number of points.");
            return;
        }

        setGeneratingRubricIndex(activityIndex);
        const toastId = toast.loading(`Generating rubric for activity ${activityIndex + 1}...`);
        try {
            const activity = quizContent.activities[activityIndex];
            const newRubric = await generateRubricForActivity({
                activityName: activity.activityName,
                activityInstructions: activity.activityInstructions,
                totalPoints: points,
            });
            
            setQuizContent(prev => {
                if (!prev) return null;
                const newActivities = [...prev.activities];
                newActivities[activityIndex] = { ...newActivities[activityIndex], rubric: newRubric };
                return { ...prev, activities: newActivities };
            });

            toast.success("Rubric generated successfully!", { id: toastId });

        } catch(error) {
            let message = "An unknown error occurred.";
            if (error instanceof Error) message = error.message;
            toast.error(message, { id: toastId });
        } finally {
            setGeneratingRubricIndex(null);
        }
    };

    const generateDLP = async () => {
        const requiredFields: (keyof typeof dlpForm)[] = ['teacher', 'schoolName', 'subject', 'teachingDates', 'classSchedule', 'gradeLevel', 'learningCompetency', 'lessonObjective', 'previousLesson'];
        if (requiredFields.some(field => !dlpForm[field as keyof typeof dlpForm].trim())) {
            toast.error('Please fill in all required DLP fields.');
            return;
        }
        setIsLoading(true);
        setDlpContent(null);
        const toastId = toast.loading('Generating Daily Lesson Plan...', {
            style: { background: 'var(--info)', color: 'white' },
            iconTheme: { primary: 'white', secondary: 'var(--info)' },
        });
        try {
            const content = await generateDlpContent({
                gradeLevel: dlpForm.gradeLevel,
                learningCompetency: dlpForm.learningCompetency,
                lessonObjective: dlpForm.lessonObjective,
                previousLesson: dlpForm.previousLesson,
                selectedQuarter: dlpForm.quarterSelect,
                subject: dlpForm.subject,
                teacherPosition,
                language: dlpForm.language as 'English' | 'Filipino',
                dlpFormat: dlpForm.dlpFormat,
            });
            setDlpContent(content);
            toast.success('DLP generated successfully!', { id: toastId });
        } catch (error) {
            let message = "An unknown error occurred.";
            if (error instanceof Error) message = error.message;
            toast.error(message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };
    
    const generateDLL = async () => {
        if (!dllForm.subject || !dllForm.gradeLevel) {
            toast.error('Please provide a Subject and Grade Level.');
            return;
        }
        setIsLoading(true);
        setDllContent(null);
        const toastId = toast.loading('Generating Weekly Plan...');
        try {
            const content = await generateDllContent({
                ...dllForm,
                language: dllForm.language as 'English' | 'Filipino',
                dllFormat: dllFormat,
            });
            setDllContent(content);
            toast.success('Weekly Plan generated successfully!', { id: toastId });
        } catch (error) {
            let message = "An unknown error occurred.";
            if (error instanceof Error) message = error.message;
            toast.error(message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const generateLAS = async () => {
        if (!lasForm.subject.trim() || !lasForm.learningCompetency.trim() || !lasForm.lessonObjective.trim()) {
            toast.error("Please fill in the Subject, Learning Competency, and Lesson Objective.");
            return;
        }
        setIsLoading(true);
        setLasContent(null);
        const toastId = toast.loading('Generating Learning Activity Sheet...');
        try {
            const content = await generateLearningActivitySheet({
                ...lasForm,
                language: lasForm.language as 'English' | 'Filipino',
            });
            setLasContent(content);
            toast.success('Learning Sheet generated successfully!', { id: toastId });
        } catch (error) {
            let message = "An unknown error occurred.";
            if (error instanceof Error) message = error.message;
            toast.error(message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const generateQuiz = async () => {
        if (!quizForm.quizTopic.trim() || quizForm.quizTypes.length === 0) {
            toast.error('Please provide a topic and select at least one quiz format.');
            return;
        }
        setIsLoading(true);
        setQuizContent(null);
        const toastId = toast.loading('Generating Quiz & Activities...', {
             style: { background: 'var(--info)', color: 'white' },
            iconTheme: { primary: 'white', secondary: 'var(--info)' },
        });
        try {
            const content = await generateQuizContent({
                topic: quizForm.quizTopic,
                numQuestions: quizForm.numQuestions,
                quizTypes: quizForm.quizTypes,
                subject: quizForm.subject,
                gradeLevel: quizForm.gradeLevel,
            });
            setQuizContent(content);
            toast.success('Quiz generated successfully!', { id: toastId });
        } catch (error) {
            let message = "An unknown error occurred.";
            if (error instanceof Error) message = error.message;
            toast.error(message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownloadDlpDocx = async () => {
        if (!dlpContent) {
            toast.error("No DLP content to download.");
            return;
        }
        setIsLoading(true);
        const toastId = toast.loading('Generating Word document...');
        try {
            await docxService.generateDlpDocx(dlpForm, dlpContent, "", settings);
            toast.success('DLP downloaded successfully!', { id: toastId });
        } catch (error) {
             let message = "An unknown error occurred.";
            if (error instanceof Error) message = error.message;
            toast.error(message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadDllDocx = async () => {
        if (!dllContent) {
            toast.error("No Weekly Plan content to download.");
            return;
        }
        setIsLoading(true);
        const toastId = toast.loading('Generating Word document...');
        try {
            const dllExportData = {
                ...dllForm, // Pass all form fields including signatories
                teacher: settings.teacherName,
                schoolName: settings.schoolName,
            };
            await docxService.generateDllDocx(dllExportData, dllContent, settings);
            toast.success('Weekly Plan downloaded successfully!', { id: toastId });
        } catch (error) {
            let message = "An unknown error occurred.";
            if (error instanceof Error) message = error.message;
            toast.error(message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

     const handleDownloadLasDocx = async () => {
        if (!lasContent) {
            toast.error("No Learning Sheet content to download.");
            return;
        }
        setIsLoading(true);
        const toastId = toast.loading('Generating Word document...');
        try {
            await docxService.generateLasDocx({
                schoolYear: settings.schoolYear,
                ...lasForm
            }, lasContent, settings);
            toast.success('Learning Sheet downloaded successfully!', { id: toastId });
        } catch (error) {
            let message = "An unknown error occurred.";
            if (error instanceof Error) message = error.message;
            toast.error(message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadQuizDocx = async () => {
        if (!quizContent) {
            toast.error("No quiz content to download.");
            return;
        }
        setIsLoading(true);
        const toastId = toast.loading('Generating Word document...');
        try {
            await docxService.generateQuizDocx(quizContent);
            toast.success('Quiz downloaded successfully!', { id: toastId });
        } catch (error) {
            let message = "An unknown error occurred.";
            if (error instanceof Error) message = error.message;
            toast.error(message, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const dlpOutputHtml = useMemo(() => {
        if (!dlpContent) return { mainContent: '', answerKeyHtml: '', reflectionTableHtml: ''};

        const isFilipino = dlpForm.language === 'Filipino';
        const t = {
            objectives: isFilipino ? 'I. LAYUNIN' : 'I. OBJECTIVES',
            contentStandard: isFilipino ? 'Pamantayang Pangnilalaman:' : 'Content Standard:',
            performanceStandard: isFilipino ? 'Pamantayan sa Pagganap:' : 'Performance Standard:',
            learningCompetency: isFilipino ? 'Kasanayan sa Pagkatuto:' : 'Learning Competency:',
            atTheEnd: isFilipino ? 'Sa pagtatapos ng aralin, ang mga mag-aaral ay inaasahang:' : 'At the end of the lesson, the learners should be able to:',
            content: isFilipino ? 'II. NILALAMAN' : 'II. CONTENT',
            topic: isFilipino ? 'Paksa:' : 'Topic:',
            resources: isFilipino ? 'III. KAGAMITANG PANTURO' : 'III. LEARNING RESOURCES',
            references: isFilipino ? 'Sanggunian:' : 'References:',
            materials: isFilipino ? 'Kagamitan:' : 'Materials:',
            procedure: isFilipino ? 'IV. PAMAMARAAN' : 'IV. PROCEDURE',
            remarks: isFilipino ? 'V. MGA TALA' : 'V. REMARKS',
            reflection: isFilipino ? 'VI. PAGNINILAY' : 'VI. REFLECTION',
        };

        const tableStyle = 'width: 100%; border-collapse: collapse; table-layout: fixed;';
        const cellStyle = 'padding: 8px; border: 1px solid var(--base-300); vertical-align: top; text-align: left;';
        const headerCellStyle = `${cellStyle} font-weight: bold; width: 25%;`;
        const contentCellStyle = `${cellStyle} width: 45%;`;
        const ppstCellStyle = `${cellStyle} width: 30%; font-style: italic; font-size: 0.9em; color: var(--primary);`;
        
        const scheduleHtml = dlpForm.classSchedule.split('\n').map(line => `<span>${line}</span>`).join('<br>');
        
        const mainContent = `
            <div class="font-serif text-sm">
                <table style="${tableStyle}">
                     <tr><td style="${cellStyle}; width: 15%; vertical-align: middle; text-align: center;" rowspan="5">${settings.schoolLogo ? `<img src="${settings.schoolLogo}" alt="logo" style="width: 60px; height: 60px; margin: auto;"/>` : ''}</td><td style="${cellStyle}; width: 55%;"><strong>${isFilipino ? 'Paaralan' : 'School'}:</strong> ${dlpForm.schoolName.toUpperCase()}</td><td style="${cellStyle}; width: 30%; text-align: center; vertical-align: middle;" rowspan="2"><strong>${isFilipino ? 'DETALYADONG BANGHAY-ARALIN SA' : 'DAILY LESSON PLAN IN'}<br/>${dlpForm.subject.toUpperCase()} ${dlpForm.gradeLevel}</strong></td></tr>
                    <tr><td style="${cellStyle}"><strong>${dlpForm.quarterSelect}</strong></td></tr>
                    <tr><td style="${cellStyle}"><strong>${isFilipino ? 'Guro' : 'Teacher'}:</strong> ${dlpForm.teacher}</td><td style="${cellStyle}" rowspan="3"><strong>${isFilipino ? 'ISKEDYUL NG KLASE' : 'CLASS SCHEDULE'}</strong><br/>${scheduleHtml}</td></tr>
                    <tr><td style="${cellStyle}"><strong>${isFilipino ? 'Asignatura' : 'Learning Area'}:</strong> ${dlpForm.subject.toUpperCase()}</td></tr>
                    <tr><td style="${cellStyle}"><strong>${isFilipino ? 'Petsa ng Pagtuturo' : 'Teaching Dates'}:</strong> ${dlpForm.teachingDates}</td></tr>
                </table>
                <h3 class="text-lg font-bold mt-4 mb-2 bg-base-300/30 p-1">${t.objectives}</h3>
                <table style="${tableStyle}">
                    <tr><td style="${headerCellStyle}">${t.contentStandard}</td><td style="${cellStyle}" colspan="2">${dlpContent.contentStandard}</td></tr>
                    <tr><td style="${headerCellStyle}">${t.performanceStandard}</td><td style="${cellStyle}" colspan="2">${dlpContent.performanceStandard}</td></tr>
                    <tr><td style="${headerCellStyle}">${t.learningCompetency}</td><td style="${cellStyle}" colspan="2">${dlpForm.learningCompetency}</td></tr>
                    <tr><td style="${cellStyle}" colspan="3">${t.atTheEnd}</td></tr>
                    <tr><td style="${cellStyle}" colspan="3"><ul class="list-disc ml-8"><li>${dlpForm.lessonObjective}</li></ul></td></tr>
                </table>
                <h3 class="text-lg font-bold mt-4 mb-2 bg-base-300/30 p-1">${t.content}</h3>
                <table style="${tableStyle}"><tr><td style="${headerCellStyle}">${t.topic}</td><td style="${cellStyle}" colspan="2">${dlpContent.topic}</td></tr></table>
                <h3 class="text-lg font-bold mt-4 mb-2 bg-base-300/30 p-1">${t.resources}</h3>
                <table style="${tableStyle}">
                    <tr><td style="${headerCellStyle}">${t.references}</td><td style="${cellStyle}" colspan="2">${dlpContent.learningReferences}</td></tr>
                    <tr><td style="${headerCellStyle}">${t.materials}</td><td style="${cellStyle}" colspan="2">${dlpContent.learningMaterials}</td></tr>
                </table>
                <h3 class="text-lg font-bold mt-4 mb-2 bg-base-300/30 p-1">${t.procedure}</h3>
                <table style="${tableStyle}">
                    <thead><tr><th style="${headerCellStyle}">${isFilipino ? 'Pamamaraan' : 'Procedure'}</th><th style="${contentCellStyle}">${isFilipino ? 'Gawain ng Guro/Mag-aaral' : 'Teacher/Student Activity'}</th><th style="${ppstCellStyle}">${isFilipino ? 'Mga Kaugnay na PPST Indicator' : 'Aligned PPST Indicators'}</th></tr></thead>
                    <tbody>
                        ${dlpContent.procedures.map(proc => `
                            <tr>
                                <td style="${headerCellStyle}">${proc.title}</td>
                                <td style="${contentCellStyle}">${proc.content.replace(/\n/g, '<br/>')}</td>
                                <td style="${ppstCellStyle}">${proc.ppst}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
        `;
        const sectionsForReflection = (dlpForm.classSchedule || '').split('\n').map(line => {
            const parts = line.match(/([Gg]?\d+\s*-\s*[\w\s]+|[\w\s]+)/);
            return parts ? parts[0].trim().replace(/,/g, '') : line.trim();
        }).filter(Boolean);

        const reflectionTableHtml = `
            <h3 class="text-lg font-bold mt-4 mb-2 bg-base-300/30 p-1">${t.remarks}</h3>
            <div style="border: 1px solid var(--base-300); padding: 8px; min-height: 80px;">
                <p style="border-bottom: 1px solid var(--base-300); height: 24px;">${dlpContent.remarksContent || ''}</p>
            </div>
            <h3 class="text-lg font-bold mt-4 mb-2 bg-base-300/30 p-1">${t.reflection}</h3>
            <table style="${tableStyle.replace('table-layout: fixed;', '')}">
                <tbody>
                    <tr><td style="padding: 8px; border: 1px solid var(--base-300); vertical-align: top; text-align: left; font-weight: bold; width: 40%;">${isFilipino ? 'A. Bilang ng mag-aaral na nakakuha ng 80% sa pagtataya' : 'A. No. of learners who earned 80% in the evaluation'}</td><td style="padding: 8px; border: 1px solid var(--base-300); vertical-align: top; text-align: left; width: 60%;">${sectionsForReflection.length > 0 ? sectionsForReflection.map(sec => `<p>___ out of ___ learners earned 80% and above - ${sec}</p>`).join('') : `<p>___ out of ___ learners earned 80% and above</p>`}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid var(--base-300); vertical-align: top; text-align: left; font-weight: bold; width: 40%;">${isFilipino ? 'B. Bilang ng mag-aaral na nangangailangan ng remediation na nakakuha ng mababa sa 80%' : 'B. No. of learners who require additional activities for remediation who score below 80%'}</td><td style="padding: 8px; border: 1px solid var(--base-300); vertical-align: top; text-align: left; width: 60%;">${sectionsForReflection.length > 0 ? sectionsForReflection.map(sec => `<p>___ out of ___ learners require additional activities - ${sec}</p>`).join('') : `<p>___ out of ___ learners require additional activities</p>`}</td></tr>
                    <tr><td style="padding: 8px; border: 1px solid var(--base-300); vertical-align: top; text-align: left; font-weight: bold; width: 40%;">${isFilipino ? 'C. Nakatulong ba ang remedial? Bilang ng mag-aaral na nakaunawa sa aralin.' : 'C. Did the remedial lessons work? No. of learners who have caught up with the lessons.'}</td><td style="padding: 8px; border: 1px solid var(--base-300); vertical-align: top; text-align: left; width: 60%;"><p><span>☐</span> ${isFilipino ? 'Oo' : 'YES'} <span>☐</span> ${isFilipino ? 'Hindi' : 'NO'}</p><p><span>☐</span> ___ ${isFilipino ? 'na mag-aaral ang nakaunawa sa aralin' : 'learners caught up with the lesson'}</p></td></tr>
                    <tr><td style="padding: 8px; border: 1px solid var(--base-300); vertical-align: top; text-align: left; font-weight: bold; width: 40%;">${isFilipino ? 'D. Bilang ng mga mag-aaral na magpapatuloy sa remediation.' : 'D. No. of learners who continue to require remediation'}</td><td style="padding: 8px; border: 1px solid var(--base-300); vertical-align: top; text-align: left; width: 60%;"><p><span>☐</span> ___ ${isFilipino ? 'na mag-aaral ang magpapatuloy sa remediation' : 'learners continue to require remediation'}</p></td></tr>
                    <tr><td style="padding: 8px; border: 1px solid var(--base-300); vertical-align: top; text-align: left; font-weight: bold; width: 40%;">${isFilipino ? 'E. Alin sa mga istratehiyang pagtuturo nakatulong ng lubos? Paano ito nakatulong?' : 'E. Which of my teaching strategies work well? Why did this work?'}</td><td style="padding: 8px; border: 1px solid var(--base-300); vertical-align: top; text-align: left; width: 60%;"><p><span>☐</span> experiment</p><p><span>☐</span> collaborative learning</p><p><span>☐</span> differentiated instruction</p><p><span>☐</span> lecture</p><p><span>☐</span> think-pair-share</p><p><span>☐</span> role play</p><p><span>☐</span> discovery</p><p><span>☐</span> board work</p><p>${isFilipino ? 'Bakit' : 'Why'}? ____________________</p></td></tr>
                    <tr><td style="padding: 8px; border: 1px solid var(--base-300); vertical-align: top; text-align: left; font-weight: bold; width: 40%;">${isFilipino ? 'F. Anong suliranin ang aking naranasan na solusyunan sa tulong ang aking punungguro at superbisor?' : 'F. What difficulties did I encounter which my principal or supervisor can help me solve?'}</td><td style="padding: 8px; border: 1px solid var(--base-300); vertical-align: top; text-align: left; width: 60%;"><p><span>☐</span> bullying among students</p><p><span>☐</span> student's behavior/attitude</p><p><span>☐</span> unavailable technology/equipment (AVR/LCD)</p><p><span>☐</span> internet lab</p><p>${isFilipino ? 'Bakit' : 'Why'}? ____________________</p></td></tr>
                    <tr><td style="padding: 8px; border: 1px solid var(--base-300); vertical-align: top; text-align: left; font-weight: bold; width: 40%;">${isFilipino ? 'G. Anong kagamitang panturo ang aking nadibuho na nais kong ibahagi sa mga kapwa ko guro.' : 'G. What innovation or localized materials did I use / discover which I wish to share with other teachers.'}</td><td style="padding: 8px; border: 1px solid var(--base-300); vertical-align: top; text-align: left; width: 60%;"><p><span>☐</span> localized videos</p><p><span>☐</span> colorful worksheets</p><p><span>☐</span> local jingle composition</p><p>${isFilipino ? 'Bakit' : 'Why'}? ____________________</p></td></tr>
                </tbody>
            </table>
        `;
        const answerKeyHtml = `
            <div class="page-break" style="page-break-before: always;"></div>
            <h3 class="text-lg font-bold mt-4 mb-2">${isFilipino ? 'Susi sa Pagwawasto' : 'Answer Key (For Evaluating Learning)'}</h3>
            <ol class="list-decimal ml-6">
                ${(dlpContent.evaluationQuestions || []).map(q => `<li>${q.answer}</li>`).join('')}
            </ol>
        `;

        return { mainContent: mainContent + '</div>', answerKeyHtml, reflectionTableHtml };

    }, [dlpContent, dlpForm, settings.schoolLogo]);
    
    const { dllHeaders, dllDays } = useMemo(() => {
        const isFilipino = dllForm.language === 'Filipino';
        return {
            dllHeaders: {
                section: isFilipino ? 'Seksyon' : 'Section',
                contentStandard: isFilipino ? 'A. Pamantayang Pangnilalaman' : 'A. Content Standard',
                performanceStandard: isFilipino ? 'B. Pamantayan sa Pagganap' : 'B. Performance Standard',
                learningCompetencies: isFilipino ? 'C. Mga Kasanayan sa Pagkatuto' : 'C. Learning Competencies',
                content: isFilipino ? 'II. NILALAMAN' : 'II. CONTENT',
                resources: isFilipino ? 'III. KAGAMITANG PANTURO' : 'III. LEARNING RESOURCES',
                procedures: isFilipino ? 'IV. PAMAMARAAN' : 'IV. PROCEDURES',
                remarks: isFilipino ? 'V. MGA TALA' : 'V. REMARKS',
                reflection: isFilipino ? 'VI. PAGNINILAY' : 'VI. REFLECTION',
            },
            dllDays: isFilipino ? ['Lunes', 'Martes', 'Miyerkules', 'Huwebes', 'Biyernes'] : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        };
    }, [dllForm.language]);


    return (
        <div className="min-h-screen">
            <Header title="Lesson Planners" />
            <div className="p-4 md:p-8">
                 <div className="flex border-b border-base-300 mb-6">
                    <TabButton label="DLP Generator" icon={<SparklesIcon className="w-4 h-4" />} isActive={activeTab === 'dlp'} onClick={() => setActiveTab('dlp')} />
                    <TabButton label="Weekly Plan Generator" icon={<SparklesIcon className="w-4 h-4" />} isActive={activeTab === 'dll'} onClick={() => setActiveTab('dll')} />
                    <TabButton label="Quiz Generator" icon={<SparklesIcon className="w-4 h-4" />} isActive={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} />
                    <TabButton label="Learning Sheets" icon={<ClipboardCheckIcon className="w-4 h-4" />} isActive={activeTab === 'las'} onClick={() => setActiveTab('las')} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Forms */}
                    <div className="lg:col-span-1 bg-base-200 p-6 rounded-xl shadow-lg self-start">
                        {activeTab === 'dlp' ? (
                             <div className="space-y-4">
                                <h3 className="text-xl font-bold text-base-content mb-4 flex items-center"><SparklesIcon className="w-6 h-6 mr-2 text-primary" />DLP Generator</h3>
                                 <div>
                                    <label htmlFor="language" className="block text-sm font-medium text-base-content mb-1">Language<span className="text-error">*</span></label>
                                    <select id="language" value={dlpForm.language} onChange={handleDlpFormChange} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                        <option value="English">English</option>
                                        <option value="Filipino">Filipino</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="dlpFormat" className="block text-sm font-medium text-base-content mb-1">DLP Format<span className="text-error">*</span></label>
                                    <select id="dlpFormat" value={dlpForm.dlpFormat} onChange={handleDlpFormChange} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                        <option value="Standard DepEd">Standard DepEd Format</option>
                                        <option value="4As">4A's (Activity, Analysis, Abstraction, Application)</option>
                                        <option value="5Es">5E's (Engage, Explore, Explain, Elaborate, Evaluate)</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField id="teacher" label="Teacher" value={dlpForm.teacher} onChange={handleDlpFormChange} required />
                                    <InputField id="schoolName" label="School Name" value={dlpForm.schoolName} onChange={handleDlpFormChange} required />
                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium text-base-content mb-1">Subject<span className="text-error">*</span></label>
                                        <select id="subject" value={dlpForm.subject} onChange={handleDlpFormChange} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                            {Object.entries(subjectAreas).map(([group, subjects]) => (
                                                <optgroup label={group} key={group}>
                                                    {subjects.map(subject => (
                                                        <option key={subject} value={subject}>{subject}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                    <InputField id="teachingDates" label="Teaching Dates" value={dlpForm.teachingDates} onChange={handleDlpFormChange} required placeholder="e.g., August 1, 2025" />
                                    <div><label htmlFor="gradeLevel" className="block text-sm font-medium text-base-content mb-1">Grade Level<span className="text-error">*</span></label>
                                        <select id="gradeLevel" value={dlpForm.gradeLevel} onChange={handleDlpFormChange} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                            {gradeLevels.map(grade => ( <option key={grade} value={grade}>{grade === 'Kindergarten' ? 'Kindergarten' : `Grade ${grade}`}</option> ))}
                                        </select>
                                    </div>
                                    <div><label htmlFor="quarterSelect" className="block text-sm font-medium text-base-content mb-1">Quarter<span className="text-error">*</span></label><select id="quarterSelect" value={dlpForm.quarterSelect} onChange={handleDlpFormChange} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10"><option>1ST QUARTER</option><option>2ND QUARTER</option><option>3RD QUARTER</option><option>4TH QUARTER</option></select></div>
                                </div>
                                 <div>
                                    <label htmlFor="teacherPosition" className="block text-sm font-medium text-base-content mb-1">Teaching Position<span className="text-error">*</span></label>
                                    <select 
                                        id="teacherPosition" 
                                        value={teacherPosition} 
                                        onChange={(e) => setTeacherPosition(e.target.value as any)} 
                                        className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10"
                                    >
                                        <option value="Beginning">Beginning (Teacher I-III)</option>
                                        <option value="Proficient">Proficient (Teacher IV-Teacher VII)</option>
                                        <option value="Highly Proficient">Highly Proficient (Master Teacher I-Master Teacher III)</option>
                                        <option value="Distinguished">Distinguished (Master Teacher IV-Master Teacher V)</option>
                                    </select>
                                </div>
                                <TextAreaField id="classSchedule" label="Class Schedule" value={dlpForm.classSchedule} onChange={handleDlpFormChange} rows={2} required placeholder="e.g., 12:40 - 1:20 PM, G9-Gentleness"/>
                                <TextAreaField id="learningCompetency" label="Learning Competency" value={dlpForm.learningCompetency} onChange={handleDlpFormChange} required placeholder="Paste the learning competency here..." />
                                <TextAreaField id="lessonObjective" label="Lesson Objective" value={dlpForm.lessonObjective} onChange={handleDlpFormChange} required placeholder="e.g., construct if clauses using the structure of Second Conditionals" />
                                <InputField id="previousLesson" label="Previous Lesson Topic" value={dlpForm.previousLesson} onChange={handleDlpFormChange} required />
                                <div className="pt-4 mt-4 border-t border-base-300">
                                    <h4 className="font-semibold text-base-content mb-2">Signatories</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                        <TextAreaField id="preparedByName" label="Prepared By (Name)" value={dlpForm.preparedByName} onChange={handleDlpFormChange} rows={1}/>
                                        <TextAreaField id="preparedByDesignation" label="Prepared By (Designation)" value={dlpForm.preparedByDesignation} onChange={handleDlpFormChange} rows={2}/>
                                        <TextAreaField id="checkedByName" label="Checked By (Name)" value={dlpForm.checkedByName} onChange={handleDlpFormChange} rows={1} placeholder="e.g., JUAN C. DELA CRUZ" />
                                        <TextAreaField id="checkedByDesignation" label="Checked By (Designation)" value={dlpForm.checkedByDesignation} onChange={handleDlpFormChange} rows={2}/>
                                        <TextAreaField id="approvedByName" label="Approved By (Name)" value={dlpForm.approvedByName} onChange={handleDlpFormChange} rows={1} placeholder="e.g., JUANA C. DELA CRUZ" />
                                        <TextAreaField id="approvedByDesignation" label="Approved By (Designation)" value={dlpForm.approvedByDesignation} onChange={handleDlpFormChange} rows={2}/>
                                    </div>
                                </div>
                                <div className="pt-4"><button onClick={generateDLP} disabled={isLoading} className="w-full flex items-center justify-center bg-primary hover:bg-primary-focus text-white font-bold py-3 px-4 rounded-lg"><SparklesIcon className="w-5 h-5 mr-2" />{isLoading ? 'Generating...' : 'Generate Full DLP'}</button></div>
                            </div>
                        ) : activeTab === 'dll' ? (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-base-content mb-4 flex items-center"><SparklesIcon className="w-6 h-6 mr-2 text-primary" />Weekly Plan Generator</h3>
                                <div>
                                    <label htmlFor="language" className="block text-sm font-medium text-base-content mb-1">Language<span className="text-error">*</span></label>
                                    <select id="language" value={dllForm.language} onChange={handleDllFormChange} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                        <option value="English">English</option>
                                        <option value="Filipino">Filipino</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="dllFormat" className="block text-sm font-medium text-base-content mb-1">DLL Format<span className="text-error">*</span></label>
                                    <select id="dllFormat" value={dllFormat} onChange={(e) => setDllFormat(e.target.value)} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                        <option value="Standard">Standard DLL Format</option>
                                        <option value="MATATAG">MATATAG DLL Format</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-base-content mb-1">Subject<span className="text-error">*</span></label>
                                    <select id="subject" value={dllForm.subject} onChange={handleDllFormChange} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                        {Object.entries(subjectAreas).map(([group, subjects]) => (
                                            <optgroup label={group} key={group}>
                                                {subjects.map(subject => (
                                                    <option key={subject} value={subject}>{subject}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="gradeLevel" className="block text-sm font-medium text-base-content mb-1">Grade Level<span className="text-error">*</span></label>
                                    <select id="gradeLevel" value={dllForm.gradeLevel} onChange={handleDllFormChange} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                        {gradeLevels.map(grade => ( <option key={grade} value={grade}>{grade === 'Kindergarten' ? 'Kindergarten' : `Grade ${grade}`}</option> ))}
                                    </select>
                                </div>
                                <InputField id="teachingDates" label="Teaching Dates & Time" value={dllForm.teachingDates} onChange={handleDllFormChange} placeholder="e.g., November 2-4, 2016" />
                                <div>
                                    <label htmlFor="quarter" className="block text-sm font-medium text-base-content mb-1">Quarter</label>
                                    <select id="quarter" value={dllForm.quarter} onChange={handleDllFormChange} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                    </select>
                                </div>
                                <InputField id="weeklyTopic" label="Unit/Weekly Topic (Optional)" value={dllForm.weeklyTopic} onChange={handleDllFormChange} placeholder="AI will suggest if empty" />
                                <TextAreaField id="contentStandard" label="Content Standard (Optional)" value={dllForm.contentStandard} onChange={handleDllFormChange} rows={3} placeholder="Provide a specific standard, or let the AI generate one." />
                                <TextAreaField id="performanceStandard" label="Performance Standard (Optional)" value={dllForm.performanceStandard} onChange={handleDllFormChange} rows={3} placeholder="Provide a specific standard, or let the AI generate one." />
                                 <div className="pt-4 mt-4 border-t border-base-300">
                                    <h4 className="font-semibold text-base-content mb-2">Signatories</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                        <TextAreaField id="preparedByName" label="Prepared By (Name)" value={dllForm.preparedByName} onChange={handleDllFormChange} rows={1}/>
                                        <TextAreaField id="preparedByDesignation" label="Prepared By (Designation)" value={dllForm.preparedByDesignation} onChange={handleDllFormChange} rows={2}/>
                                        <TextAreaField id="checkedByName" label="Checked By (Name)" value={dllForm.checkedByName} onChange={handleDllFormChange} rows={1} placeholder="e.g., JUAN C. DELA CRUZ" />
                                        <TextAreaField id="checkedByDesignation" label="Checked By (Designation)" value={dllForm.checkedByDesignation} onChange={handleDllFormChange} rows={2}/>
                                        <TextAreaField id="approvedByName" label="Approved By (Name)" value={dllForm.approvedByName} onChange={handleDllFormChange} rows={1} placeholder="e.g., JUANA C. DELA CRUZ" />
                                        <TextAreaField id="approvedByDesignation" label="Approved By (Designation)" value={dllForm.approvedByDesignation} onChange={handleDllFormChange} rows={2}/>
                                    </div>
                                </div>
                                <div className="pt-4"><button onClick={generateDLL} disabled={isLoading} className="w-full flex items-center justify-center bg-primary hover:bg-primary-focus text-white font-bold py-3 px-4 rounded-lg"><SparklesIcon className="w-5 h-5 mr-2" />{isLoading ? 'Generating...' : 'Generate Weekly Plan'}</button></div>
                            </div>
                        ) : activeTab === 'las' ? (
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold text-base-content mb-4 flex items-center"><ClipboardCheckIcon className="w-6 h-6 mr-2 text-primary" />DLP-Style Learning Activity Sheet</h3>
                                <div>
                                    <label htmlFor="language" className="block text-sm font-medium text-base-content mb-1">Language<span className="text-error">*</span></label>
                                    <select id="language" value={lasForm.language} onChange={handleLasFormChange} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                        <option value="Filipino">Filipino</option>
                                        <option value="English">English</option>
                                    </select>
                                </div>
                                 <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="gradeLevel" className="block text-sm font-medium text-base-content mb-1">Grade Level<span className="text-error">*</span></label>
                                        <select id="gradeLevel" value={lasForm.gradeLevel} onChange={handleLasFormChange} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                            {jhsGradeLevels.map(grade => ( <option key={grade} value={grade}>{`Grade ${grade}`}</option> ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium text-base-content mb-1">Subject<span className="text-error">*</span></label>
                                        <select id="subject" value={lasForm.subject} onChange={handleLasFormChange} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                            {subjectAreas["Junior High School (Grades 7-10)"].map(subject => (<option key={subject} value={subject}>{subject}</option>))}
                                        </select>
                                    </div>
                                </div>
                                <TextAreaField id="learningCompetency" label="Learning Competency" value={lasForm.learningCompetency} onChange={handleLasFormChange} required placeholder="e.g., Natutukoy at naipaliliwanag ang mensahe ng napanood na trailer o film clip" />
                                <TextAreaField id="lessonObjective" label="Lesson Objective(s)" value={lasForm.lessonObjective} onChange={handleLasFormChange} required placeholder="e.g., Makasulat ng isang maikling pagsusuri ng isang pelikulang Pilipino." />
                                <div>
                                    <label htmlFor="activityType" className="block text-sm font-medium text-base-content mb-1">Activity Focus<span className="text-error">*</span></label>
                                    <select id="activityType" value={lasForm.activityType} onChange={handleLasFormChange} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                        <option>Concept Notes & Examples</option>
                                        <option>Guided Practice</option>
                                        <option>Independent Practice</option>
                                        <option>Performance Task</option>
                                        <option>Enrichment Activity</option>
                                    </select>
                                </div>
                                <div className="pt-4"><button onClick={generateLAS} disabled={isLoading} className="w-full flex items-center justify-center bg-primary hover:bg-primary-focus text-white font-bold py-3 px-4 rounded-lg"><SparklesIcon className="w-5 h-5 mr-2" />{isLoading ? 'Generating...' : 'Generate Learning Sheet'}</button></div>
                            </div>
                        ) : (
                             <form onSubmit={(e) => { e.preventDefault(); generateQuiz(); }} className="space-y-4">
                                <h3 className="text-xl font-bold text-base-content mb-4 flex items-center"><SparklesIcon className="w-6 h-6 mr-2 text-primary" />Quiz Generator</h3>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label htmlFor="subject" className="block text-sm font-medium text-base-content mb-1">Subject</label>
                                        <select id="subject" value={quizForm.subject} onChange={handleQuizFormChange} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                            {Object.entries(subjectAreas).map(([group, subjects]) => (
                                                <optgroup label={group} key={group}>
                                                    {subjects.map(subject => (
                                                        <option key={subject} value={subject}>{subject}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="gradeLevel" className="block text-sm font-medium text-base-content mb-1">Grade Level</label>
                                        <select id="gradeLevel" value={quizForm.gradeLevel} onChange={handleQuizFormChange} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                             {gradeLevels.map(grade => ( <option key={grade} value={grade}>{grade === 'Kindergarten' ? 'Kindergarten' : `Grade ${grade}`}</option> ))}
                                        </select>
                                    </div>
                                </div>
                                <TextAreaField id="quizTopic" label="Topic" value={quizForm.quizTopic} onChange={handleQuizFormChange} placeholder="e.g., Active and Passive Voice" />
                                <div><label className="block text-sm font-medium text-base-content mb-1">Quiz Formats</label><div className="flex flex-wrap gap-4 mt-2">{(['Multiple Choice', 'True or False', 'Identification'] as QuizType[]).map(type => (<label key={type} className="flex items-center gap-2"><input type="checkbox" checked={quizForm.quizTypes.includes(type)} onChange={() => handleQuizTypeChange(type)} className="checkbox checkbox-primary" />{type}</label>))}</div></div>
                                <div><label htmlFor="numQuestions" className="block text-sm font-medium text-base-content mb-1">Number of Questions per Format ({quizForm.numQuestions})</label><input type="range" id="numQuestions" min="5" max="20" value={quizForm.numQuestions} onChange={handleQuizFormChange} className="w-full h-2 bg-base-100 rounded-lg appearance-none cursor-pointer accent-primary" /></div>
                                <div className="pt-4"><button type="submit" disabled={isLoading} className="w-full flex items-center justify-center bg-primary hover:bg-primary-focus text-white font-bold py-3 px-4 rounded-lg"><SparklesIcon className="w-5 h-5 mr-2" />{isLoading ? 'Generating...' : 'Generate Quiz'}</button></div>
                            </form>
                        )}
                    </div>
                    {/* Right Column: Previews */}
                     <div className="lg:col-span-2 bg-base-200 rounded-xl shadow-lg flex flex-col">
                        {isLoading && (<div className="flex-grow flex items-center justify-center text-center p-16"><div className="flex flex-col items-center"><SparklesIcon className="w-16 h-16 mx-auto text-primary animate-pulse mb-4" /><h3 className="text-2xl font-bold">AI is Generating...</h3><p className="mt-2">This may take a moment.</p></div></div>)}
                        {!isLoading && activeTab === 'dlp' && !dlpContent && (<div className="flex-grow flex items-center justify-center text-center p-16"><div><h3 className="text-2xl font-bold">DLP Preview</h3><p className="mt-2">Your generated Daily Lesson Plan will appear here.</p></div></div>)}
                        {!isLoading && activeTab === 'dll' && !dllContent && (<div className="flex-grow flex items-center justify-center text-center p-16"><div><h3 className="text-2xl font-bold">Weekly Plan Preview</h3><p className="mt-2">Your generated Weekly Plan will appear here.</p></div></div>)}
                        {!isLoading && activeTab === 'quiz' && !quizContent && (<div className="flex-grow flex items-center justify-center text-center p-16"><div><h3 className="text-2xl font-bold">Quiz Preview</h3><p className="mt-2">Your generated quiz will appear here.</p></div></div>)}
                        {!isLoading && activeTab === 'las' && !lasContent && (<div className="flex-grow flex items-center justify-center text-center p-16"><div><h3 className="text-2xl font-bold">Learning Sheet Preview</h3><p className="mt-2">Your generated activity sheet will appear here.</p></div></div>)}
                        
                        {!isLoading && dlpContent && activeTab === 'dlp' && (
                            <>
                                <div className="p-4 border-b border-base-300 flex justify-between items-center flex-shrink-0"><h3 className="text-xl font-bold">Generated DLP</h3><button onClick={handleDownloadDlpDocx} disabled={isLoading} className="flex items-center bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg"><DownloadIcon className="w-5 h-5 mr-2"/>Download Word File</button></div>
                                <div className="p-6 overflow-y-auto flex-grow min-h-0 dlp-preview">
                                    <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: dlpOutputHtml.mainContent }}></div>
                                    <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: dlpOutputHtml.reflectionTableHtml }}></div>
                                    <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: dlpOutputHtml.answerKeyHtml }}></div>
                                </div>
                            </>
                        )}

                        {!isLoading && dllContent && activeTab === 'dll' && (
                             <>
                                <div className="p-4 border-b border-base-300 flex justify-between items-center flex-shrink-0"><h3 className="text-xl font-bold">Generated Weekly Plan Preview</h3><button onClick={handleDownloadDllDocx} disabled={isLoading} className="flex items-center bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg"><DownloadIcon className="w-5 h-5 mr-2"/>Download Word File</button></div>
                                <div className="p-6 overflow-y-auto flex-grow min-h-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-sm">
                                            <thead className="bg-base-300"><tr className="text-left"><th className="p-2 border border-base-100 w-1/4">{dllHeaders.section}</th>
                                            {dllDays.map(day => <th key={day} className="p-2 border border-base-100">{day}</th>)}
                                            </tr></thead>
                                            <tbody>
                                                <tr className="bg-base-100/50"><td className="p-2 border border-base-100 font-bold">{dllHeaders.contentStandard}</td><td className="p-2 border border-base-100" colSpan={5}>{dllContent.contentStandard}</td></tr>
                                                <tr className="bg-base-100/50"><td className="p-2 border border-base-100 font-bold">{dllHeaders.performanceStandard}</td><td className="p-2 border border-base-100" colSpan={5}>{dllContent.performanceStandard}</td></tr>
                                                <tr className="bg-base-100/50">
                                                    <td className="p-2 border border-base-100 font-bold">{dllHeaders.learningCompetencies}</td>
                                                    <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningCompetencies.monday}</td>
                                                    <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningCompetencies.tuesday}</td>
                                                    <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningCompetencies.wednesday}</td>
                                                    <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningCompetencies.thursday}</td>
                                                    <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningCompetencies.friday}</td>
                                                </tr>
                                                <tr className="bg-base-100/50"><td className="p-2 border border-base-100 font-bold">{dllHeaders.content}</td><td className="p-2 border border-base-100" colSpan={5}>{dllContent.content}</td></tr>
                                                <>
                                                    <tr className="bg-base-300"><td className="p-2 border border-base-100 font-bold text-center" colSpan={6}>{dllHeaders.resources}</td></tr>
                                                    <tr>
                                                        <td className="p-2 border border-base-100 font-semibold">1. Teacher's Guide Pages</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.teacherGuidePages.monday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.teacherGuidePages.tuesday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.teacherGuidePages.wednesday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.teacherGuidePages.thursday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.teacherGuidePages.friday}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="p-2 border border-base-100 font-semibold">2. Learner's Materials Pages</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.learnerMaterialsPages.monday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.learnerMaterialsPages.tuesday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.learnerMaterialsPages.wednesday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.learnerMaterialsPages.thursday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.learnerMaterialsPages.friday}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="p-2 border border-base-100 font-semibold">3. Textbook Pages</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.textbookPages.monday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.textbookPages.tuesday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.textbookPages.wednesday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.textbookPages.thursday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.textbookPages.friday}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="p-2 border border-base-100 font-semibold">4. Additional Materials</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.additionalMaterials.monday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.additionalMaterials.tuesday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.additionalMaterials.wednesday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.additionalMaterials.thursday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.additionalMaterials.friday}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="p-2 border border-base-100 font-semibold">5. Other Resources</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.otherResources.monday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.otherResources.tuesday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.otherResources.wednesday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.otherResources.thursday}</td>
                                                        <td className="p-2 border border-base-100 whitespace-pre-wrap">{dllContent.learningResources.otherResources.friday}</td>
                                                    </tr>
                                                </>
                                                <tr className="bg-base-300"><td className="p-2 border border-base-100 font-bold text-center" colSpan={6}>{dllHeaders.procedures}</td></tr>
                                                {dllContent.procedures.map((p, i) => (<tr key={`proc-${i}`}><td className="p-2 border border-base-100 font-semibold" dangerouslySetInnerHTML={{ __html: p.procedure.replace(/\n/g, '<br/>')}}></td><td className="p-2 border border-base-100"><div className="whitespace-pre-wrap">{p.monday}</div></td><td className="p-2 border border-base-100"><div className="whitespace-pre-wrap">{p.tuesday}</div></td><td className="p-2 border border-base-100"><div className="whitespace-pre-wrap">{p.wednesday}</div></td><td className="p-2 border border-base-100"><div className="whitespace-pre-wrap">{p.thursday}</div></td><td className="p-2 border border-base-100"><div className="whitespace-pre-wrap">{p.friday}</div></td></tr>))}
                                                <tr className="bg-base-100/50"><td className="p-2 border border-base-100 font-bold">{dllHeaders.remarks}</td><td className="p-2 border border-base-100" colSpan={5}>{dllContent.remarks}</td></tr>
                                                <tr className="bg-base-300"><td className="p-2 border border-base-100 font-bold text-center" colSpan={6}>{dllHeaders.reflection}</td></tr>
                                                {dllContent.reflection.map((p, i) => (<tr key={`refl-${i}`}><td className="p-2 border border-base-100 font-semibold">{p.procedure}</td><td className="p-2 border border-base-100"><div className="whitespace-pre-wrap">{p.monday}</div></td><td className="p-2 border border-base-100"><div className="whitespace-pre-wrap">{p.tuesday}</div></td><td className="p-2 border border-base-100"><div className="whitespace-pre-wrap">{p.wednesday}</div></td><td className="p-2 border border-base-100"><div className="whitespace-pre-wrap">{p.thursday}</div></td><td className="p-2 border border-base-100"><div className="whitespace-pre-wrap">{p.friday}</div></td></tr>))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {!isLoading && lasContent && activeTab === 'las' && (
                           <LasPreview lasContent={lasContent} settings={settings} lasForm={lasForm} onDownload={handleDownloadLasDocx} />
                        )}

                        {!isLoading && quizContent && activeTab === 'quiz' && (
                            <>
                                <div className="p-4 border-b border-base-300 flex justify-between items-center flex-shrink-0"><h3 className="text-xl font-bold">{quizContent.quizTitle}</h3><button onClick={handleDownloadQuizDocx} disabled={isLoading} className="flex items-center bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg"><DownloadIcon className="w-5 h-5 mr-2"/>Download Word File</button></div>
                                <div className="p-6 overflow-y-auto flex-grow min-h-0">
                                    {quizContent.tableOfSpecifications && (
                                        <div className="mb-8">
                                            <h4 className="text-lg font-bold text-primary">Table of Specifications</h4>
                                            <div className="overflow-x-auto mt-2">
                                                <table className="w-full border-collapse text-sm">
                                                    <thead className="bg-base-300/50">
                                                        <tr>
                                                            <th className="p-2 border border-base-300 text-left">Learning Objective</th>
                                                            <th className="p-2 border border-base-300 text-left">Cognitive Level</th>
                                                            <th className="p-2 border border-base-300 text-left">Item Numbers</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {quizContent.tableOfSpecifications.map((item, index) => (
                                                            <tr key={index} className="border-b border-base-300">
                                                                <td className="p-2 border border-base-300">{item.objective}</td>
                                                                <td className="p-2 border border-base-300">{item.cognitiveLevel}</td>
                                                                <td className="p-2 border border-base-300">{item.itemNumbers}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                    {Object.entries(quizContent.questionsByType).map(([type, data]) => {
                                        const sectionData = data as GeneratedQuizSection | undefined;
                                        if (!sectionData) {
                                            return null;
                                        }
                                        return (
                                            <div key={type} className="mb-6">
                                                <h4 className="text-lg font-bold text-primary">{type}</h4>
                                                <p className="italic text-sm mb-2">{sectionData.instructions}</p>
                                                <ol className="list-decimal list-inside space-y-4">
                                                    {sectionData.questions.map((q, i) => (
                                                        <li key={i}>
                                                            <p>{q.questionText}</p>
                                                            {q.options && 
                                                                <ul className="list-none pl-6 text-sm">
                                                                    {q.options.map((opt, oi) => <li key={oi}>{String.fromCharCode(65 + oi)}. {opt}</li>)}
                                                                </ul>
                                                            }
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        );
                                    })}
                                    {quizContent.activities.length > 0 && (<div className="pt-6 border-t border-base-300"><h4 className="text-lg font-bold text-primary mb-2">Activities</h4><div className="space-y-4">{quizContent.activities.map((activity, i) => (<div key={i} className="bg-base-100 p-4 rounded-lg"><h5 className="font-semibold">{activity.activityName}</h5><p className="text-sm whitespace-pre-wrap">{activity.activityInstructions}</p>{activity.rubric ? (<div className="mt-2"><h6 className="font-semibold text-xs">Generated Rubric:</h6><ul className="list-disc list-inside text-xs pl-4">{activity.rubric.map(r => <li key={r.criteria}>{r.criteria} ({r.points} pts)</li>)}</ul></div>) : (<div className="flex items-center gap-2 mt-3"><input type="number" placeholder="Total Pts" value={activityPoints[i] || ''} onChange={e => handleActivityPointsChange(i, e.target.value)} className="w-24 bg-base-300 border border-base-200 rounded-md p-1 h-8 text-sm text-center" /><button onClick={() => handleGenerateRubric(i)} disabled={generatingRubricIndex === i} className="flex items-center text-sm bg-primary hover:bg-primary-focus text-white font-semibold py-1 px-2 rounded-md">{generatingRubricIndex === i ? '...' : <SparklesIcon className="w-4 h-4"/>} Generate Rubric</button></div>)}</div>))}</div></div>)}
                                </div>
                            </>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

const LasPreview: React.FC<{ lasContent: LearningActivitySheet, settings: SchoolSettings, lasForm: any, onDownload: () => void }> = ({ lasContent, settings, lasForm, onDownload }) => {
    return (
        <>
            <div className="p-4 border-b border-base-300 flex justify-between items-center flex-shrink-0">
                <h3 className="text-xl font-bold">{lasContent.activityTitle}</h3>
                <button onClick={onDownload} className="flex items-center bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg"><DownloadIcon className="w-5 h-5 mr-2"/>Download Word File</button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto flex-grow min-h-0 bg-base-100">
                <div className="bg-white text-black p-8 mx-auto max-w-4xl font-serif text-sm shadow-lg">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr,3fr,1fr] items-center gap-4">
                        <div className="flex items-center gap-2">
                            {settings.schoolLogo && <img src={settings.schoolLogo} alt="School Logo" className="w-12 h-12 object-contain" />}
                            {settings.secondLogo && <img src={settings.secondLogo} alt="Second Logo" className="w-12 h-12 object-contain" />}
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-lg">Dynamic Learning Program</p>
                            <p className="font-bold text-base">LEARNING ACTIVITY SHEET</p>
                        </div>
                        <div className="border border-black text-center p-1">
                            S.Y. {settings.schoolYear}
                        </div>
                    </div>
                    {/* Info */}
                    <table className="w-full my-4 text-sm">
                        <tbody>
                            <tr>
                                <td className="py-1 pr-4"><strong>Name:</strong> <span className="border-b border-black inline-block w-4/5"></span></td>
                                <td className="py-1 w-1/4"><strong>Score:</strong></td>
                            </tr>
                             <tr>
                                <td className="py-1 pr-4"><strong>Grade & Section:</strong> <span className="border-b border-black inline-block w-2/3"></span></td>
                                <td className="py-1 w-1/4"><strong>Date:</strong></td>
                            </tr>
                        </tbody>
                    </table>
                     {/* Type of Activity */}
                    <table className="w-full border-collapse border border-black text-sm">
                        <tbody>
                            <tr className="bg-black text-white"><td className="p-2 font-bold" colSpan={3}>Type of Activity: <span className="font-normal">(Check or choose from below.)</span></td></tr>
                            <tr>
                                <td className="p-2 border-r border-black">☐ Concept Notes</td>
                                <td className="p-2 border-r border-black">☐ Performance Task</td>
                                <td className="p-2">☐ Formal Theme</td>
                            </tr>
                            <tr>
                                <td className="p-2 border-r border-black">☐ Skills: Exercise / Drill</td>
                                <td className="p-2 border-r border-black">☐ Illustration</td>
                                <td className="p-2">☐ Informal Theme</td>
                            </tr>
                             <tr>
                                <td className="p-2" colSpan={3}>☐ Others: <span className="border-b border-black inline-block w-1/4"></span></td>
                            </tr>
                        </tbody>
                    </table>
                    {/* Main Content Table */}
                     <table className="w-full border-collapse border border-black text-sm mt-[-1px]">
                         <tbody>
                            <tr className="bg-black text-white"><td className="w-1/4 p-2 font-bold">Activity Title:</td><td className="w-3/4 p-2 bg-white text-black font-semibold">{lasContent.activityTitle}</td></tr>
                            <tr className="bg-black text-white"><td className="p-2 font-bold align-top">Learning Target:</td><td className="p-2 bg-white text-black whitespace-pre-wrap">{lasContent.learningTarget}</td></tr>
                            <tr className="bg-black text-white"><td className="p-2 font-bold align-top">References:</td><td className="p-2 bg-white text-black"><p className="text-xs italic">(Author, Title, Pages)</p><p className="whitespace-pre-wrap text-xs">{lasContent.references}</p></td></tr>
                        </tbody>
                    </table>
                    
                    {/* Content Body */}
                    <div className="pt-4 space-y-4">
                        {lasContent.conceptNotes.map((note, index) => (
                            <div key={index}>
                                <h4 className="font-bold underline">{note.title}</h4>
                                <p className="whitespace-pre-wrap text-justify">{note.content}</p>
                            </div>
                        ))}
                        {lasContent.activities.map((activity, index) => (
                            <div key={index} className="pt-4">
                                <h3 className="text-base font-bold underline">{activity.title}</h3>
                                <p className="italic">{activity.instructions}</p>
                                {activity.questions && (
                                    <ol className="list-decimal list-outside pl-8 mt-2 space-y-2">
                                        {activity.questions.map((q, qIndex) => (
                                            <li key={qIndex}>
                                                <p>{q.questionText}</p>
                                                {q.options && <ul className="list-none pl-4 text-sm"> {q.options.map((opt, oi) => <li key={oi}>{String.fromCharCode(65 + oi)}. {opt}</li>)}</ul>}
                                                {(q.type === 'Essay' || q.type === 'Problem-solving') && <div className="h-20"></div>}
                                            </li>
                                        ))}
                                    </ol>
                                )}
                                {activity.rubric && (
                                    <div className="mt-4">
                                        <h5 className="font-bold">Rubric</h5>
                                        <table className="w-full text-xs border-collapse border border-black">
                                            <thead className="bg-gray-200"><tr><th className="p-1 border border-black">Criteria</th><th className="p-1 border border-black w-1/6">Points</th></tr></thead>
                                            <tbody>{activity.rubric.map(r => <tr key={r.criteria}><td className="p-1 border border-black">{r.criteria}</td><td className="p-1 border border-black text-center">{r.points}</td></tr>)}</tbody>
                                        </table>
                                    </div>
                                )}
                             </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default LessonPlanners;