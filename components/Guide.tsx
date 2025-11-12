import React, { useState } from 'react';
import Header from './Header';
import { ChevronDownIcon, UsersIcon, BookOpenIcon, FileTextIcon, NotebookIcon, IdCardIcon, AwardIcon, SparklesIcon, SettingsIcon, DownloadIcon } from './icons';

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
        title: 'Class Roster & Attendance',
        icon: <UsersIcon className="w-6 h-6 mr-3 text-primary" />,
        content: (
            <div className="space-y-4 text-base-content/90">
                <p>This is your main hub for managing students and tracking daily attendance.</p>
                <h4 className="font-bold text-base-content">Key Features:</h4>
                <ul className="list-disc list-inside space-y-2 pl-4">
                    <li><strong>Import Students:</strong> Use the "Import Students" button to upload your class list from a <strong>.docx</strong> or <strong>.xlsx</strong> file. The required format is simple: `LASTNAME, FIRSTNAME`. You can also add `MALE` and `FEMALE` headers in your file to automatically set student genders.</li>
                    <li><strong>Take Attendance:</strong> Simply click on a cell in the grid to cycle through attendance statuses: Present (blank) → Late (L) → Absent (A). Changes are saved automatically. Weekends are disabled.</li>
                    <li><strong>Navigate Months:</strong> Use the arrow buttons to move between months.</li>
                    <li><strong>Download Reports:</strong> Export the monthly attendance report as a formatted DOCX or XLSX file using the download buttons.</li>
                    <li><strong>Student Profile:</strong> Click the ID card icon next to a student's name to view their full profile, including a summary of grades, attendance, and anecdotal records.</li>
                </ul>
            </div>
        )
    },
    {
        title: 'Grading Sheets (E-Class Record)',
        icon: <BookOpenIcon className="w-6 h-6 mr-3 text-primary" />,
        content: (
            <div className="space-y-4 text-base-content/90">
                <p>The Grading Sheets tab is a powerful, DepEd-compliant E-Class Record system.</p>
                <h4 className="font-bold text-base-content">How to Use:</h4>
                <ol className="list-decimal list-inside space-y-2 pl-4">
                    <li><strong>Select Class & Subject:</strong> Choose an imported batch and enter a subject name (e.g., "English", "MAPEH").</li>
                    <li><strong>Set Up Components:</strong> In the grid, enter the "Highest Possible Score" for each Written Work (WW), Performance Task (PT), and the Quarterly Assessment (QA).</li>
                    <li><strong>Adjust Weights:</strong> Change the percentage weights for WW, PT, and QA. The app provides smart defaults based on subject (e.g., Science/Math vs. Languages), but you can customize them. Ensure the total is 100%.</li>
                    <li><strong>Enter Scores:</strong> Input student scores for each component. All calculations (PS, WS, Initial Grade, Quarterly Grade) are done automatically in real-time.</li>
                    <li><strong>MAPEH Subjects:</strong> If you enter "MAPEH" as the subject, the view will switch to a tabbed interface for Music, Arts, PE, and Health, including a final summary tab.</li>
                    <li><strong>Views:</strong> Switch between the detailed "E-Class Record", a "Summary of Grades" for the whole year, and a quarterly "Honors" list.</li>
                    <li><strong>Export:</strong> Download a professionally formatted DOCX of your E-Class Record or Summary of Grades.</li>
                </ol>
            </div>
        )
    },
    {
        title: 'Official Forms (SF2)',
        icon: <FileTextIcon className="w-6 h-6 mr-3 text-primary" />,
        content: (
            <div className="space-y-4 text-base-content/90">
                <p>This section automates the generation of official school forms based on the data you've already entered.</p>
                <h4 className="font-bold text-base-content">School Form 2 (SF2):</h4>
                <ul className="list-disc list-inside space-y-2 pl-4">
                    <li>Select "School Form 2" from the menu.</li>
                    <li>Choose the class you want to generate the form for.</li>
                    <li>The form will be automatically filled using the attendance data from the Class Roster tab.</li>
                    <li>Use the arrow buttons to navigate between months.</li>
                    <li>Click "Download as DOCX" to get a printable, formatted SF2 document.</li>
                </ul>
                <p><strong>Note:</strong> Other forms like SF9 and SF10 are planned for future updates!</p>
            </div>
        )
    },
    {
        title: 'Anecdotal & Communication Records',
        icon: <NotebookIcon className="w-6 h-6 mr-3 text-primary" />,
        content: (
            <div className="space-y-4 text-base-content/90">
                <p>Keep track of important student observations and parent communications in one place.</p>
                <h4 className="font-bold text-base-content">Key Features:</h4>
                <ul className="list-disc list-inside space-y-2 pl-4">
                    <li><strong>Two Tabs:</strong> Switch between "Anecdotal Records" for student observations and "Parent Communications" for logging calls, emails, or meetings.</li>
                    <li><strong>Add Records:</strong> Click "Add New Record", select a student, and fill in the details.</li>
                    <li><strong>AI-Powered Rephrasing:</strong> For anecdotal records, use the AI buttons to automatically correct grammar or rephrase your notes into more formal, objective language suitable for official records.</li>
                    <li><strong>Email to Parent:</strong> Quickly send an anecdotal record to a parent. If no email is on file, the app will prompt you to add one, which will be saved to the student's profile.</li>
                </ul>
            </div>
        )
    },
    {
        title: 'Certificate Generator (Quarterly)',
        icon: <IdCardIcon className="w-6 h-6 mr-3 text-primary" />,
        content: (
            <div className="space-y-4 text-base-content/90">
                <p>Create and print beautiful certificates for quarterly academic achievers in any subject.</p>
                <h4 className="font-bold text-base-content">How to Use:</h4>
                <ol className="list-decimal list-inside space-y-2 pl-4">
                    <li><strong>Select Data:</strong> Choose the class, subject, and quarter. The app will automatically identify the honor students based on your Grading Sheets data.</li>
                    <li><strong>Customize:</strong> Use the extensive controls on the left to change the certificate's title, content, font, colors, background, and more. Use the text formatting toolbar to make parts of your text bold, italic, or larger.</li>
                    <li><strong>Preview:</strong> The live preview on the right shows exactly what the certificate will look like. You can select different students from the dropdown to preview their specific certificate.</li>
                    <li><strong>Generate PDF:</strong> Click "Generate PDF" to download a single PDF file containing a personalized certificate for every honor student.</li>
                    <li><strong>Email Certificates:</strong> Use the "Email Center" to send certificates individually. You can customize the email template and the app will help you by downloading the PDF and opening your email client.</li>
                </ol>
            </div>
        )
    },
    {
        title: 'Honors Calculator (Final Honors)',
        icon: <AwardIcon className="w-6 h-6 mr-3 text-primary" />,
        content: (
            <div className="space-y-4 text-base-content/90">
                <p>This powerful tool automates the calculation of final honors based on the General Weighted Average (GWA) across all subjects for the entire school year.</p>
                <h4 className="font-bold text-base-content">How to Use:</h4>
                <ol className="list-decimal list-inside space-y-2 pl-4">
                    <li><strong>Select a Class:</strong> Choose the class you want to calculate final honors for.</li>
                    <li><strong>Add Subjects:</strong> Add all subjects required for the GWA calculation. You can add them one by one or click "Add MAPEH" to add Music, Arts, PE, and Health at once.</li>
                    <li><strong>Enter Quarterly Grades:</strong> Use the "Q1, Q2, Q3, Q4" buttons to switch between quarters and enter the final quarterly grade for each student in each subject. To speed this up, you can copy a column of grades from a spreadsheet and paste it into the first cell of a subject column.</li>
                    <li><strong>Automatic Calculation:</strong> The calculator automatically computes subject averages, the MAPEH average (if applicable), the final GWA, and the honorific remark (e.g., "With High Honors") in real-time. It also validates eligibility (no failing grades).</li>
                    <li><strong>Export & Generate:</strong> Once all grades are entered, you can export a formatted honors list as a DOCX file or proceed to the "Generate Certificates" modal to create and email final honors certificates.</li>
                </ol>
            </div>
        )
    },
    {
        title: 'DLP & Quiz Generator',
        icon: <SparklesIcon className="w-6 h-6 mr-3 text-primary" />,
        content: (
            <div className="space-y-4 text-base-content/90">
                <p>Leverage the power of AI to streamline your lesson planning and assessment creation.</p>
                <h4 className="font-bold text-base-content">DLP Generator:</h4>
                 <ul className="list-disc list-inside space-y-2 pl-4">
                    <li>Fill in all the details for your lesson plan, from teacher name to the specific learning competency and objective.</li>
                    <li>Click "Generate Full DLP". The AI will create a complete, DepEd-formatted Daily Lesson Plan based on your inputs.</li>
                    <li>Review the generated plan in the preview panel.</li>
                    <li>Click "Download Word File" to get a formatted .doc file. <strong>Tip:</strong> Once exported, you can easily edit the document in Microsoft Word to add custom borders or other elements to meet your school's specific requirements.</li>
                </ul>
                <h4 className="font-bold text-base-content mt-4">Quiz Generator:</h4>
                <ol className="list-decimal list-inside space-y-2 pl-4">
                    <li><strong>Fill in Details:</strong> Provide the quiz topic, number of questions, and select a combination of desired quiz formats (e.g., Multiple Choice, Identification).</li>
                    <li><strong>Generate:</strong> Click "Generate Quiz". The AI will create a complete quiz with a title and questions for each format you selected, including activities.</li>
                    <li><strong>Custom Rubrics:</strong> For each generated activity, you can enter a total point value and click "Generate Rubric". The AI will create a custom rubric for that activity that adds up to your specified total.</li>
                    <li><strong>Review & Use:</strong> The generated quiz will appear on the right, organized by section. You can print the quiz directly or download it as a formatted DOCX file with a separate answer key.</li>
                </ol>
            </div>
        )
    },
    {
        title: 'Offline Use & App Installation (PWA)',
        icon: <DownloadIcon className="w-6 h-6 mr-3 text-primary" />,
        content: (
            <div className="space-y-4 text-base-content/90">
                <p>The Teacher's Hub is a <strong className="text-primary">Progressive Web App (PWA)</strong>, which means it can be installed on your device and used offline, just like a native application.</p>
                <h4 className="font-bold text-base-content">Offline Functionality:</h4>
                <ul className="list-disc list-inside space-y-2 pl-4">
                    <li>After your first visit with an internet connection, the entire app is saved on your device.</li>
                    <li>You can open and use the app anytime, anywhere, even without an internet connection. All your data is always accessible as it's stored locally.</li>
                </ul>
                <h4 className="font-bold text-base-content">How to Install the App:</h4>
                <ul className="list-disc list-inside space-y-2 pl-4">
                    <li><strong>Desktop (Chrome, Edge):</strong> Look for an install icon (often a screen with a downward arrow) on the right side of the address bar. Click it to install the app.</li>
                    <li><strong>Android (Chrome):</strong> A prompt to "Add to Home Screen" may appear. If not, tap the three-dot menu and select "Install app".</li>
                    <li><strong>iOS (Safari):</strong> Tap the "Share" icon, then scroll down and select "Add to Home Screen".</li>
                </ul>
                 <h4 className="font-bold text-base-content">Benefits of Installing:</h4>
                <ul className="list-disc list-inside space-y-2 pl-4">
                    <li>Launches in its own dedicated window, not just a browser tab.</li>
                    <li>Get an icon on your desktop or home screen for quick and easy access.</li>
                    <li>Enjoy a faster, more integrated app-like experience.</li>
                </ul>
            </div>
        )
    },
     {
        title: 'Data Management (in Settings)',
        icon: <SettingsIcon className="w-6 h-6 mr-3 text-primary" />,
        content: (
            <div className="space-y-4 text-base-content/90">
                <p className="p-3 bg-warning/20 text-warning rounded-md border border-warning/50"><strong>IMPORTANT:</strong> All your data is stored locally in your browser. It is not saved online. This means your data is private but also at risk if your browser data is cleared.</p>
                <h4 className="font-bold text-base-content">How to Protect Your Data:</h4>
                <ul className="list-disc list-inside space-y-2 pl-4">
                    <li><strong>Backup Your Data:</strong> Go to the "Settings" page and find the "Data Management" section. Click "Download Backup File". This will save a single JSON file containing ALL of your app data. Do this regularly and save the file in a safe place (like Google Drive or a USB stick).</li>
                    <li><strong>Restore Your Data:</strong> If you switch computers or your browser data is lost, you can use the "Restore from File" button. Select the backup file you saved, and all your data will be restored to the app. <strong>This will overwrite any existing data in the app.</strong></li>
                </ul>
            </div>
        )
    }
];

const Guide: React.FC = () => {
    return (
        <div className="min-h-screen">
            <Header title="User Guide" />
            <div className="p-8">
                <div className="max-w-4xl mx-auto space-y-4">
                    {guideSections.map((section, index) => (
                        <GuideSection key={index} title={section.title} icon={section.icon}>
                            {section.content}
                        </GuideSection>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Guide;