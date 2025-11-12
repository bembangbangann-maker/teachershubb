import React from 'react';
import { SchoolSettings } from '../types';

interface ClassRecordHeaderProps {
    schoolSettings: SchoolSettings;
}

const LogoPlaceholder: React.FC<{ text: string }> = ({ text }) => (
    <div className="h-20 w-20 border-2 border-dashed border-base-300/70 flex items-center justify-center text-xs text-base-content/70 text-center p-2">{text}</div>
);

const ClassRecordHeader: React.FC<ClassRecordHeaderProps> = ({ schoolSettings }) => {
    return (
        <div className="bg-transparent text-base-content p-4">
            {/* Main Header */}
            <div className="flex justify-between items-center mb-4">
                {schoolSettings.schoolLogo ? (
                    <img src={schoolSettings.schoolLogo} alt="School Logo" className="h-20 w-20 object-contain" />
                ) : (
                    <LogoPlaceholder text="School Seal" />
                )}
                <div className="text-center">
                    <h2 className="text-2xl font-bold print-main-title">Class Record</h2>
                    <p className="text-xs print-subtitle">(Pursuant to Deped Order 8, series of 2015)</p>
                </div>
                 {schoolSettings.secondLogo ? (
                     <img src={schoolSettings.secondLogo} alt="Second Logo" className="h-20 w-20 object-contain" />
                ) : (
                    <LogoPlaceholder text="DepEd Logo" />
                )}
            </div>

            {/* Info table - On-screen version */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-px lg:gap-x-2 text-sm print-hide">
                <div className="lg:col-span-5">
                    <div className="flex flex-col sm:flex-row">
                        <div className="border border-base-300 px-2 py-1 h-8 flex items-center w-full sm:w-1/3">
                            <span className="font-bold mr-2 flex-shrink-0">REGION</span>
                            <span className="truncate">{schoolSettings.region || ''}</span>
                        </div>
                        <div className="border border-base-300 px-2 py-1 h-8 flex items-center w-full sm:w-2/3 -mt-px sm:mt-0 sm:-ml-px">
                            <span className="font-bold mr-2 flex-shrink-0">DIVISION</span>
                            <span className="truncate">{schoolSettings.division || ''}</span>
                        </div>
                    </div>
                     <div className="border border-base-300 px-2 py-1 h-8 flex items-center w-full -mt-px">
                        <span className="font-bold mr-2 flex-shrink-0">SCHOOL NAME</span>
                        <span className="truncate">{schoolSettings.schoolName || ''}</span>
                    </div>
                </div>
                <div className="hidden lg:block lg:col-span-1"></div> {/* Spacer */}
                 <div className="lg:col-span-3 -mt-px lg:mt-0">
                    <div className="border border-base-300 px-2 py-1 h-8 flex items-center w-full">
                        <span className="font-bold mr-2 flex-shrink-0">SCHOOL ID</span>
                        <span className="truncate">{schoolSettings.schoolId || ''}</span>
                    </div>
                </div>
                 <div className="lg:col-span-3 -mt-px lg:mt-0">
                    <div className="border border-base-300 px-2 py-1 h-8 flex items-center w-full">
                        <span className="font-bold mr-2 flex-shrink-0">SCHOOL YEAR</span>
                        <span className="truncate">{schoolSettings.schoolYear || ''}</span>
                    </div>
                </div>
            </div>

             {/* Info table - Print version */}
            <table className="w-full text-sm print-only">
                <tbody>
                    <tr>
                        <td className="w-1/4 p-1"><div className="print-header-field"><span className="font-bold">REGION:</span> {schoolSettings.region}</div></td>
                        <td className="w-1/4 p-1"><div className="print-header-field"><span className="font-bold">DIVISION:</span> {schoolSettings.division}</div></td>
                        <td className="w-1/4 p-1"><div className="print-header-field"><span className="font-bold">SCHOOL ID:</span> {schoolSettings.schoolId}</div></td>
                        <td className="w-1/4 p-1"><div className="print-header-field"><span className="font-bold">SCHOOL YEAR:</span> {schoolSettings.schoolYear}</div></td>
                    </tr>
                     <tr>
                        <td className="p-1" colSpan={4}><div className="print-header-field"><span className="font-bold">SCHOOL NAME:</span> {schoolSettings.schoolName}</div></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default ClassRecordHeader;
