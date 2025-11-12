import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import Header from './Header';
import Modal from './Modal';
import { AwardIcon, RefreshCwIcon, UndoIcon, DownloadIcon, UsersIcon, ListIcon, ClockIcon, XIcon } from './icons';
import confetti from 'canvas-confetti';
import { Student } from '../types';
import { toast } from 'react-hot-toast';
import { docxService } from '../services/docxService';

// Sound for when the wheel is spinning - new realistic sound
const SPINNING_SOUND_URL = 'https://storage.googleapis.com/qr-rdg/Spinning%20Prize%20Wheel%20Sound%20Effect-%5BAudioTrimmer.com%5D.mp3';
// Sound for when a winner is selected
const WINNER_SOUND_URL = 'https://storage.googleapis.com/qr-rdg/Wheel%20of%20names%20%5BVqQ0zpbkwfg%5D%20(1)-%5BAudioTrimmer.com%5D.mp3';
// Sound for when the timer hits 10 seconds
const TIMER_BEEP_URL = 'https://storage.googleapis.com/hub-sounds/timer-beep.mp3';
// Sound for when the timer reaches zero
const TIMER_ALARM_URL = 'https://storage.googleapis.com/buzzers/alarm.mp3';

const runFireworks = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // launch from left and right
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
};

const WheelOfNames: React.FC = () => {
    const { students, settings } = useAppContext();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const spinningAudioRef = useRef<HTMLAudioElement | null>(null);
    const winnerAudioRef = useRef<HTMLAudioElement | null>(null);
    const audioUnlocked = useRef(false);
    const hasLoadedState = useRef(false);

    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [participants, setParticipants] = useState<Student[]>([]);
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
    const [pickedStudents, setPickedStudents] = useState<Student[]>([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState<Student | null>(null);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [groupSettings, setGroupSettings] = useState({ count: 2, type: 'groupCount' as 'groupCount' | 'perGroup' });
    const [generatedGroups, setGeneratedGroups] = useState<Student[][]>([]);
    const [groupingTopic, setGroupingTopic] = useState('');
    const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
    const [studentForTimer, setStudentForTimer] = useState<Student | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    
    // Load state from localStorage on initial mount
    useEffect(() => {
        const WHEEL_STATE_KEY = 'teachers_hub_wheel_of_names_state';
        // Only run if students are loaded and we haven't loaded state yet
        if (students.length > 0 && !hasLoadedState.current) {
            try {
                const savedStateJSON = localStorage.getItem(WHEEL_STATE_KEY);
                if (savedStateJSON) {
                    const savedState = JSON.parse(savedStateJSON);
                    const batchExists = savedState.selectedBatchId && students.some(s => s.importBatchId === savedState.selectedBatchId);
                    
                    if (batchExists) {
                        hasLoadedState.current = true; // Set flag to PREVENT the batch change useEffect from resetting state
                        
                        setSelectedBatchId(savedState.selectedBatchId);
                        setParticipants(savedState.participants);
                        setAvailableStudents(savedState.availableStudents);
                        setPickedStudents(savedState.pickedStudents);
                        setGeneratedGroups(savedState.generatedGroups || []);
                        setGroupingTopic(savedState.groupingTopic || '');
                        
                        toast.success("Restored your previous wheel session.");
                    } else {
                        localStorage.removeItem(WHEEL_STATE_KEY);
                    }
                }
            } catch (error) {
                console.error("Failed to load wheel state:", error);
                localStorage.removeItem(WHEEL_STATE_KEY);
            }
        }
    }, [students]);

    // Save state to localStorage on change
    useEffect(() => {
        const WHEEL_STATE_KEY = 'teachers_hub_wheel_of_names_state';
        // Only save if a batch is selected. This automatically happens after state is loaded or user makes a selection.
        if (selectedBatchId) {
            const stateToSave = {
                selectedBatchId,
                participants,
                availableStudents,
                pickedStudents,
                generatedGroups,
                groupingTopic,
            };
            localStorage.setItem(WHEEL_STATE_KEY, JSON.stringify(stateToSave));
        }
    }, [selectedBatchId, participants, availableStudents, pickedStudents, generatedGroups, groupingTopic]);


    useEffect(() => {
        // Programmatically create audio objects for better control and reliability
        const spinningAudio = new Audio(SPINNING_SOUND_URL);
        spinningAudio.loop = true;
        spinningAudio.preload = 'auto';
        spinningAudio.volume = 1.0;
        spinningAudioRef.current = spinningAudio;

        const winnerAudio = new Audio(WINNER_SOUND_URL);
        winnerAudio.preload = 'auto';
        winnerAudio.volume = 1.0;
        winnerAudioRef.current = winnerAudio;

        // Cleanup on component unmount
        return () => {
            if (spinningAudio) {
                spinningAudio.pause();
                spinningAudioRef.current = null;
            }
            if (winnerAudio) {
                winnerAudio.pause();
                winnerAudioRef.current = null;
            }
        };
    }, []);

    const batches = useMemo(() => {
        const batchMap = new Map<string, string>();
        students.forEach(student => {
            if (student.importBatchId && !batchMap.has(student.importBatchId)) {
                const name = (student.gradeLevel && student.section) 
                    ? `${student.gradeLevel} - ${student.section}` 
                    : `Batch from ${student.importFileName}`;
                batchMap.set(student.importBatchId, name);
            }
        });
        return Array.from(batchMap.entries()).map(([id, name]) => ({ id, name }));
    }, [students]);

    // This effect now resets the wheel state ONLY when the user MANUALLY changes the batch in the UI
    useEffect(() => {
        // If state was just loaded, don't do anything. The values are already correct.
        if (hasLoadedState.current) {
            // After the initial load, reset the flag so this effect can run for subsequent manual changes.
            hasLoadedState.current = false;
            return;
        }
    
        if(selectedBatchId) {
            const studentsInBatch = students.filter(s => s.importBatchId === selectedBatchId);
            setAvailableStudents(studentsInBatch);
            setParticipants(studentsInBatch);
            setPickedStudents([]);
            setGeneratedGroups([]);
            setGroupingTopic('');
        } else {
            setAvailableStudents([]);
            setParticipants([]);
            setPickedStudents([]);
            setGeneratedGroups([]);
            setGroupingTopic('');
        }
    }, [selectedBatchId, students]);

    const drawWheel = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
    
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        if (participants.length === 0) {
            ctx.save();
            ctx.fillStyle = '#4A5568';
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = '#D1D5DB';
            ctx.textAlign = 'center';
            ctx.font = '24px sans-serif';
            ctx.fillText('Select a class to load students!', canvas.width / 2, canvas.height / 2);
            ctx.restore();
            return;
        }
    
        const numSegments = participants.length;
        const arcSize = (2 * Math.PI) / numSegments;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = centerX;
        const palette = ['#c0392b', '#e67e22', '#f39c12', '#16a085', '#2980b9', '#8e44ad'];
    
        for (let i = 0; i < numSegments; i++) {
            const angle = i * arcSize;
            ctx.fillStyle = palette[i % palette.length];
    
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, angle, angle + arcSize);
            ctx.closePath();
            ctx.fill();
    
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'white';
            ctx.stroke();
    
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle + arcSize / 2);
            ctx.textAlign = "right";
            ctx.fillStyle = "white";
            
            const fontSize = Math.max(15, Math.min(22, 750 / numSegments));
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.textBaseline = "middle";
            
            const text = `${participants[i].lastName}, ${participants[i].firstName.charAt(0)}.`.toUpperCase();
            
            ctx.fillText(text, radius - 25, 0);
            
            ctx.restore();
        }
    }, [participants]);

    useEffect(() => {
        drawWheel();
    }, [drawWheel]);
    
    const finishSpin = useCallback(() => {
        const audio = spinningAudioRef.current;
        if (audio && !audio.paused) {
            let currentVolume = audio.volume;
            const fadeOutInterval = setInterval(() => {
                if (currentVolume > 0.1) {
                    currentVolume -= 0.1;
                    audio.volume = Math.max(0, currentVolume);
                } else {
                    clearInterval(fadeOutInterval);
                    audio.pause();
                    audio.currentTime = 0;
                    audio.volume = 1.0;
                }
            }, 100);
        }

        const numSegments = participants.length;
        if (numSegments === 0) {
            setIsSpinning(false);
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        // This is the fix for the "quick spin" bug. Reset the transition style.
        canvas.style.transition = 'none';

        const transform = window.getComputedStyle(canvas).transform;
        let currentRotation = 0;
        if (transform !== 'none') {
            const matrix = new DOMMatrix(transform);
            currentRotation = Math.atan2(matrix.b, matrix.a);
        }
        
        const pointerAngle = 0; 
        let winningAngle = pointerAngle - currentRotation;
        
        winningAngle = (winningAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

        const arcSize = (2 * Math.PI) / numSegments;
        const winningSegmentIndex = Math.floor(winningAngle / arcSize);
        const selectedWinner = participants[winningSegmentIndex];
    
        setTimeout(() => {
            if (selectedWinner) {
                winnerAudioRef.current?.play().catch(e => console.error("Winner audio failed:", e));
                setWinner(selectedWinner);
                setPickedStudents(prev => [...prev, selectedWinner]);
                runFireworks();
            }
            setIsSpinning(false);
        }, 1000);
        
    }, [participants]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleTransitionEnd = () => {
            if (isSpinning) {
                finishSpin();
            }
        };

        canvas.addEventListener('transitionend', handleTransitionEnd);
        return () => canvas.removeEventListener('transitionend', handleTransitionEnd);
    }, [isSpinning, finishSpin]);


    const handleSpin = async () => {
        if (isSpinning || participants.length < 2) return;
        
        // "Unlock" audio context on first user gesture to comply with browser autoplay policies
        if (!audioUnlocked.current) {
            try {
                if (spinningAudioRef.current) {
                    spinningAudioRef.current.muted = true;
                    await spinningAudioRef.current.play();
                    spinningAudioRef.current.pause();
                    spinningAudioRef.current.currentTime = 0;
                    spinningAudioRef.current.muted = false;
                }
                if (winnerAudioRef.current) {
                    winnerAudioRef.current.muted = true;
                    await winnerAudioRef.current.play();
                    winnerAudioRef.current.pause();
                    winnerAudioRef.current.currentTime = 0;
                    winnerAudioRef.current.muted = false;
                }
                audioUnlocked.current = true;
            } catch (error) {
                console.warn("Audio unlock failed, playback may not work on first spin.", error);
                // We'll still try to play, but set unlocked to true to not try this again.
                audioUnlocked.current = true; 
            }
        }
        
        setIsSpinning(true);
        setWinner(null);
        if(spinningAudioRef.current) {
            spinningAudioRef.current.volume = 1.0;
            spinningAudioRef.current.currentTime = 0;
            spinningAudioRef.current.play().catch(e => console.error("Spin audio failed:", e));
        }
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const transform = window.getComputedStyle(canvas).transform;
        let currentRotation = 0;
        if (transform !== 'none') {
            const matrix = new DOMMatrix(transform);
            currentRotation = Math.atan2(matrix.b, matrix.a);
        }

        const randomRotations = Math.random() * 5 + 8;
        const newRotation = currentRotation + (randomRotations * 2 * Math.PI);

        const spinDuration = Math.random() * 3 + 5; // Random duration between 5 and 8 seconds
        canvas.style.transition = `transform ${spinDuration}s cubic-bezier(0.1, 0.5, 0.2, 1)`;
        canvas.style.transform = `rotate(${newRotation}rad)`;
    };

    const handleResetWheel = () => {
        setParticipants(availableStudents);
        setPickedStudents([]);
        toast.success("Wheel has been reset with all students.");
        
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.style.transition = 'none';
            canvas.style.transform = 'rotate(0rad)';
        }
    };

    const handleReshuffle = () => {
        if (participants.length < 2) return;
        const shuffled = [...participants].sort(() => 0.5 - Math.random());
        setParticipants(shuffled);
        toast.success("Participants have been reshuffled!");
    };

    const handleUndoLastPick = () => {
        if (pickedStudents.length === 0) return;
        const lastWinner = pickedStudents[pickedStudents.length - 1];
        setPickedStudents(prev => prev.slice(0, -1));
        if (!participants.some(p => p.id === lastWinner.id)) {
            setParticipants(prev => [...prev, lastWinner]);
        }
        toast.success(`${lastWinner.firstName} has been returned to the wheel.`);
    };

    const handleExport = async (type: 'picked' | 'groups') => {
        const studentInfo = students.find(s => s.importBatchId === selectedBatchId);
        const sectionText = studentInfo 
            ? `GRADE ${studentInfo.gradeLevel || ''} - ${(studentInfo.section || '').toUpperCase()}` 
            : '';

        if(type === 'picked' && pickedStudents.length > 0) {
            setIsDownloading(true);
            await docxService.generatePickedStudentsDocx({ pickedStudents, topic: 'Recitation', settings, sectionText });
            setIsDownloading(false);
        } else if (type === 'groups' && generatedGroups.length > 0) {
            setIsDownloading(true);
            await docxService.generateGroupsDocx({ groups: generatedGroups, topic: groupingTopic, settings, sectionText });
            setIsDownloading(false);
        } else {
            toast.error("No data to export.");
        }
    };
    
    const generateGroups = () => {
        const { count, type } = groupSettings;
        if (count < 2) {
            toast.error("Please enter a number greater than 1.");
            return;
        }
        
        const shuffled = [...participants].sort(() => 0.5 - Math.random());
        let groups: Student[][] = [];

        if (type === 'groupCount') {
            for (let i = 0; i < count; i++) groups.push([]);
            shuffled.forEach((student, index) => groups[index % count].push(student));
        } else { // perGroup
            for (let i = 0; i < shuffled.length; i += count) {
                groups.push(shuffled.slice(i, i + count));
            }
        }
        setGeneratedGroups(groups);
    };

    const handleRemoveWinner = () => {
        if (winner) {
            setParticipants(prev => prev.filter(p => p.id !== winner.id));
            toast.success(`${winner.firstName} ${winner.lastName} has been removed from the wheel.`);
        }
        setWinner(null);
    };

    const handleKeepWinner = () => {
        setWinner(null);
    };
    
    const handleStartTimer = () => {
        if (winner) {
            setStudentForTimer(winner);
            setIsTimerModalOpen(true);
            setWinner(null); // Close winner modal
        }
    };

    return (
        <div className="min-h-screen bg-[#2d3748]">
            <Header title="Wheel of Names" />
            
            <div className="p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1 bg-base-200 p-6 rounded-xl shadow-lg space-y-6 self-start text-base-content">
                    <div>
                        <label htmlFor="batch-select" className="text-sm font-medium text-base-content block mb-1">Select Class:</label>
                        <select id="batch-select" value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)} className="w-full bg-base-100 border border-base-300 rounded-md h-10 px-3">
                            <option value="">Select a class...</option>
                            {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>

                     <div>
                        <h3 className="font-bold text-base-content mb-2">Participants ({participants.length})</h3>
                        <div className="bg-base-100 p-2 rounded-md max-h-48 overflow-y-auto text-sm space-y-1">
                            {participants.map(p => <p key={p.id} className="truncate">{p.firstName} {p.lastName}</p>)}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <button onClick={handleResetWheel} className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-3 rounded-lg text-sm"><RefreshCwIcon className="w-4 h-4"/>Reset Wheel</button>
                        <button onClick={handleReshuffle} disabled={participants.length < 2} className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-3 rounded-lg text-sm disabled:opacity-50"><RefreshCwIcon className="w-4 h-4"/>Reshuffle List</button>
                        <button onClick={handleUndoLastPick} disabled={pickedStudents.length === 0} className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-3 rounded-lg text-sm disabled:opacity-50"><UndoIcon className="w-4 h-4"/>Undo Last Pick</button>
                    </div>
                    
                    <div className="pt-4 border-t border-base-300">
                        <h3 className="font-bold text-base-content mb-2 flex justify-between items-center">
                            <span>Picked Students ({pickedStudents.length})</span>
                            <button onClick={() => handleExport('picked')} disabled={isDownloading || pickedStudents.length === 0} title="Export Picked List" className="p-1 text-primary disabled:opacity-50"><DownloadIcon className="w-4 h-4"/></button>
                        </h3>
                        <div className="bg-base-100 p-2 rounded-md max-h-32 overflow-y-auto text-sm space-y-1">
                            {pickedStudents.map((p, i) => <p key={`${p.id}-${i}`} className="truncate">{i + 1}. {p.firstName} {p.lastName}</p>)}
                        </div>
                    </div>
                    
                    <div className="pt-4 border-t border-base-300 space-y-2">
                         <button onClick={() => setIsGroupModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-3 rounded-lg text-sm"><UsersIcon className="w-4 h-4"/>Group Generator</button>
                         <button onClick={() => setIsTimerModalOpen(true)} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 rounded-lg text-sm"><ClockIcon className="w-4 h-4"/>Recitation Timer</button>
                    </div>
                </div>

                {/* Wheel */}
                <div className="lg:col-span-3 flex items-center justify-center">
                    <div className="relative">
                        <div className="absolute top-1/2 right-[-10px] -translate-y-1/2 z-20" style={{
                            width: 0,
                            height: 0,
                            borderTop: '15px solid transparent',
                            borderBottom: '15px solid transparent',
                            borderRight: '25px solid #1abc9c',
                        }}></div>

                        <div className="relative w-[750px] h-[750px]">
                            <canvas 
                                ref={canvasRef} 
                                width="750" 
                                height="750" 
                                className="rounded-full"
                            ></canvas>
                            
                            <button 
                                onClick={handleSpin} 
                                disabled={isSpinning || participants.length < 2} 
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full
                                        bg-[#34495e] border-8 border-[#2c3e50] text-[#1abc9c]
                                        flex items-center justify-center text-5xl font-bold uppercase tracking-widest
                                        shadow-lg transition hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed z-10"
                            >
                                Spin
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {winner && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center">
                    <div className="bg-[#2d3748] rounded-lg shadow-xl w-full max-w-2xl m-4 relative animate-fade-in-up">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4"><h3 className="text-2xl font-bold text-white">Congratulations!</h3></div>
                            <div className="text-center py-8">
                                <AwardIcon className="w-24 h-24 text-yellow-400 mx-auto mb-4"/>
                                <p className="text-lg text-gray-300">The winner is</p>
                                <div className="my-4">
                                    <h2 className="text-5xl font-bold text-teal-400 uppercase leading-tight">{`${winner.firstName} ${winner.middleName || ''}`.trim()}</h2>
                                    <h2 className="text-5xl font-bold text-teal-400 uppercase leading-tight">{winner.lastName}</h2>
                                </div>
                            </div>
                        </div>
                        <div className="bg-base-300/20 p-6 rounded-b-lg">
                            <div className="flex justify-center flex-wrap gap-4">
                                <button onClick={handleStartTimer} className="bg-primary hover:bg-primary-focus text-white font-semibold py-3 px-6 rounded-lg text-base transition-colors flex items-center gap-2"><ClockIcon className="w-5 h-5"/>Start Timer</button>
                                <button onClick={handleRemoveWinner} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg text-base transition-colors">Remove from Wheel</button>
                                <button onClick={handleKeepWinner} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg text-base transition-colors">Keep on Wheel</button>
                            </div>
                        </div>
                    </div>
                    <style>{`@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }`}</style>
                </div>
            )}

            <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title="Group Generator">
                 <div className="space-y-4">
                    <p>Divide the <strong>{participants.length} participants</strong> into groups.</p>
                    <div className="flex items-center gap-4 bg-base-100 p-3 rounded-md">
                        <div className="flex-grow"><label className="flex items-center gap-2"><input type="radio" name="groupType" checked={groupSettings.type === 'groupCount'} onChange={() => setGroupSettings({ ...groupSettings, type: 'groupCount'})} className="radio radio-primary"/> Create</label></div>
                        <input type="number" min="2" value={groupSettings.type === 'groupCount' ? groupSettings.count : ''} onChange={e => setGroupSettings({ ...groupSettings, count: Number(e.target.value) })} disabled={groupSettings.type !== 'groupCount'} className="w-20 bg-base-300 p-2 rounded-md h-10 text-center"/>
                        <div className="flex-grow"><label>groups</label></div>
                    </div>
                     <div className="flex items-center gap-4 bg-base-100 p-3 rounded-md">
                         <div className="flex-grow"><label className="flex items-center gap-2"><input type="radio" name="groupType" checked={groupSettings.type === 'perGroup'} onChange={() => setGroupSettings({ ...groupSettings, type: 'perGroup'})} className="radio radio-primary"/> Put</label></div>
                        <input type="number" min="2" value={groupSettings.type === 'perGroup' ? groupSettings.count : ''} onChange={e => setGroupSettings({ ...groupSettings, count: Number(e.target.value) })} disabled={groupSettings.type !== 'perGroup'} className="w-20 bg-base-300 p-2 rounded-md h-10 text-center"/>
                        <div className="flex-grow"><label>students per group</label></div>
                    </div>
                    <button onClick={generateGroups} className="w-full bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg">Generate Groups</button>
                    {generatedGroups.length > 0 && (
                        <div className="pt-4 border-t border-base-300">
                             <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold">Generated Groups</h4>
                                <button onClick={() => handleExport('groups')} disabled={isDownloading} title="Export Groups" className="p-1 text-primary disabled:opacity-50"><DownloadIcon className="w-5 h-5"/></button>
                            </div>
                            <input type="text" value={groupingTopic} onChange={e => setGroupingTopic(e.target.value)} placeholder="Activity/Topic (optional)" className="w-full bg-base-100 p-2 rounded-md h-10 mb-2 text-sm" />
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                                {generatedGroups.map((group, i) => (
                                    <div key={i} className="bg-base-100 p-3 rounded-md">
                                        <h5 className="font-bold text-primary mb-1">Group {i + 1}</h5>
                                        <ul className="text-sm list-disc list-inside">
                                            {group.map(s => <li key={s.id}>{s.firstName} {s.lastName}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
            </Modal>

            {isTimerModalOpen && <RecitationTimer student={studentForTimer} onClose={() => { setIsTimerModalOpen(false); setStudentForTimer(null); }} />}
        </div>
    );
};

const RecitationTimer: React.FC<{ student: Student | null; onClose: () => void }> = ({ student, onClose }) => {
    const [duration, setDuration] = useState(60);
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isActive, setIsActive] = useState(false);
    const [customMinutes, setCustomMinutes] = useState('');
    const timerIntervalRef = useRef<number | null>(null);
    const audioUnlocked = useRef(false);

    const beepAudio = useMemo(() => {
        const audio = new Audio(TIMER_BEEP_URL);
        audio.volume = 1.0;
        return audio;
    }, []);
    const alarmAudio = useMemo(() => {
        const audio = new Audio(TIMER_ALARM_URL);
        audio.volume = 1.0;
        return audio;
    }, []);

    const stopSounds = useCallback(() => {
        if (!beepAudio.paused) {
            beepAudio.pause();
            beepAudio.currentTime = 0;
        }
        if (!alarmAudio.paused) {
            alarmAudio.pause();
            alarmAudio.currentTime = 0;
        }
    }, [beepAudio, alarmAudio]);

    useEffect(() => {
        // Clear interval on cleanup
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
            stopSounds();
        };
    }, [stopSounds]);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerIntervalRef.current = window.setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft <= 0) {
            if (isActive) {
                alarmAudio.play().catch(e => console.error("Alarm audio failed:", e));
            }
            setIsActive(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
        
        if (isActive && timeLeft === 10) {
            beepAudio.play().catch(e => console.error("Beep audio failed:", e));
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [isActive, timeLeft, alarmAudio, beepAudio]);
    
    useEffect(() => {
        setTimeLeft(duration);
        setIsActive(false);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        stopSounds();
    }, [duration, stopSounds]);

    const handleStartPause = () => {
        // "Unlock" audio context on first user gesture to comply with browser autoplay policies
        if (!audioUnlocked.current) {
            beepAudio.muted = true;
            alarmAudio.muted = true;
            beepAudio.play().then(() => {
                beepAudio.pause();
                beepAudio.currentTime = 0;
                beepAudio.muted = false;
            }).catch(()=>{ beepAudio.muted = false; });
            alarmAudio.play().then(() => {
                alarmAudio.pause();
                alarmAudio.currentTime = 0;
                alarmAudio.muted = false;
            }).catch(()=>{ alarmAudio.muted = false; });
            audioUnlocked.current = true;
        }

        if (isActive) {
            stopSounds();
        }
        setIsActive(!isActive);
    };

    const handleReset = () => {
        setIsActive(false);
        setTimeLeft(duration);
        stopSounds();
    };
    
    const handleSetCustomDuration = () => {
        const minutes = parseInt(customMinutes, 10);
        if (isNaN(minutes) || minutes <= 0) {
            toast.error("Please enter a positive number of minutes.");
            return;
        }
        setDuration(minutes * 60);
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Recitation Timer" maxWidth="max-w-lg">
            <div className="text-center p-8">
                {student && (
                    <div className="mb-6">
                        <p className="text-base-content/70">Now timing:</p>
                        <h3 className="text-3xl font-bold text-base-content">{student.firstName} {student.lastName}</h3>
                    </div>
                )}
                <h1 className={`text-9xl font-mono my-6 transition-colors ${timeLeft <= 10 && timeLeft > 0 ? 'text-error animate-pulse' : 'text-base-content'}`}>
                    {formatTime(timeLeft)}
                </h1>
                <div className="flex justify-center items-center gap-2 my-4 flex-wrap">
                    {[30, 60, 180, 240, 300, 360, 420, 480, 540, 600].map(d => (
                        <button 
                            key={d} 
                            onClick={() => {
                                setDuration(d);
                                setCustomMinutes('');
                            }}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${duration === d && !customMinutes ? 'bg-primary text-white' : 'bg-base-100 hover:bg-base-300'}`}
                        >
                            {d / 60 >= 1 ? `${d / 60}m` : `${d}s`}
                        </button>
                    ))}
                    <div className="flex items-center gap-1">
                        <input 
                            type="number"
                            value={customMinutes}
                            onChange={e => setCustomMinutes(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleSetCustomDuration();
                            }}
                            className="w-24 bg-base-100 border border-base-300 p-2 rounded-md h-10 text-center"
                            placeholder="Custom (min)"
                        />
                        <button onClick={handleSetCustomDuration} className="px-4 py-2 text-sm rounded-lg bg-secondary text-white hover:bg-secondary-focus h-10">Set</button>
                    </div>
                </div>
                <div className="flex justify-center gap-4">
                    <button onClick={handleStartPause} className={`w-32 py-2 rounded-lg font-bold text-white ${isActive ? 'bg-warning' : 'bg-success'}`}>
                        {isActive ? 'Pause' : 'Start'}
                    </button>
                    <button onClick={handleReset} className="w-32 py-2 rounded-lg font-bold bg-secondary text-white">
                        Reset
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes pulse { 50% { opacity: .5; } }
                .animate-pulse { animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>
        </Modal>
    );
};

export default WheelOfNames;
