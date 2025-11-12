import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import Modal from './components/Modal';
import { BookOpenIcon, XIcon } from './components/icons';

// Eagerly import all page components to remove navigation delay
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Grades from './components/Grades';
import Forms from './components/Forms';
import Records from './components/Records';
import Settings from './components/Settings';
import CertificateGenerator from './components/CertificateGenerator';
import LessonPlanners from './components/LessonPlanners';
import HonorsCalculator from './components/HonorsCalculator';
import TeacherResources from './components/TeacherResources';
import About from './components/About';
import StudentProfilePage from './components/StudentProfilePage';
import WheelOfNames from './components/WheelOfNames';
import OnScreenTutorials from './components/OnScreenTutorials';
import CareerProgression from './components/CareerProgression';
import MySeminars from './components/MySeminars';


const App: React.FC = () => {
    const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
    const [isMobileWarningOpen, setIsMobileWarningOpen] = useState(false);
    const welcomeAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Preload audio
        welcomeAudioRef.current = new Audio('https://storage.googleapis.com/welcome-john/voiceact.mp3');
        
        const hasBeenWelcomed = localStorage.getItem('teachers_hub_welcomed');
        if (!hasBeenWelcomed) {
            setIsWelcomeModalOpen(true);
        }

        // Mobile warning
        const mobileWarningShown = sessionStorage.getItem('mobile_warning_shown');
        if (window.innerWidth < 768 && !mobileWarningShown) {
            setIsMobileWarningOpen(true);
        }
    }, []);

    const handleGetStarted = () => {
      if (welcomeAudioRef.current) {
        welcomeAudioRef.current.play().catch(error => {
            console.warn("Audio playback failed:", error);
            // Proceed even if audio fails
        });
      }
      localStorage.setItem('teachers_hub_welcomed', 'true');
      setIsWelcomeModalOpen(false);
    };

    const handleCloseMobileWarning = () => {
        sessionStorage.setItem('mobile_warning_shown', 'true');
        setIsMobileWarningOpen(false);
    };

    return (
        <AppProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="students" element={<Students />} />
                <Route path="students/:studentId" element={<StudentProfilePage />} />
                <Route path="grades" element={<Grades />} />
                <Route path="forms" element={<Forms />} />
                <Route path="records" element={<Records />} />
                <Route path="certificates" element={<CertificateGenerator />} />
                <Route path="honors-calculator" element={<HonorsCalculator />} />
                <Route path="lesson-planners" element={<LessonPlanners />} />
                <Route path="wheel-of-names" element={<WheelOfNames />} />
                <Route path="resources" element={<TeacherResources />} />
                <Route path="settings" element={<Settings />} />
                <Route path="tutorials" element={<OnScreenTutorials />} />
                <Route path="career-progression" element={<CareerProgression />} />
                <Route path="my-seminars" element={<MySeminars />} />
                <Route path="about" element={<About />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </HashRouter>

           <Modal isOpen={isWelcomeModalOpen} onClose={handleGetStarted} title="Welcome to The Teacher's Hub!">
                <div className="text-center">
                    <BookOpenIcon className="w-16 h-16 text-primary mx-auto mb-4" />
                    <p className="text-lg text-base-content mb-6">
                        Welcome to your digital partner in education. Let's reclaim your time, so you can focus on what truly matters: inspiring your students.
                    </p>
                    <button
                        onClick={handleGetStarted}
                        className="bg-primary hover:bg-primary-focus text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform hover:scale-105"
                    >
                        Start Inspiring
                    </button>
                </div>
            </Modal>
            
            {isMobileWarningOpen && (
                <div 
                    className="fixed bottom-4 left-4 right-4 bg-base-200 text-base-content p-4 rounded-lg shadow-2xl flex items-start sm:items-center justify-between z-50 animate-fade-in-up print-hide"
                    role="alert"
                    aria-live="assertive"
                >
                    <p className="text-sm mr-2">
                        <strong>For the best experience</strong>, please use a laptop or desktop. Some features may not work as expected on mobile.
                    </p>
                    <button 
                        onClick={handleCloseMobileWarning} 
                        className="ml-2 p-1 rounded-full hover:bg-base-300 flex-shrink-0"
                        aria-label="Dismiss mobile warning"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            )}
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.4s ease-out forwards;
                }
            `}</style>
        </AppProvider>
    );
};

export default App;