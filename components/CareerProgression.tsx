import React, { useState, useMemo, useEffect } from 'react';
import Header from './Header';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import { ChevronDownIcon, SparklesIcon, TrendingUpIcon, InfoIcon, CheckCircleIcon, BookIcon, BriefcaseIcon, ClipboardListIcon, BadgeCheckIcon, RefreshCwIcon, ListIcon, FolderIcon, ClipboardCheckIcon, StarIcon, CircleIcon } from './icons';
import { promotionRequirements, qualificationsData, salaryGrades } from '../data/ppstData';
import { t2t7Objectives, Rating } from '../data/ppstT2T7Data';
import { toast } from 'react-hot-toast';

// Reusable Guide Section Component
interface GuideSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    startOpen?: boolean;
}
const GuideSection: React.FC<GuideSectionProps> = ({ title, icon, children, startOpen = false }) => {
    const [isOpen, setIsOpen] = useState(startOpen);
    return (
        <div className="bg-base-200 rounded-xl shadow-lg">
            <button
                className="w-full flex justify-between items-center p-5 text-left"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-4">
                    {icon}
                    <h3 className="text-xl font-bold text-base-content">{title}</h3>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[20000px]' : 'max-h-0'}`}>
                <div className="p-5 border-t border-base-300 prose prose-invert max-w-none prose-headings:text-primary prose-strong:text-base-content prose-table:bg-base-100 prose-thead:bg-base-300/50 prose-th:p-2 prose-td:p-2 prose-li:my-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Helper to parse requirements like "At least 6 Proficient COIs at Very Satisfactory"
const parseReqs = (reqString: string) => {
    const result = { vs: 0, o: 0, stage: '' };
    if (!reqString) return result;

    if (reqString.toLowerCase().includes('proficient')) result.stage = 'proficient';
    else if (reqString.toLowerCase().includes('highly proficient')) result.stage = 'highlyProficient';
    else if (reqString.toLowerCase().includes('distinguished')) result.stage = 'distinguished';

    const parts = reqString.toLowerCase().split('; and ');
    parts.forEach(part => {
        const vsMatch = part.match(/(\d+)\s.*?(very satisfactory)/);
        const oMatch = part.match(/(\d+)\s.*?(outstanding)/);
        if (vsMatch) result.vs += parseInt(vsMatch[1], 10);
        if (oMatch) result.o += parseInt(oMatch[1], 10);
    });
    return result;
};


// Visual Career Path Component
const CareerPathVisualizer: React.FC<{ allPositions: string[], currentPosition: string, analysis: any }> = ({ allPositions, currentPosition, analysis }) => {
    const { qualifiedPositions, nextTarget } = analysis;
    const currentSG = salaryGrades[currentPosition];

    return (
        <div className="bg-base-100 p-4 rounded-lg">
            <h4 className="font-bold text-base-content mb-4 text-center">Your Career Path</h4>
            <div className="relative pl-6">
                {/* Vertical line */}
                <div className="absolute top-0 bottom-0 left-9 w-0.5 bg-base-300"></div>
                
                {allPositions.map(position => {
                    const positionSG = salaryGrades[position];
                    const isQualified = qualifiedPositions.some((p: any) => p.position === position);
                    const isNextTarget = nextTarget?.position === position;
                    const isCurrent = position === currentPosition;
                    const isIneligible = positionSG > currentSG + 3;

                    let statusIcon = <CircleIcon className="w-5 h-5 text-base-300" />;
                    let statusColor = "text-base-content/60";
                    let statusText = "";

                    if (isCurrent) {
                        statusIcon = <StarIcon className="w-5 h-5 text-yellow-400 fill-current" />;
                        statusColor = "text-yellow-400 font-bold";
                        statusText = "You are here";
                    } else if (isQualified) {
                        statusIcon = <CheckCircleIcon className="w-5 h-5 text-success" />;
                        statusColor = "text-success font-semibold";
                        statusText = "Qualified";
                    } else if (isNextTarget) {
                        statusIcon = <TrendingUpIcon className="w-5 h-5 text-warning" />;
                        statusColor = "text-warning font-semibold";
                        statusText = "Next Target";
                    } else if (isIneligible) {
                        statusColor = "text-base-content/40 italic";
                        statusText = "Beyond 3 SG limit";
                    } else if (positionSG < currentSG) {
                         statusIcon = <CheckCircleIcon className="w-5 h-5 text-base-300" />;
                         statusColor = "text-base-content/40";
                         statusText = "Achieved";
                    }

                    return (
                        <div key={position} className="relative mb-6">
                            <div className="absolute -left-[30px] top-1/2 -translate-y-1/2 bg-base-100 p-1 rounded-full z-10">
                                {statusIcon}
                            </div>
                            <div className={`ml-6 ${statusColor}`}>
                                <p className="font-bold text-base-content">{position}</p>
                                <p className="text-xs">{statusText}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


// Main Component
const CareerProgression: React.FC = () => {
    const [t2t7SchoolYears, setT2T7SchoolYears] = useState(['2022-2023', '2023-2024', '2024-2025']);
    const [t2t7Ratings, setT2T7Ratings] = useState<Record<number, [Rating, Rating, Rating]>>({});
    const [currentPosition, setCurrentPosition] = useState<string>('Teacher I');
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [detailsForPosition, setDetailsForPosition] = useState<string | null>(null);

    const availableSchoolYears = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear - 5; i <= currentYear + 5; i++) {
            years.push(`${i}-${i + 1}`);
        }
        return years;
    }, []);
    
    useEffect(() => {
        const savedState = localStorage.getItem('careerProgressionState');
        if (savedState) {
            try {
                const { 
                    savedT2T7Years, savedT2T7Ratings, 
                    savedPosition 
                } = JSON.parse(savedState);
                if (savedT2T7Years) setT2T7SchoolYears(savedT2T7Years);
                if (savedT2T7Ratings) setT2T7Ratings(savedT2T7Ratings);
                if (savedPosition) setCurrentPosition(savedPosition);
            } catch (e) {
                console.error("Failed to parse career progression state", e);
            }
        }
    }, []);

    useEffect(() => {
        const stateToSave = { 
            savedT2T7Years: t2t7SchoolYears, 
            savedT2T7Ratings: t2t7Ratings,
            savedPosition: currentPosition 
        };
        localStorage.setItem('careerProgressionState', JSON.stringify(stateToSave));
    }, [t2t7SchoolYears, t2t7Ratings, currentPosition]);
    

    const handleResetCalculator = () => {
        setT2T7Ratings({});
        setIsResetConfirmOpen(false);
        toast.success("Calculator has been reset.");
    };

    const hasRatings = Object.keys(t2t7Ratings).length > 0;

    const t2t7UserCounts = useMemo(() => {
        const counts = { coi: { vs: 0, o: 0 }, ncoi: { vs: 0, o: 0 } };
        const latestRatings = new Map<string, { rating: Rating, type: 'COI' | 'NCOI' | null }>();

        for (let yearIndex = 2; yearIndex >= 0; yearIndex--) {
            t2t7Objectives.forEach(obj => {
                const yearData = obj.years[yearIndex];
                const indicator = yearData.indicator;
                if (indicator && indicator !== '8.1' && !latestRatings.has(indicator)) {
                    const rating = t2t7Ratings[obj.objNumber]?.[yearIndex];
                    if (rating === 'O' || rating === 'VS') {
                        latestRatings.set(indicator, { rating, type: yearData.type });
                    }
                }
            });
        }
        
        latestRatings.forEach(({ rating, type }) => {
            if (rating === 'VS') {
                if (type === 'COI') counts.coi.vs++;
                else if (type === 'NCOI') counts.ncoi.vs++;
            } else if (rating === 'O') {
                if (type === 'COI') counts.coi.o++;
                else if (type === 'NCOI') counts.ncoi.o++;
            }
        });
        return counts;
    }, [t2t7Ratings]);
    
    const promotionAnalysis = useMemo(() => {
        const allTargetPositions = Object.keys(promotionRequirements).filter(p => p.startsWith('Teacher '));
        
        const currentSG = salaryGrades[currentPosition];
        if (!currentSG) return { qualifiedPositions: [], nextTarget: null, isCalculated: false };
        
        const eligibleTargetPositions = allTargetPositions.filter(pos => {
            const targetSG = salaryGrades[pos];
            return targetSG > currentSG && targetSG <= currentSG + 3;
        });

        const analysis = eligibleTargetPositions.map(position => {
            const requirements = promotionRequirements[position];
            if (!requirements) return null;

            const targetCoi = parseReqs(requirements.coi);
            const targetNcoi = parseReqs(requirements.ncoi);

            const isCoiQualified = (t2t7UserCounts.coi.vs + t2t7UserCounts.coi.o) >= targetCoi.vs && t2t7UserCounts.coi.o >= targetCoi.o;
            const isNcoiQualified = (t2t7UserCounts.ncoi.vs + t2t7UserCounts.ncoi.o) >= targetNcoi.vs && t2t7UserCounts.ncoi.o >= targetNcoi.o;
            
            return {
                position,
                isQualified: isCoiQualified && isNcoiQualified,
                needs: {
                    coi: { vs: Math.max(0, targetCoi.vs - (t2t7UserCounts.coi.vs + t2t7UserCounts.coi.o)), o: Math.max(0, targetCoi.o - t2t7UserCounts.coi.o) },
                    ncoi: { vs: Math.max(0, targetNcoi.vs - (t2t7UserCounts.ncoi.vs + t2t7UserCounts.ncoi.o)), o: Math.max(0, targetNcoi.o - t2t7UserCounts.ncoi.o) },
                },
            };
        }).filter((item): item is NonNullable<typeof item> => item !== null);

        const qualifiedPositions = analysis.filter(p => p.isQualified);
        const nextTarget = analysis.find(p => !p.isQualified);

        return { qualifiedPositions, nextTarget, isCalculated: true };

    }, [t2t7UserCounts, currentPosition]);
    
    const allTeacherPositions = Object.keys(salaryGrades).filter(p => p.startsWith('Teacher '));

    return (
        <div className="min-h-screen">
            <Header title="Career Progression" />
            <div className="p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left Column: Calculators */}
                    <div className="lg:col-span-3 space-y-6">
                        <GuideSection title="IPCRF Calculator (Teacher II to Teacher VII)" icon={<SparklesIcon className="w-6 h-6 text-primary"/>} startOpen={true}>
                             <div className="flex justify-between items-center mb-4">
                                 <p className="text-sm my-2">Instructions: Encode ratings from your eIPCRF. The calculator automatically considers the latest performance for repeated indicators.</p>
                                <button onClick={() => setIsResetConfirmOpen(true)} className="flex-shrink-0 flex items-center gap-2 text-sm bg-secondary hover:bg-secondary-focus text-white font-semibold py-2 px-3 rounded-lg transition-colors">
                                    <RefreshCwIcon className="w-4 h-4" /> Reset
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-xs my-4 whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-base-300/50">
                                            <th className="border border-base-100 p-1" rowSpan={2}>Objectives</th>
                                            {t2t7SchoolYears.map((year: string, index: number) => (
                                                <th key={year + index} className="border border-base-100 p-1" colSpan={3}>
                                                    <select 
                                                        value={year} 
                                                        onChange={(e) => { 
                                                            const newYears = [...t2t7SchoolYears]; 
                                                            newYears[index] = e.target.value; 
                                                            setT2T7SchoolYears(newYears); 
                                                        }} 
                                                        className="bg-transparent text-center font-bold w-full p-1"
                                                    >
                                                        {availableSchoolYears.map(sy => <option key={sy} value={sy}>{sy}</option>)}
                                                    </select>
                                                </th>
                                            ))}
                                        </tr>
                                        <tr className="bg-base-300/50">
                                            {t2t7SchoolYears.map((_: any, index: React.Key | null | undefined) => (
                                                <React.Fragment key={index}>
                                                    <th className="border border-base-100 p-1 font-normal">COI/NCOI</th>
                                                    <th className="border border-base-100 p-1 font-normal">Indicator</th>
                                                    <th className="border border-base-100 p-1 font-normal">Remarks</th>
                                                </React.Fragment>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {t2t7Objectives.map(obj => (
                                            <tr key={obj.objNumber}>
                                                <td className="border border-base-100 p-1 text-center">{obj.objNumber}</td>
                                                {obj.years.map((yearData, yearIndex) => (
                                                    <React.Fragment key={yearIndex}>
                                                        <td className={`border border-base-100 p-1 text-center ${yearData.indicator ? '' : 'bg-base-300/20'}`}>{yearData.type}</td>
                                                        <td className={`border border-base-100 p-1 text-center ${yearData.indicator ? '' : 'bg-base-300/20'}`}>{yearData.indicator}</td>
                                                        <td className={`border-l border-r border-base-100 p-0 text-center ${yearData.indicator ? '' : 'bg-base-300/20'}`}>
                                                            <select value={t2t7Ratings[obj.objNumber]?.[yearIndex] || ''} onChange={e => { const newRatings = {...t2t7Ratings}; if (!newRatings[obj.objNumber]) newRatings[obj.objNumber] = ['','','']; newRatings[obj.objNumber][yearIndex] = e.target.value as Rating; setT2T7Ratings(newRatings); }} className="bg-base-100 text-base-content border-none w-full h-full text-center p-2 outline-none focus:ring-1 focus:ring-primary rounded-none" disabled={!yearData.indicator}>
                                                                <option className="bg-base-300" value=""></option><option className="bg-base-300" value="O">O</option><option className="bg-base-300" value="VS">VS</option><option className="bg-base-300" value="S">S</option>
                                                            </select>
                                                        </td>
                                                    </React.Fragment>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </GuideSection>
                        <GuideSection title="Promotion Toolkit & Guide" icon={<InfoIcon className="w-6 h-6 text-primary"/>}>
                            <h4>Understanding Key Terms</h4>
                            <ul>
                                <li><strong>PPST:</strong> Philippine Professional Standards for Teachers</li>
                                <li><strong>COI:</strong> Classroom Observable Indicators. These are PPST indicators demonstrated during a classroom observation.</li>
                                <li><strong>NCOI:</strong> Non-Classroom Observable Indicators. These are demonstrated through a portfolio of Means of Verification (MOVs).</li>
                            </ul>
                            <h4>Promotion vs. Reclassification</h4>
                            <ul>
                                <li><strong>Promotion:</strong> Moving up to a vacant higher-level position. This is competitive and depends on available items.</li>
                                <li><strong>Reclassification (Reclass):</strong> Upgrading your current position to a higher level based on your qualifications. This is non-competitive. Most teacher promotions (e.g., Teacher I to Teacher III, or Teacher III to Master Teacher I) are through reclassification.</li>
                            </ul>
                            <h4>The Application Process (Simplified)</h4>
                            <ol>
                                <li><strong>Self-Assessment:</strong> Use the calculators on this page to see if you meet the performance requirements.</li>
                                <li><strong>Prepare Documents:</strong> Gather all required documents (see checklist below). This is the most time-consuming part.</li>
                                <li><strong>Submit to School Head:</strong> Your School Head/Principal will endorse your application.</li>
                                <li><strong>School/District Level Review:</strong> Your documents will be reviewed by the school and then the district's HRMPSB (Human Resource Merit Promotion and Selection Board).</li>
                                <li><strong>Division Level Review:</strong> The SDO (Schools Division Office) will conduct the final evaluation and ranking.</li>
                                <li><strong>Results:</strong> The SDO will release the list of successful applicants.</li>
                            </ol>
                            <h4>Required Documents Checklist</h4>
                            <ul>
                                <li>Letter of Intent</li>
                                <li>Updated Personal Data Sheet (PDS) - CS Form 212</li>
                                <li>Performance Ratings (IPCRF) for the last three (3) rating periods</li>
                                <li>Service Record</li>
                                <li>Transcript of Records (TOR)</li>
                                <li>PRC License and Board Rating</li>
                                <li>Certificates of relevant trainings and seminars</li>
                                <li>Latest payslip</li>
                                <li>Other documents for MOVs (e.g., lesson plans, action research, certificates of recognition)</li>
                            </ul>
                            <h4>Building Your Portfolio (MOVs)</h4>
                            <p>Your portfolio is the evidence of your skills and accomplishments. Organize it neatly and logically, following the order of the PPST indicators if possible.</p>
                            <ul>
                                <li>Use clear labels and tabs for each section.</li>
                                <li>Include a table of contents.</li>
                                <li>Highlight or annotate documents to show how they meet specific indicators.</li>
                                <li>Quality over quantity! Choose your best and most relevant MOVs.</li>
                            </ul>
                        </GuideSection>
                    </div>

                    {/* Right Column: Analysis & Guides */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-base-200 p-6 rounded-xl shadow-lg sticky top-8">
                            <h3 className="text-xl font-bold text-base-content mb-4 flex items-center gap-3"><TrendingUpIcon className="w-6 h-6 text-primary" />Promotion Analysis</h3>
                            <div className="mb-4">
                                <label htmlFor="currentPosition" className="block text-sm font-medium text-base-content mb-1">My Current Position is:</label>
                                <select id="currentPosition" value={currentPosition} onChange={e => setCurrentPosition(e.target.value)} className="w-full bg-base-100 border border-base-300 rounded-md p-2 h-10">
                                    {allTeacherPositions.map(pos => <option key={pos} value={pos}>{pos} (SG {salaryGrades[pos]})</option>)}
                                </select>
                            </div>

                            {hasRatings && (
                                <div className="mb-6 bg-base-100 p-4 rounded-lg">
                                    <h4 className="font-bold text-base-content mb-3 text-center">Performance Summary</h4>
                                    <div className="grid grid-cols-2 gap-4 text-center">
                                        <div className="bg-base-300 p-3 rounded-md">
                                            <p className="text-2xl font-bold text-primary">{t2t7UserCounts.coi.vs + t2t7UserCounts.coi.o}</p>
                                            <p className="text-xs">Proficient COIs (VS or O)</p>
                                        </div>
                                        <div className="bg-base-300 p-3 rounded-md">
                                            <p className="text-2xl font-bold text-primary">{t2t7UserCounts.ncoi.vs + t2t7UserCounts.ncoi.o}</p>
                                            <p className="text-xs">Proficient NCOIs (VS or O)</p>
                                        </div>
                                        <div className="bg-base-300 p-3 rounded-md">
                                            <p className="text-2xl font-bold text-yellow-400">{t2t7UserCounts.coi.o}</p>
                                            <p className="text-xs">Outstanding COIs</p>
                                        </div>
                                        <div className="bg-base-300 p-3 rounded-md">
                                            <p className="text-2xl font-bold text-yellow-400">{t2t7UserCounts.ncoi.o}</p>
                                            <p className="text-xs">Outstanding NCOIs</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                             {hasRatings ? (
                                <div className="space-y-4">
                                    <CareerPathVisualizer allPositions={allTeacherPositions} currentPosition={currentPosition} analysis={promotionAnalysis} />
                                    
                                    {promotionAnalysis.qualifiedPositions.map(p => (
                                        <button key={p.position} onClick={() => setDetailsForPosition(p.position)} className="w-full text-left bg-success/20 p-4 rounded-lg hover:bg-success/30 transition-colors group">
                                            <h4 className="font-bold text-success flex items-center gap-2 text-lg"><CheckCircleIcon />QUALIFIED</h4>
                                            <p className="mt-1">You meet the performance requirements for <strong>{p.position}</strong>.</p>
                                            <p className="text-xs mt-2 text-success/80 group-hover:underline">Click to see full qualifications.</p>
                                        </button>
                                    ))}
                                    {promotionAnalysis.nextTarget ? (
                                        <button onClick={() => setDetailsForPosition(promotionAnalysis.nextTarget!.position)} className="w-full text-left bg-warning/20 p-4 rounded-lg hover:bg-warning/30 transition-colors group">
                                                <h4 className="font-bold text-warning">Next Target: {promotionAnalysis.nextTarget.position}</h4>
                                                <p className="text-sm mt-2">Here's what you need to achieve based on your latest ratings:</p>
                                                <ul className="text-sm list-disc list-inside mt-2 space-y-1 pl-4">
                                                {promotionAnalysis.nextTarget.needs.coi.vs > 0 && <li><strong>{promotionAnalysis.nextTarget.needs.coi.vs}</strong> more COI(s) at Very Satisfactory or higher</li>}
                                                {promotionAnalysis.nextTarget.needs.coi.o > 0 && <li><strong>{promotionAnalysis.nextTarget.needs.coi.o}</strong> more COI(s) at Outstanding</li>}
                                                {promotionAnalysis.nextTarget.needs.ncoi.vs > 0 && <li><strong>{promotionAnalysis.nextTarget.needs.ncoi.vs}</strong> more NCOI(s) at Very Satisfactory or higher</li>}
                                                {promotionAnalysis.nextTarget.needs.ncoi.o > 0 && <li><strong>{promotionAnalysis.nextTarget.needs.ncoi.o}</strong> more NCOI(s) at Outstanding</li>}
                                                </ul>
                                                <p className="text-xs mt-2 text-warning/80 group-hover:underline">Click to see full qualifications.</p>
                                        </button>
                                    ) : (
                                        promotionAnalysis.isCalculated && (
                                                <div className="bg-success/20 p-4 rounded-lg">
                                                <h4 className="font-bold text-success flex items-center gap-2 text-lg"><CheckCircleIcon />All Clear!</h4>
                                                <p className="text-sm mt-1">You meet all performance requirements for all eligible positions within your 3-step salary grade limit!</p>
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : (
                                <div className="text-center p-8 bg-base-100 rounded-lg border-2 border-dashed border-base-300">
                                    <SparklesIcon className="w-12 h-12 mx-auto text-primary/50 mb-3" />
                                    <p className="text-base-content/70">Enter your IPCRF ratings to see your personalized analysis and career path.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmationModal isOpen={isResetConfirmOpen} onClose={() => setIsResetConfirmOpen(false)} onConfirm={handleResetCalculator} title="Reset Calculator?" message="Are you sure you want to clear all entered ratings in this calculator? This action cannot be undone." confirmButtonText="Yes, Reset" />
            <Modal isOpen={!!detailsForPosition} onClose={() => setDetailsForPosition(null)} title={`Qualification Standards for ${detailsForPosition}`} maxWidth="max-w-4xl">
                {detailsForPosition && qualificationsData[detailsForPosition] && (
                    <div className="space-y-6">
                        <div className="bg-base-100 p-4 rounded-lg"><h4 className="font-bold text-lg flex items-center gap-2"><BookIcon className="w-5 h-5 text-primary"/>Education</h4><p className="mt-2 text-base-content/90">{qualificationsData[detailsForPosition].education}</p></div>
                        <div className="bg-base-100 p-4 rounded-lg"><h4 className="font-bold text-lg flex items-center gap-2"><BriefcaseIcon className="w-5 h-5 text-primary"/>Experience</h4><p className="mt-2 text-base-content/90">{qualificationsData[detailsForPosition].experience}</p></div>
                        <div className="bg-base-100 p-4 rounded-lg"><h4 className="font-bold text-lg flex items-center gap-2"><ClipboardListIcon className="w-5 h-5 text-primary"/>Training</h4><p className="mt-2 text-base-content/90">{qualificationsData[detailsForPosition].training}</p></div>
                        <div className="bg-base-100 p-4 rounded-lg"><h4 className="font-bold text-lg flex items-center gap-2"><BadgeCheckIcon className="w-5 h-5 text-primary"/>Eligibility</h4><p className="mt-2 text-base-content/90">{qualificationsData[detailsForPosition].eligibility}</p></div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CareerProgression;