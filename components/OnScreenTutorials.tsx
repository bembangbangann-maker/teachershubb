import React, { useState, useEffect } from 'react';
import Header from './Header';
import { 
    YoutubeIcon, UsersIcon, BookOpenIcon, AwardIcon, SparklesIcon, TargetIcon, DownloadIcon, 
    UploadIcon, SettingsIcon, ChevronsLeftIcon, ChevronsRightIcon, PlusIcon, FileTextIcon, IdCardIcon,
    ListIcon,
    ChevronDownIcon
} from './icons';

interface GuideSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

const GuideSection: React.FC<GuideSectionProps> = ({ title, icon, children }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-base-200 rounded-lg shadow-md">
            <button
                className="w-full flex justify-between items-center p-5 text-left"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center">
                    {icon}
                    <h3 className="text-xl font-bold text-base-content">{title}</h3>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`}>
                <div className="p-5 border-t border-base-300">
                    {children}
                </div>
            </div>
        </div>
    );
};

const guideSections = [
    {
        name: 'Getting Started',
        tutorials: [
            { 
                id: 'backup', 
                title: 'Backing Up & Restoring Data',
                steps: [
                    { title: 'Go to Settings', description: 'Navigate to the "Settings" page from the sidebar.', image: <SettingsIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Backup Your Data', description: 'In the "Data Management" section, click "Download Backup File". A single file containing all your app data will be saved. Store this file in a safe place!', image: <DownloadIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Restore Your Data', description: 'If you need to restore, click "Restore from File" and select your saved backup file. This will overwrite all current data in the app.', image: <UploadIcon className="w-24 h-24 mx-auto text-primary" /> },
                ] 
            },
        ],
    },
    {
        name: 'Core Features',
        tutorials: [
            { 
                id: 'roster', 
                title: 'Importing Your Class Roster',
                steps: [
                    { title: 'Go to Class Roster', description: 'Navigate to the "Class Roster" page.', image: <UsersIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Click "Import Students"', description: 'Use the "Import Students" button. This will show you the required format for your Word or Excel file.', image: <UploadIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Upload Your File', description: 'Click "Proceed to Upload" and select your class list. The students will be automatically added and grouped into a new batch.', image: <SparklesIcon className="w-24 h-24 mx-auto text-primary" /> },
                ] 
            },
            { 
                id: 'ai-attendance', 
                title: 'Using the AI Attendance Assistant',
                steps: [
                    { title: 'Go to Class Roster', description: 'Navigate to the "Class Roster" page and select a class.', image: <UsersIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Open the Assistant', description: 'Click the "AI Assistant" button to open the command window.', image: <SparklesIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Enter Your Command', description: 'Select the date to update and type a natural language command, like "Mark everyone present" or "Juan Dela Cruz is absent".', image: <FileTextIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Process and Verify', description: 'Click "Process Command". The AI will update the attendance grid for you. Always verify the changes are correct.', image: <SparklesIcon className="w-24 h-24 mx-auto text-primary" /> },
                ] 
            },
            { 
                id: 'grades', 
                title: 'Using the E-Class Record',
                steps: [
                    { title: 'Go to Grading Sheets', description: 'Navigate to the "Grading Sheets" page.', image: <BookOpenIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Select Class and Subject', description: 'Choose your class from the dropdown and type in a subject name (e.g., English).', image: <UsersIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Set Highest Possible Scores', description: 'In the header row of the grid, enter the maximum score for each activity or assessment you conducted.', image: <AwardIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Enter Student Scores', description: 'Type in each student\'s score for the corresponding assessments. All grades and calculations are saved automatically!', image: <SparklesIcon className="w-24 h-24 mx-auto text-primary" /> },
                ] 
            },
            { 
                id: 'forms', 
                title: 'Generating Official Forms (SF2)',
                steps: [
                    { title: 'Go to Official Forms', description: 'Navigate to the "Official Forms" page from the sidebar.', image: <FileTextIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Select the Form', description: 'Click on the form you need to generate, for example, "School Form 2 (SF2)".', image: <FileTextIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Choose Class and Month', description: 'Select the correct class from the dropdown menu and use the arrows to navigate to the desired month.', image: <UsersIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Download the Document', description: 'The form will be automatically filled with data. Click "Download as DOCX" to get the printable, official document.', image: <DownloadIcon className="w-24 h-24 mx-auto text-primary" /> },
                ] 
            },
            { 
                id: 'certificates', 
                title: 'Creating Quarterly Certificates',
                steps: [
                    { title: 'Go to Certificates', description: 'Navigate to the "Certificates" page for quarterly awards.', image: <IdCardIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Select Class and Subject', description: 'Choose the class, subject, and quarter. The app will automatically find all the honor students for you.', image: <BookOpenIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Customize Your Design', description: 'Use the controls on the left to change fonts, backgrounds, content, and signatories to create the perfect certificate.', image: <SettingsIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Generate All as PDF', description: 'Click "Generate PDF" to download a single file containing a personalized certificate for every single honor student in that class.', image: <DownloadIcon className="w-24 h-24 mx-auto text-primary" /> },
                ] 
            },
        ],
    },
    {
        name: 'Generators & Tools',
        tutorials: [
            { 
                id: 'honors', 
                title: 'Calculating Final Honors',
                steps: [
                    { title: 'Go to Honors Calculator', description: 'Navigate to the "Honors Calculator" page.', image: <AwardIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Add Subjects', description: 'Select your class, then add all the subjects needed for the final grade computation.', image: <PlusIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Enter Quarterly Grades', description: 'Using the Q1-Q4 buttons, enter the final transmuted grade for each student in each subject.', image: <BookOpenIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'View Automatic Results', description: 'The tool automatically calculates the General Weighted Average (GWA) and determines the honorific award for each student.', image: <SparklesIcon className="w-24 h-24 mx-auto text-primary" /> },
                ] 
            },
            { 
                id: 'lesson-planners', 
                title: 'Using the AI Lesson Planners',
                steps: [
                    { title: 'Go to Lesson Planners', description: 'Navigate to the "Lesson Planners" page from the sidebar.', image: <SparklesIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Choose a Generator', description: 'Select the type of document you want to create: a Daily Lesson Plan (DLP), a Daily Lesson Log (DLL), or a Quiz.', image: <SparklesIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Fill in the Details', description: 'Provide the AI with the necessary information, such as the grade level, subject, and the specific learning competency or topic.', image: <BookOpenIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Generate and Download', description: 'Click the "Generate" button to create the content. After reviewing the preview, click "Download Word File" to get a formatted document.', image: <DownloadIcon className="w-24 h-24 mx-auto text-primary" /> },
                ] 
            },
            { 
                id: 'wheel', 
                title: 'Using the Wheel of Names',
                steps: [
                    { title: 'Go to Wheel of Names', description: 'Navigate to the "Wheel of Names" page.', image: <TargetIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Select a Class', description: 'Choose your class from the dropdown to load all the students into the wheel.', image: <UsersIcon className="w-24 h-24 mx-auto text-primary" /> },
                    { title: 'Spin the Wheel!', description: 'Click the big "SPIN" button in the center. The wheel will spin and randomly select a student.', image: <SparklesIcon className="w-24 h-24 mx-auto text-primary" /> },
                ] 
            },
        ],
    },
];

const OnScreenTutorials: React.FC = () => {
    const [selectedTutorial, setSelectedTutorial] = useState(guideSections[0].tutorials[0]);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const savedState = localStorage.getItem('tutorialsState');
        if (savedState) {
            try {
                const { tutorialId, step } = JSON.parse(savedState);
                const tutorial = guideSections.flatMap(g => g.tutorials).find(t => t.id === tutorialId);
                if (tutorial) {
                    setSelectedTutorial(tutorial);
                    if (step < tutorial.steps.length) {
                        setCurrentStep(step);
                    }
                }
            } catch (e) {
                console.error("Failed to parse tutorialsState", e);
            }
        }
    }, []);

    useEffect(() => {
        const stateToSave = {
            tutorialId: selectedTutorial.id,
            step: currentStep,
        };
        localStorage.setItem('tutorialsState', JSON.stringify(stateToSave));
    }, [selectedTutorial, currentStep]);

    const handleSelectTutorial = (tutorial: typeof guideSections[0]['tutorials'][0]) => {
        setSelectedTutorial(tutorial);
        setCurrentStep(0);
    };

    const handleNextStep = () => {
        if (currentStep < selectedTutorial.steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };
    
    const handlePrevStep = () => {
        if (currentStep > 0) {
// FIX: The previous step logic was incrementing instead of decrementing.
            setCurrentStep(prev => prev - 1);
        }
    };

    const step = selectedTutorial.steps[currentStep];

    return (
        <div className="min-h-screen">
            <Header title="On-screen Tutorials" />
            <div className="p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Playlist */}
                <div className="lg:col-span-1 bg-base-200 p-4 rounded-xl shadow-lg self-start">
                    <div className="space-y-6">
                        {guideSections.map(category => (
                            <div key={category.name}>
                                <h3 className="text-lg font-bold text-primary mb-3">{category.name}</h3>
                                <ul className="space-y-2">
                                    {category.tutorials.map(tutorial => (
                                        <li key={tutorial.id}>
                                            <button
                                                onClick={() => handleSelectTutorial(tutorial)}
                                                className={`w-full text-left p-3 rounded-md text-sm transition-colors flex items-center gap-3 ${
                                                    selectedTutorial.id === tutorial.id
                                                        ? 'bg-primary text-white font-semibold'
                                                        : 'bg-base-100 hover:bg-base-300 text-base-content'
                                                }`}
                                            >
                                                <ListIcon className="w-5 h-5 flex-shrink-0" />
                                                <span>{tutorial.title}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Player */}
                <div className="lg:col-span-3 bg-base-200 p-6 rounded-xl shadow-lg flex flex-col justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-base-content mb-2">{selectedTutorial.title}</h2>
                        <p className="text-base-content/70 mb-6">Step {currentStep + 1} of {selectedTutorial.steps.length}</p>

                        <div className="text-center p-8 bg-base-100 rounded-lg">
                            <div className="mb-6 h-24 flex items-center justify-center">
                                {step.image}
                            </div>
                            <h3 className="text-2xl font-semibold text-primary mb-2">{step.title}</h3>
                            <p className="text-base-content max-w-lg mx-auto">{step.description}</p>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-6 pt-6 border-t border-base-300">
                        <button 
                            onClick={handlePrevStep} 
                            disabled={currentStep === 0}
                            className="flex items-center gap-2 bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                        >
                            <ChevronsLeftIcon className="w-5 h-5" />
                            Previous
                        </button>
                        <div className="flex items-center gap-2">
                            {selectedTutorial.steps.map((_, index) => (
                                <button 
                                    key={index}
                                    onClick={() => setCurrentStep(index)}
                                    className={`w-3 h-3 rounded-full transition-colors ${index === currentStep ? 'bg-primary' : 'bg-base-300 hover:bg-base-100'}`} 
                                    aria-label={`Go to step ${index + 1}`}
                                />
                            ))}
                        </div>
                        <button 
                            onClick={handleNextStep}
                            disabled={currentStep === selectedTutorial.steps.length - 1}
                            className="flex items-center gap-2 bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                        >
                            Next
                            <ChevronsRightIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnScreenTutorials;