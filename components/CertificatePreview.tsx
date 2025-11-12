import React from 'react';
import { Student, SchoolSettings, HonorsCertificateSettings } from '../types';

interface HonorStudentData {
    student: Student;
    generalAvg: number;
    award: string;
}

interface CertificatePreviewProps {
    studentData: HonorStudentData | null; // Allow null to handle empty honor roll
    certificateSettings: HonorsCertificateSettings;
    gradeAndSection: string;
    schoolSettings: SchoolSettings;
}

const FONT_CSS_MAPPING: { [key: string]: string } = {
    'font-playfair': '"Playfair Display", serif',
    'font-merriweather': '"Merriweather", serif',
    'font-great-vibes': '"Great Vibes", cursive',
    'font-dancing-script': '"Dancing Script", cursive',
    'font-lobster': '"Lobster", cursive',
    'font-roboto-slab': '"Roboto Slab", serif',
    'font-alegreya': '"Alegreya", serif',
    'font-cormorant': '"Cormorant Garamond", serif',
    'font-old-standard': '"Old Standard TT", serif',
    'font-sacramento': '"Sacramento", cursive',
    'font-cinzel': '"Cinzel", serif',
    'font-eb-garamond': '"EB Garamond", serif',
    'font-tangerine': '"Tangerine", cursive',
    'font-pinyon-script': '"Pinyon Script", cursive',
    'font-libre-baskerville': '"Libre Baskerville", serif',
    'font-arvo': '"Arvo", serif',
    'font-alex-brush': '"Alex Brush", cursive',
    'font-allura': '"Allura", cursive',
    'font-italianno': '"Italianno", cursive',
    'font-unifrakturcook': '"UnifrakturCook", cursive',
    'font-meddon': '"Meddon", cursive',
    'font-im-fell': '"IM Fell English", serif',
    'font-bookman': '"Bookman Old Style", serif',
};

const backgroundOptions = [
    { id: 'plain', name: 'Plain White', className: 'certificate-bg-plain' }, { id: 'parchment', name: 'Parchment', className: 'certificate-bg-parchment' }, { id: 'gradient', name: 'Subtle Gradient', className: 'certificate-bg-gradient' }, { id: 'border-simple', name: 'Simple Border', className: 'certificate-bg-border-simple' }, { id: 'border-double', name: 'Double Border', className: 'certificate-bg-border-double' }, { id: 'border-elegant', name: 'Elegant Corners', className: 'certificate-bg-border-elegant' }, { id: 'foil-corners', name: 'Foil Corners', className: 'certificate-bg-foil-corners' }, { id: 'floral-border', name: 'Floral Border', className: 'certificate-bg-floral-border' }, { id: 'watermark', name: 'Watermark', className: 'certificate-bg-watermark' }, { id: 'school-emblem', name: 'School Emblem', className: 'certificate-bg-school-emblem' }, { id: 'guilloche', name: 'Guilloche', className: 'certificate-bg-guilloche' }, { id: 'geometric', name: 'Geometric', className: 'certificate-bg-geometric' }, { id: 'dots', name: 'Dotted Pattern', className: 'certificate-bg-dots' }, { id: 'lines', name: 'Hatch Lines', className: 'certificate-bg-lines' }, { id: 'wavy-lines', name: 'Wavy Lines', className: 'certificate-bg-wavy-lines' }, { id: 'confetti', name: 'Confetti', className: 'certificate-bg-confetti' }
];


const parseAdvancedMarkdownToReact = (text: string, baseFontSize: number, studentNameFont: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|##.*?##|\^\^.*?\^\^)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
        if (part.startsWith('##') && part.endsWith('##')) return <span key={index} style={{ fontSize: `${baseFontSize * 1.5}px`, fontWeight: 'bold' }}>{part.slice(2, -2)}</span>;
        if (part.startsWith('^^') && part.endsWith('^^')) return <span key={index} className={studentNameFont} style={{ fontSize: `${baseFontSize * 2.5}px`, fontWeight: 'bold', lineHeight: 1.2, textTransform: 'uppercase' }}>{part.slice(2, -2)}</span>;
        return part;
    });
};

const CertificatePreview = React.forwardRef<HTMLDivElement, CertificatePreviewProps>(
  ({ studentData, certificateSettings, gradeAndSection, schoolSettings }, ref) => {
    const settings = schoolSettings;
    const { title, content, fontFamily, studentNameFontFamily, fontSize, titleFontSize, lineHeight, backgroundStyle, showSchoolLogo, showSecondLogo, showAdviser, showCoordinator, showPrincipal, teacherDesignationType, customTeacherDesignation, verticalPadding } = certificateSettings;

    const getDesignationText = (type: 'subjectTeacher' | 'classAdviser' | 'custom', customText: string) => {
        if (type === 'classAdviser') return 'Class Adviser';
        if (type === 'subjectTeacher') return 'Subject Teacher';
        return customText;
    };
    const adviserDesignation = getDesignationText(teacherDesignationType, customTeacherDesignation);


    const replacePlaceholders = (template: string, studentData: HonorStudentData) => {
        if (!studentData) return template;
        const now = new Date();
        const day = now.getDate();
        const dayWithSuffix = day + (day % 10 == 1 && day != 11 ? 'st' : day % 10 == 2 && day != 12 ? 'nd' : day % 10 == 3 && day != 13 ? 'rd' : 'th');
        const formattedStudentName = `${studentData.student.firstName} ${studentData.student.middleName ? studentData.student.middleName.charAt(0) + '.' : ''} ${studentData.student.lastName}`.toUpperCase();

        return template
            .replace(/\[STUDENT_NAME\]/g, formattedStudentName)
            .replace(/\[GRADE_AND_SECTION\]/g, gradeAndSection)
            .replace(/\[AWARD_TYPE\]/g, studentData.award)
            .replace(/\[GENERAL_AVERAGE\]/g, studentData.generalAvg.toFixed(2))
            .replace(/\[SCHOOL_YEAR\]/g, settings.schoolYear)
            .replace(/\[TEACHER_NAME\]/g, settings.teacherName)
            .replace(/\[SCHOOL_NAME\]/g, settings.schoolName)
            .replace(/\[DAY\]/g, dayWithSuffix)
            .replace(/\[MONTH\]/g, now.toLocaleString('default', { month: 'long' }))
            .replace(/\[YEAR\]/g, now.getFullYear().toString());
    };

    const backgroundClassName = backgroundOptions.find(b => b.id === backgroundStyle)?.className || 'certificate-bg-plain';

    if (!studentData || !settings) {
        return <div className="w-full h-full flex items-center justify-center bg-base-300 rounded-md"><p>No student to preview.</p></div>;
    }
    
    const signatories = [
        showAdviser && { name: schoolSettings.teacherName, designation: adviserDesignation, signature: schoolSettings.teacherSignature },
        showCoordinator && { name: schoolSettings.checkedBy, designation: schoolSettings.checkerDesignation, signature: schoolSettings.checkerSignature },
        showPrincipal && { name: schoolSettings.principalName, designation: schoolSettings.principalDesignation, signature: schoolSettings.principalSignature },
    ].filter((s): s is NonNullable<typeof s> => !!s && s.name.trim() !== '');

    return (
        <div ref={ref} className={`aspect-[297/210] w-full bg-white text-black shadow-2xl rounded-lg overflow-hidden`}>
            <div className={`w-full h-full relative ${fontFamily} ${backgroundClassName}`}>
                <div className="relative z-10 w-full h-full p-8 flex flex-col items-center" style={{ fontSize: `${fontSize}px` }}>
                    <div className="w-full flex justify-center items-center gap-4 text-center" style={{ fontFamily: '"Times New Roman", serif' }}>
                        {showSchoolLogo && settings.schoolLogo ? <img src={settings.schoolLogo} alt="School Logo" className="h-24 w-24 object-contain" /> : <div className="w-24 h-24" />}
                        <div className="flex flex-col gap-1 text-sm">
                            <p>Republic of the Philippines</p>
                            <p className="font-bold">Department of Education</p>
                            <p className="font-bold text-base mt-2">{settings.schoolName.toUpperCase()}</p>
                        </div>
                        {showSecondLogo && settings.secondLogo ? <img src={settings.secondLogo} alt="Second Logo" className="h-24 w-24 object-contain" /> : <div className="w-24 h-24" />}
                    </div>
                    <div className="text-center flex-grow flex flex-col justify-start items-center w-full" style={{ paddingTop: `${verticalPadding}px`, paddingBottom: `${verticalPadding}px` }}>
                        <h1 style={{ fontSize: `${titleFontSize}px`, fontWeight: 'bold', margin: '0' }} className="font-unifrakturcook">{title}</h1>
                        <p className="text-center italic" style={{ fontSize: `${fontSize * 0.9}px`, margin: '0.5rem 0' }}>is given to</p>
                        <div className="whitespace-pre-wrap" style={{ lineHeight: lineHeight }}>
                            {parseAdvancedMarkdownToReact(replacePlaceholders(content, studentData), fontSize, studentNameFontFamily)}
                        </div>
                    </div>
                    <div className={`w-full flex ${signatories.length > 1 ? 'justify-around' : 'justify-center'} items-end pt-4 text-sm`}>
                         {signatories.map((sig, index) => (
                             <div key={index} className="text-center w-1/3 relative">
                                {sig.signature && ( <img src={sig.signature} alt={`${sig.name}'s Signature`} className="h-16 object-contain absolute -top-12 left-1/2 -translate-x-1/2 z-10" style={{width: '10rem'}}/> )}
                                <p className="font-bold pb-1 px-4 border-b-2 border-black uppercase">{sig.name}</p>
                                <div className="pt-1" style={{ whiteSpace: 'pre-wrap' }}>{sig.designation}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default CertificatePreview;