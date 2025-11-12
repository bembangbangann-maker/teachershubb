import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import { useAppContext } from '../contexts/AppContext';
import { BookOpenIcon, UsersIcon, LightbulbIcon, NotebookIcon, SparklesIcon, ChartBarIcon, AwardIcon, EyeIcon, FlagIcon, LeafIcon, HeartIcon, ChevronDownIcon, QuoteIcon, InfoIcon, ClockIcon } from './icons';
import { calculateInitialGrade, transmuteGrade, getHonorStatus } from '../utils/transmutation';
import { getInspirationalQuote } from '../services/geminiService';
import { holidays } from '../utils/holidays';
import { Quarter } from '../types';

const MAPEH_COMPONENTS = ["Music", "Arts", "PE", "Health"];

const Dashboard: React.FC = () => {
    const { students, settings, classRecords, classRecordSettings, anecdotes, uiState, attendance, honorsCalculationData } = useAppContext();
    const [isPrinciplesOpen, setIsPrinciplesOpen] = useState(false);
    const [quote, setQuote] = useState<{ quote: string; author: string } | null>(null);
    const [quoteError, setQuoteError] = useState<string | null>(null);
    const [isQuoteLoading, setIsQuoteLoading] = useState(true);
    const [isFailingVisible, setIsFailingVisible] = useState(false);
    const [isWatchlistVisible, setIsWatchlistVisible] = useState(true);
    const [selectedAdvisoryBatchId, setSelectedAdvisoryBatchId] = useState('');
    const [timeOfDayMessage, setTimeOfDayMessage] = useState('');

    const [snapshotSelection, setSnapshotSelection] = useState({
        subject: uiState.grades.selectedSubject || '',
        batchId: uiState.grades.selectedBatchId || '',
        quarter: uiState.grades.selectedQuarter || (1 as Quarter),
    });

    const teacherFirstName = useMemo(() => {
        if (!settings.teacherName?.trim()) return null;
        return settings.teacherName.trim().split(' ')[0];
    }, [settings.teacherName]);

    useEffect(() => {
        const currentHour = new Date().getHours();
        if (currentHour >= 6 && currentHour < 9) {
            setTimeOfDayMessage("Good morning! Don't forget to have a great breakfast to start your day.");
        } else if (currentHour >= 9 && currentHour < 11) {
            setTimeOfDayMessage("It's a great time for a quick snack and a short break.");
        } else if (currentHour >= 11 && currentHour < 14) {
            setTimeOfDayMessage("Lunchtime! Time to recharge for the afternoon.");
        } else if (currentHour >= 14 && currentHour < 17) {
            setTimeOfDayMessage("A little afternoon snack can boost your energy.");
        } else if (currentHour >= 17 && currentHour < 20) {
            setTimeOfDayMessage("Hope you have a wonderful dinner ahead.");
        } else {
            setTimeOfDayMessage("");
        }

        const savedState = localStorage.getItem('dashboardState');
        if (savedState) {
            try {
                const { principlesOpen, failingVisible, watchlistVisible, advisoryBatchId, snapshot } = JSON.parse(savedState);
                setIsPrinciplesOpen(principlesOpen ?? false);
                setIsFailingVisible(failingVisible ?? false);
                setIsWatchlistVisible(watchlistVisible ?? true);
                if (advisoryBatchId) setSelectedAdvisoryBatchId(advisoryBatchId);
                if (snapshot) setSnapshotSelection(prev => ({...prev, ...snapshot}));
            } catch (e) {
                console.error("Failed to parse dashboardState", e);
            }
        }
    }, []);

    useEffect(() => {
        const stateToSave = {
            principlesOpen: isPrinciplesOpen,
            failingVisible: isFailingVisible,
            watchlistVisible: isWatchlistVisible,
            advisoryBatchId: selectedAdvisoryBatchId,
            snapshot: snapshotSelection,
        };
        localStorage.setItem('dashboardState', JSON.stringify(stateToSave));
    }, [isPrinciplesOpen, isFailingVisible, isWatchlistVisible, selectedAdvisoryBatchId, snapshotSelection]);

    useEffect(() => {
        const fetchQuote = async () => {
            setIsQuoteLoading(true);
            setQuoteError(null);
            try {
                const today = new Date().toISOString().split('T')[0];
                const cachedTimestamp = localStorage.getItem('quoteTimestamp');
                const cachedQuote = localStorage.getItem('cachedQuote');

                if (cachedTimestamp === today && cachedQuote) {
                    setQuote(JSON.parse(cachedQuote));
                } else {
                    const newQuote = await getInspirationalQuote();
                    setQuote(newQuote);
                    localStorage.setItem('cachedQuote', JSON.stringify(newQuote));
                    localStorage.setItem('quoteTimestamp', today);
                }
            } catch (error) {
                console.error("Failed to fetch quote:", error);
                if (error instanceof Error) {
                    setQuoteError(error.message);
                } else {
                    setQuoteError("An unknown error occurred fetching the quote.");
                }
            } finally {
                setIsQuoteLoading(false);
            }
        };

        fetchQuote();
    }, []);

    const upcomingHolidays = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return holidays
            .map(h => {
                let holidayDate;
                if (h.calculateDate) {
                    const { month, day } = h.calculateDate(today.getFullYear());
                    holidayDate = new Date(today.getFullYear(), month, day);
                } else {
                    holidayDate = new Date(today.getFullYear(), h.month, h.day);
                }
    
                if (holidayDate < today) {
                     if (h.calculateDate) {
                        const { month, day } = h.calculateDate(today.getFullYear() + 1);
                        holidayDate = new Date(today.getFullYear() + 1, month, day);
                     } else {
                        holidayDate.setFullYear(today.getFullYear() + 1);
                     }
                }
                return { ...h, date: holidayDate };
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 3);
    }, []);

    const availableSubjects = useMemo(() => {
        return Array.from(new Set(classRecordSettings.map(s => s.subject).filter(Boolean))).sort();
    }, [classRecordSettings]);

    const availableBatches = useMemo(() => {
        const batchMap = new Map<string, string>();
        students.forEach(student => {
            if (student.importBatchId && !batchMap.has(student.importBatchId)) {
                const batchName = (student.gradeLevel && student.section)
                    ? `${student.gradeLevel} - ${student.section}`
                    : `Batch from ${student.importFileName}`;
                batchMap.set(student.importBatchId, batchName);
            }
        });
        return Array.from(batchMap.entries()).map(([id, name]) => ({ id, name }));
    }, [students]);
    
    const advisoryBatches = useMemo(() => {
        const advisoryBatchMap = new Map<string, string>();
        honorsCalculationData.forEach(batch => {
            const student = students.find(s => s.importBatchId === batch.batchId);
            if (student) {
                const name = (student.gradeLevel && student.section) 
                    ? `${student.gradeLevel} - ${student.section}`
                    : `Batch from ${student.importFileName}`;
                advisoryBatchMap.set(batch.batchId, name);
            }
        });
        return Array.from(advisoryBatchMap.entries()).map(([id, name]) => ({ id, name }));
    }, [honorsCalculationData, students]);


    // Initialize selections
    useEffect(() => {
        if (!snapshotSelection.subject && availableSubjects.length > 0) {
            setSnapshotSelection(prev => ({ ...prev, subject: availableSubjects[0] }));
        }
        if (!snapshotSelection.batchId && availableBatches.length > 0) {
            setSnapshotSelection(prev => ({ ...prev, batchId: availableBatches[0].id }));
        }
        if (!selectedAdvisoryBatchId && advisoryBatches.length > 0) {
            setSelectedAdvisoryBatchId(advisoryBatches[0].id);
        }
    }, [availableSubjects, availableBatches, snapshotSelection, advisoryBatches, selectedAdvisoryBatchId]);


    const stats = useMemo(() => ({
        totalStudents: students.length,
        totalClasses: settings.sections.length,
    }), [students, settings]);

    // --- Attention Items Logic ---
    const attentionItems = useMemo(() => {
        const items = [];
        
        const todayUTCString = new Date().toISOString().split('T')[0];
        const batchesWithStudents = new Set(students.map(s => s.importBatchId).filter(Boolean));
        
        if (batchesWithStudents.size > 0) {
            const batchesWithAttendanceToday = new Set();
            attendance.forEach(a => {
                if (a.date === todayUTCString) {
                    const student = students.find(s => s.id === a.studentId);
                    if (student && student.importBatchId) {
                        batchesWithAttendanceToday.add(student.importBatchId);
                    }
                }
            });

            const pendingCount = batchesWithStudents.size - batchesWithAttendanceToday.size;
            if (pendingCount > 0) {
                items.push({
                    id: 'attendance',
                    text: `Attendance is pending for ${pendingCount} class(es) today.`,
                    link: '/students',
                    linkText: 'Take Attendance'
                });
            }
        }

        if (anecdotes.length === 0 && students.length > 0) {
            items.push({
                id: 'no_anecdotes',
                text: `You haven't recorded any student observations yet.`,
                link: '/records',
                linkText: 'Add a Record'
            });
        }

        return items;
    }, [students, attendance, anecdotes]);


    // --- Class Performance Logic ---
    const performanceData = useMemo(() => {
        const { subject, batchId, quarter } = snapshotSelection;
        if (!batchId || !subject) return null;

        const relevantStudents = students.filter(s => s.importBatchId === batchId);
        if (relevantStudents.length === 0) return null;

        const honorsCount: { [key: string]: number } = { 'With Highest Honors': 0, 'With High Honors': 0, 'With Honors': 0 };
        const failingStudents: { name: string, grade: number }[] = [];
        let totalGraded = 0;

        relevantStudents.forEach(student => {
            const record = classRecords.find(r => r.studentId === student.id && r.subject === subject && r.quarter === quarter && r.batchId === batchId);
            const settingsRecord = classRecordSettings.find(s => s.subject === subject && s.quarter === quarter && s.batchId === batchId);
            
            if (record && settingsRecord) {
                const { initialGrade } = calculateInitialGrade(record, settingsRecord);
                if (initialGrade !== null) {
                    totalGraded++;
                    const quarterlyGrade = transmuteGrade(initialGrade);
                    if (quarterlyGrade < 75) {
                        failingStudents.push({ name: `${student.firstName} ${student.lastName}`, grade: quarterlyGrade });
                    }
                    const honorStatus = getHonorStatus(quarterlyGrade);
                    if (honorStatus) {
                        honorsCount[honorStatus]++;
                    }
                }
            }
        });
        
        const batchInfo = availableBatches.find(b => b.id === batchId);
        const title = `Performance in ${subject} - Q${quarter} for ${batchInfo?.name || 'Selected Class'}`;
        if (totalGraded === 0) return { title, noData: true };

        return {
            title,
            chartData: [
                { label: 'Highest Honors', value: honorsCount['With Highest Honors'], color: 'bg-yellow-400' },
                { label: 'High Honors', value: honorsCount['With High Honors'], color: 'bg-gray-300' },
                { label: 'With Honors', value: honorsCount['With Honors'], color: 'bg-orange-400' },
            ],
            maxVal: Math.max(...Object.values(honorsCount), 1),
            noData: false,
            failingStudents: failingStudents.sort((a, b) => a.name.localeCompare(b.name)),
        };
    }, [snapshotSelection, students, classRecords, classRecordSettings, availableBatches]);

    const advisoryWatchlist = useMemo(() => {
        if (!selectedAdvisoryBatchId) return [];

        const batchData = honorsCalculationData.find(d => d.batchId === selectedAdvisoryBatchId);
        if (!batchData) return [];

        const studentsInClass = students.filter(s => s.importBatchId === selectedAdvisoryBatchId);
        const watchlist: { student: typeof students[0], reasons: string[] }[] = [];

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();

        for (const student of studentsInClass) {
            const reasons: string[] = [];
            const studentGrades = batchData.studentGrades[student.id];

            const studentAttendance = attendance.filter(a => {
                if (a.studentId !== student.id) return false;
                const attDate = new Date(a.date + 'T00:00:00Z');
                return attDate.getUTCFullYear() === currentYear && attDate.getUTCMonth() === currentMonth;
            });
            const absences = studentAttendance.filter(a => a.status === 'absent').length;
            const tardies = studentAttendance.filter(a => a.status === 'late').length;

            if (absences > 3) reasons.push(`${absences} absences this month`);
            if (tardies > 5) reasons.push(`${tardies} tardies this month`);
            
            if (studentGrades) {
                const subjectAvgs: { subject: string, avg: number }[] = [];
                const hasMapehComponents = MAPEH_COMPONENTS.every(comp => batchData.subjects.includes(comp));

                batchData.subjects.forEach(subject => {
                    const grades = (studentGrades[subject] || []).filter((g): g is number => g !== null);
                    if (grades.length > 0) {
                        const avg = Math.round(grades.reduce((a, b) => a + b, 0) / grades.length);
                        subjectAvgs.push({ subject, avg });
                    }
                });

                const failingSubjects = subjectAvgs.filter(s => s.avg < 75);
                if (failingSubjects.length > 0) {
                    reasons.push(`Failing subjects: ${failingSubjects.map(s => `${s.subject} (${s.avg})`).join(', ')}`);
                }

                let gwaGrades: number[] = [];
                if (hasMapehComponents) {
                    const mapehComponentAvgs = MAPEH_COMPONENTS.map(comp => subjectAvgs.find(s => s.subject === comp)?.avg).filter((g): g is number => g !== undefined);
                    if (mapehComponentAvgs.length === 4) {
                        const mapehAvg = Math.round(mapehComponentAvgs.reduce((a, b) => a + b, 0) / 4);
                        gwaGrades.push(mapehAvg);
                    }
                    subjectAvgs.forEach(s => { if (!MAPEH_COMPONENTS.includes(s.subject)) gwaGrades.push(s.avg); });
                } else {
                    gwaGrades = subjectAvgs.map(s => s.avg);
                }

                if (gwaGrades.length > 0) {
                    const gwa = gwaGrades.reduce((a, b) => a + b, 0) / gwaGrades.length;
                    if (gwa < 75) reasons.push(`Failing GWA: ${gwa.toFixed(2)}`);
                }
            }

            if (reasons.length > 0) {
                watchlist.push({ student, reasons });
            }
        }
        return watchlist.sort((a,b) => a.student.lastName.localeCompare(b.student.lastName));
    }, [selectedAdvisoryBatchId, honorsCalculationData, students, attendance]);


    // --- Recent Anecdotes ---
    const recentAnecdotes = useMemo(() => {
        const studentMap = new Map(students.map(s => [s.id, s]));
        return [...anecdotes]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map(a => ({ ...a, student: studentMap.get(a.studentId) }));
    }, [anecdotes, students]);

    return (
        <div className="min-h-screen">
            <Header title="Dashboard" />
            <div className="p-4 md:p-8">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-base-content">
                        {teacherFirstName
                            ? `Welcome back, ${teacherFirstName}!`
                            : 'Welcome back, Teacher!'}
                    </h1>
                    <p className="text-base-content mt-1">Here's your classroom at a glance.</p>
                </div>

                {timeOfDayMessage && (
                    <div className="bg-info/10 border-l-4 border-info text-info p-4 mb-8 rounded-r-lg shadow-lg flex items-center gap-4">
                        <ClockIcon className="w-6 h-6 flex-shrink-0" />
                        <p className="font-semibold">{timeOfDayMessage}</p>
                    </div>
                )}
                
                <div className="bg-base-300 border-l-4 border-primary p-4 mb-8 rounded-r-lg shadow-lg" role="alert">
                    <div className="flex items-center">
                        <div className="py-1"><LightbulbIcon className="w-8 h-8 mr-4 text-primary"/></div>
                        <div>
                            <p className="font-bold text-lg text-base-content">Pro Tip: Always Back Up Your Data!</p>
                            <p className="text-base text-base-content">
                                Your data is saved locally in your browser. To prevent accidental data loss, please 
                                <Link to="/settings" className="font-semibold underline hover:text-primary-focus transition-colors"> download a backup file </Link> 
                                regularly and save it in a safe place.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Main Column */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-base-200 p-6 rounded-xl shadow-lg flex items-center">
                                <UsersIcon className="w-12 h-12 text-primary mr-6"/>
                                <div>
                                    <p className="text-4xl font-bold text-base-content">{stats.totalStudents}</p>
                                    <p className="text-base-content">Total Students</p>
                                </div>
                            </div>
                            <div className="bg-base-200 p-6 rounded-xl shadow-lg flex items-center">
                                <BookOpenIcon className="w-12 h-12 text-primary mr-6"/>
                                <div>
                                    <p className="text-4xl font-bold text-base-content">{stats.totalClasses}</p>
                                    <p className="text-base-content">Managed Classes</p>
                                </div>
                            </div>
                        </div>

                        {/* Advisory Watchlist */}
                        <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                            <button onClick={() => setIsWatchlistVisible(!isWatchlistVisible)} className="w-full flex justify-between items-center text-left">
                                <h3 className="text-xl font-bold text-base-content mb-4 flex items-center">
                                    <FlagIcon className="w-6 h-6 mr-3 text-primary"/>
                                    Advisory Watchlist
                                </h3>
                                 <ChevronDownIcon className={`w-5 h-5 transition-transform ${isWatchlistVisible ? 'rotate-180' : ''}`} />
                            </button>
                             {isWatchlistVisible && (
                                <div>
                                    <div className="mb-4">
                                        <label htmlFor="advisory-batch" className="text-xs font-medium text-base-content">Advisory Class</label>
                                        <select id="advisory-batch" value={selectedAdvisoryBatchId} onChange={(e) => setSelectedAdvisoryBatchId(e.target.value)} className="w-full bg-base-100 border border-base-300 rounded-md py-2 px-3 text-sm mt-1">
                                            {advisoryBatches.length > 0 ? advisoryBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>) : <option>No advisory data found</option>}
                                        </select>
                                    </div>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {advisoryWatchlist.length > 0 ? (
                                            advisoryWatchlist.map(({ student, reasons }) => (
                                                <div key={student.id} className="bg-base-100 p-3 rounded-md">
                                                    <p className="font-semibold text-base-content">{student.firstName} {student.lastName}</p>
                                                    <ul className="list-disc list-inside text-sm text-warning mt-1">
                                                        {reasons.map((r, i) => <li key={i}>{r}</li>)}
                                                    </ul>
                                                </div>
                                            ))
                                        ) : advisoryBatches.length > 0 ? (
                                             <div className="text-center py-8 text-success italic">
                                                Great job! All students in your advisory class are currently on track.
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-base-content/70 italic">
                                                No advisory class data found. Go to the <Link to="/honors-calculator" className="text-primary underline">Honors Calculator</Link> to enter final grades.
                                            </div>
                                        )}
                                    </div>
                                </div>
                             )}
                        </div>

                        {/* Class Performance Snapshot */}
                        <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold text-base-content mb-4 flex items-center">
                                <ChartBarIcon className="w-6 h-6 mr-3 text-primary"/>
                                Class Performance Snapshot
                            </h3>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div>
                                    <label htmlFor="snapshot-subject" className="text-xs font-medium text-base-content">Subject</label>
                                    <select id="snapshot-subject" value={snapshotSelection.subject} onChange={(e) => setSnapshotSelection(prev => ({ ...prev, subject: e.target.value }))} className="w-full bg-base-100 border border-base-300 rounded-md py-2 px-3 text-sm">
                                        {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="snapshot-batch" className="text-xs font-medium text-base-content">Class</label>
                                    <select id="snapshot-batch" value={snapshotSelection.batchId} onChange={(e) => setSnapshotSelection(prev => ({ ...prev, batchId: e.target.value }))} className="w-full bg-base-100 border border-base-300 rounded-md py-2 px-3 text-sm">
                                        {availableBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="snapshot-quarter" className="text-xs font-medium text-base-content">Quarter</label>
                                    <select id="snapshot-quarter" value={snapshotSelection.quarter} onChange={(e) => setSnapshotSelection(prev => ({ ...prev, quarter: Number(e.target.value) as Quarter }))} className="w-full bg-base-100 border border-base-300 rounded-md py-2 px-3 text-sm">
                                        {[1, 2, 3, 4].map(q => <option key={q} value={q}>{q}</option>)}
                                    </select>
                                </div>
                            </div>
                            {performanceData ? (
                                !performanceData.noData ? (
                                    <div>
                                        <p className="text-base-content mb-4 text-sm font-semibold">{performanceData.title}</p>
                                        <div className="space-y-3">
                                            {performanceData.chartData.map(bar => (
                                                <div key={bar.label} className="flex items-center">
                                                    <div className="w-32 text-sm text-base-content text-right pr-4 shrink-0">{bar.label}</div>
                                                    <div className="flex-1 bg-base-100 rounded-full h-6">
                                                        <div 
                                                            className={`${bar.color} h-6 rounded-full flex items-center justify-end pr-2 text-black font-bold text-sm transition-width duration-500`}
                                                            style={{ width: `${(bar.value / performanceData.maxVal) * 100}%` }}
                                                        >
                                                            {bar.value > 0 ? bar.value : ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                         <div className="mt-6 pt-4 border-t border-base-300">
                                            <button onClick={() => setIsFailingVisible(!isFailingVisible)} className="w-full flex justify-between items-center text-left font-bold text-base-content">
                                                <span>Students Requiring Attention ({performanceData.failingStudents.length})</span>
                                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isFailingVisible ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isFailingVisible && (
                                                <div className="mt-2">
                                                    {performanceData.failingStudents.length > 0 ? (
                                                        <ul className="list-disc list-inside space-y-1 text-sm text-warning max-h-40 overflow-y-auto">
                                                            {performanceData.failingStudents.map((s, i) => (
                                                                <li key={i}>
                                                                    <span className="font-semibold text-base-content">{s.name}</span> - Grade: {s.grade}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="text-sm text-success italic">
                                                            Great job! No students have failing grades for this selection.
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-base-content">{performanceData.title}</p>
                                        <p className="text-base-content/70 italic mt-1">No graded students found for this selection.</p>
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-base-content">Select a subject and class to see performance data.</p>
                                    <p className="text-base-content/70 italic mt-1">Go to <Link to="/grades" className="text-primary underline">Grading Sheets</Link> to enter grades.</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Recent Anecdotal Records */}
                        <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold text-base-content mb-4 flex items-center">
                                <NotebookIcon className="w-6 h-6 mr-3 text-primary"/>
                                Recent Observations
                            </h3>
                            <div className="space-y-3">
                                {recentAnecdotes.length > 0 ? recentAnecdotes.map(anecdote => (
                                    <div key={anecdote.id} className="bg-base-100 p-3 rounded-md text-sm">
                                        <p className="font-semibold text-base-content">{anecdote.student ? `${anecdote.student.firstName} ${anecdote.student.lastName}` : 'Unknown'}</p>
                                        <p className="text-base-content italic truncate">"{anecdote.observation}"</p>
                                    </div>
                                )) : (
                                    <p className="text-base-content/70 italic text-sm">No anecdotal records found.</p>
                                )}
                            </div>
                        </div>

                        {/* DepEd Principles */}
                        <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                            <button
                                onClick={() => setIsPrinciplesOpen(!isPrinciplesOpen)}
                                className="w-full flex justify-between items-center text-left"
                                aria-expanded={isPrinciplesOpen}
                                aria-controls="principles-content"
                            >
                                <h3 className="text-xl font-bold text-base-content flex items-center">
                                    Our Guiding Principles
                                </h3>
                                <ChevronDownIcon className={`w-6 h-6 text-primary transition-transform duration-300 ${isPrinciplesOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <div 
                                id="principles-content"
                                className={`transition-all duration-500 ease-in-out overflow-hidden ${isPrinciplesOpen ? 'max-h-[1000px] mt-6' : 'max-h-0'}`}
                            >
                                 {/* Vision Section */}
                                <div className="mb-6">
                                    <h4 className="text-lg font-bold text-primary mb-2 flex items-center">
                                        <EyeIcon className="w-5 h-5 mr-2"/>
                                        Our Vision
                                    </h4>
                                    <blockquote className="border-l-4 border-primary/50 pl-4 italic text-base-content/90">
                                        We dream of Filipinos who passionately love their country and whose values and competencies enable them to realize their full potential and contribute meaningfully to building the nation. As a learner-centered public institution, the Department of Education continuously improves itself to better serve its stakeholders.
                                    </blockquote>
                                </div>
                                {/* Mission Section */}
                                <div className="mb-6">
                                    <h4 className="text-lg font-bold text-primary mb-2 flex items-center">
                                        <FlagIcon className="w-5 h-5 mr-2"/>
                                        Our Mission
                                    </h4>
                                    <p className="text-base-content/90 mb-2">
                                        To protect and promote the right of every Filipino to quality, equitable, culture-based, and complete basic education where:
                                    </p>
                                    <ul className="list-disc list-inside space-y-1 text-base-content/90 pl-4">
                                        <li>Students learn in a child-friendly, gender-sensitive, safe, and motivating environment.</li>
                                        <li>Teachers facilitate learning and constantly nurture every learner.</li>
                                        <li>Administrators and staff, as stewards of the institution, ensure an enabling and supportive environment for effective learning to happen.</li>
                                        <li>Family, community, and other stakeholders are actively engaged and share responsibility for developing life-long learners.</li>
                                    </ul>
                                </div>
                                 {/* Core Values Section */}
                                <div>
                                    <h4 className="text-lg font-bold text-primary mb-3 flex items-center">
                                        <HeartIcon className="w-5 h-5 mr-2"/>
                                        Our Core Values
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                        <div className="bg-base-100 p-4 rounded-lg flex flex-col items-center justify-center">
                                            <HeartIcon className="w-8 h-8 mx-auto text-primary mb-2"/>
                                            <p className="font-bold">Maka-Diyos</p>
                                        </div>
                                        <div className="bg-base-100 p-4 rounded-lg flex flex-col items-center justify-center">
                                            <UsersIcon className="w-8 h-8 mx-auto text-primary mb-2"/>
                                            <p className="font-bold">Maka-tao</p>
                                        </div>
                                        <div className="bg-base-100 p-4 rounded-lg flex flex-col items-center justify-center">
                                            <LeafIcon className="w-8 h-8 mx-auto text-primary mb-2"/>
                                            <p className="font-bold">Makakalikasan</p>
                                        </div>
                                        <div className="bg-base-100 p-4 rounded-lg flex flex-col items-center justify-center">
                                            <FlagIcon className="w-8 h-8 mx-auto text-primary mb-2"/>
                                            <p className="font-bold">Makabansa</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Side Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Quote of the Day */}
                        <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold text-base-content mb-4 flex items-center">
                                <QuoteIcon className="w-6 h-6 mr-3 text-primary"/>
                                Quote of the Day
                            </h3>
                            {isQuoteLoading ? (
                                <p className="text-base-content/70 italic text-sm">Fetching inspiration...</p>
                            ) : quote ? (
                                <div>
                                    <blockquote className="text-base-content italic border-l-4 border-primary/50 pl-4">
                                        "{quote.quote}"
                                    </blockquote>
                                    <p className="text-right text-base-content/80 font-semibold mt-2">- {quote.author}</p>
                                </div>
                            ) : (
                                <p className="text-warning/80 italic text-sm">{quoteError || 'Could not fetch a quote today. Please check your API key.'}</p>
                            )}
                        </div>

                        {/* For Your Attention */}
                        <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold text-base-content mb-4 flex items-center">
                                <InfoIcon className="w-6 h-6 mr-3 text-primary"/>
                                Today's To-Do List
                            </h3>
                            {attentionItems.length > 0 ? (
                                <div className="space-y-4">
                                    {attentionItems.map(item => (
                                        <div key={item.id} className="bg-base-100 p-4 rounded-lg">
                                            <p className="text-base-content text-sm">{item.text}</p>
                                            <Link to={item.link} className="text-sm font-bold text-primary hover:underline mt-2 inline-block">
                                                {item.linkText} &rarr;
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-base-content/70 italic text-sm">Everything looks up-to-date!</p>
                            )}
                        </div>

                        {/* Upcoming Holidays */}
                        <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold text-base-content mb-4 flex items-center">
                                <FlagIcon className="w-6 h-6 mr-3 text-primary"/>
                                Upcoming Holidays
                            </h3>
                            <div className="space-y-4">
                                {upcomingHolidays.length > 0 ? upcomingHolidays.map(holiday => (
                                    <div key={holiday.name} className="bg-base-100 p-4 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-base-content">{holiday.name}</p>
                                            <p className="text-sm font-semibold text-primary">{holiday.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                                        </div>
                                        <p className="text-sm text-base-content/80 mt-2 italic">"{holiday.message}"</p>
                                    </div>
                                )) : (
                                    <p className="text-sm text-base-content/70 italic">No upcoming holidays found.</p>
                                )}
                            </div>
                        </div>

                        {/* AI Toolkit */}
                         <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold text-base-content mb-4 flex items-center">
                                <SparklesIcon className="w-6 h-6 mr-3 text-primary"/>
                                AI Toolkit
                            </h3>
                            <div className="space-y-3">
                                <Link to="/honors-calculator" className="w-full block bg-base-100 hover:bg-base-300 text-base-content font-semibold py-3 px-4 rounded-lg transition-colors">
                                    Calculate Final Honors
                                </Link>
                                <Link to="/lesson-planners" className="w-full block bg-base-100 hover:bg-base-300 text-base-content font-semibold py-3 px-4 rounded-lg transition-colors">
                                    Generate DLP & Quizzes
                                </Link>
                                <Link to="/records" className="w-full block bg-base-100 hover:bg-base-300 text-base-content font-semibold py-3 px-4 rounded-lg transition-colors">
                                    Rephrase Anecdotal Notes
                                </Link>
                                 <Link to="/grades" className="w-full block bg-base-100 hover:bg-base-300 text-base-content font-semibold py-3 px-4 rounded-lg transition-colors">
                                    Analyze Performance Trends
                                </Link>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;