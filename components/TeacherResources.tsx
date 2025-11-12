import React, { useState, useMemo, useEffect } from 'react';
import Header from './Header';
import { useAppContext } from '../contexts/AppContext';
import { LockIcon, HeartIcon, DownloadIcon, FolderIcon, MailIcon } from './icons';
import Modal from './Modal';

const resources = [
    { name: 'Automated SF2 2025-2026', category: 'School Forms & Plans' },
    { name: 'Grade 9 - Action Plan English', category: 'School Forms & Plans' },
    { name: 'Grade 10 - Action Plan English', category: 'School Forms & Plans' },
    { name: 'Grade 10 - DLL English', category: 'School Forms & Plans' },
    { name: 'Grade 10 - DLP English', category: 'School Forms & Plans' },
    { name: 'Grade 10 - Periodical Test English', category: 'School Forms & Plans' },
    { name: 'Intervention Reading Program', category: 'School Forms & Plans' },
    { name: 'Back To School Classroom Orientation', category: 'Classroom Materials' },
    { name: 'Grade 10 - PowerPoint English', category: 'Classroom Materials' },
    { name: 'Parent Teacher Conference 2025-2026', category: 'Classroom Materials' },
    { name: 'Welcome Back To School 2025-2026', category: 'Classroom Materials' },
    { name: 'INTERACTIVE PPT GAMES', category: 'Classroom Materials', link: 'https://drive.google.com/drive/folders/1B1rFnBy9XCTuILr6-714CuBR-hT8Eg2X' },
    { name: 'Campus Journalism Training Kit', category: 'Journalism' },
    { name: 'Column Writing', category: 'Journalism' },
    { name: 'Copy Reading', category: 'Journalism' },
    { name: 'Creative Writing', category: 'Journalism' },
    { name: 'Editorial', category: 'Journalism' },
    { name: 'Feature Writing', category: 'Journalism' },
    { name: 'Journalism Ebooks', category: 'Journalism' },
    { name: 'Journalism Materials', category: 'Journalism' },
    { name: 'News Writing', category: 'Journalism' },
    { name: 'Photo Journalism', category: 'Journalism' },
    { name: 'Science Writing', category: 'Journalism' },
    { name: 'Sports Writing', category: 'Journalism' },
    { name: 'Fluency Table 1 & 2', category: 'Reading & Literacy' },
    { name: 'LIR - Blue Design', category: 'Reading & Literacy' },
    { name: 'LIR - Orange Design', category: 'Reading & Literacy' },
    { name: 'LIR - Rainbow Design', category: 'Reading & Literacy' },
    { name: 'LIR - Red Design', category: 'Reading & Literacy' },
    { name: 'Freebies', category: 'Miscellaneous' },
    { name: 'Video Tutorials', category: 'Miscellaneous' },
    { name: 'Welcome Green Design 2025-2026', category: 'Miscellaneous' },
];

const DOWNLOAD_LINK = "https://drive.google.com/drive/folders/1_Cx8plgIHW2eoa8vKX5rMG7-Su_-tadt?usp=drive_link";

const TeacherResources: React.FC = () => {
    const { uiState } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);

    useEffect(() => {
        const savedTerm = localStorage.getItem('teacherResourcesSearchTerm');
        if (savedTerm) {
            setSearchTerm(savedTerm);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('teacherResourcesSearchTerm', searchTerm);
    }, [searchTerm]);

    const emailRecipient = 'onlineachievers047@gmail.com';
    const emailSubject = "GCash Donation Receipt Submission";
    const emailBody = "Hello! I've made a donation to support The Teacher's Hub. Please see my attached receipt. Thank you!";
    const mailtoLink = `mailto:${emailRecipient}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;


    const filteredAndGroupedResources = useMemo(() => {
        const filtered = resources.filter(r => 
            r.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.reduce((acc, resource) => {
            (acc[resource.category] = acc[resource.category] || []).push(resource);
            return acc;
        }, {} as Record<string, typeof resources>);

    }, [searchTerm]);

    if (!uiState.isResourcesUnlocked) {
        return (
            <>
                <div className="min-h-screen">
                    <Header title="Teacher's Resources" />
                    <div className="p-8 flex items-center justify-center">
                        <div className="max-w-3xl mx-auto">
                            <div className="text-center p-8 bg-base-200 rounded-xl border-2 border-dashed border-base-300">
                                <LockIcon className="w-16 h-16 mx-auto text-primary mb-4" />
                                <h3 className="text-2xl font-bold text-base-content">This Section is Locked</h3>
                                <p className="text-base-content mt-2 mb-6">
                                    Unlock lifetime access to all these downloadable materials and help keep the app free by making a small donation.
                                </p>
                                
                                <div className="bg-base-100 p-6 rounded-lg text-left">
                                    <h4 className="font-bold text-lg text-base-content mb-4 text-center">How to Unlock:</h4>
                                    <div className="flex flex-col md:flex-row items-center gap-6">
                                        <div className="flex-shrink-0 relative group">
                                            <img src="https://storage.googleapis.com/qr-rdg/rdg" alt="GCash QR Code" 
                                                className="w-40 h-40 rounded-lg shadow-lg cursor-pointer transition-opacity group-hover:opacity-70"
                                                onClick={() => setIsQrModalOpen(true)}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                Tap to Zoom
                                            </div>
                                        </div>
                                        <ol className="list-decimal list-inside space-y-4 text-sm flex-grow">
                                            <li>
                                                <strong>Send support via GCash</strong><br/>
                                                Scan the QR code or use the details below.
                                                <div className="mt-2 space-y-1 text-xs bg-base-300 p-3 rounded-md">
                                                    <p><strong className="w-24 inline-block">Name:</strong> Sir RDG</p>
                                                    <p><strong className="w-24 inline-block">Number:</strong> 09666305404</p>
                                                </div>
                                            </li>
                                            <li>
                                                <strong>Email your receipt</strong><br/>
                                                Send a screenshot to us. We will verify it and reply with the password.
                                                <a href={mailtoLink} className="w-full mt-2 flex items-center justify-center gap-2 bg-info hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg transition-colors">
                                                    <MailIcon className="w-4 h-4" />
                                                    <span>Email Receipt to Get Password</span>
                                                </a>
                                            </li>
                                            <li>
                                                <strong>Unlock the resources</strong><br/>
                                                Click "Support Us" on the sidebar to enter the password.
                                            </li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Modal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} title="Scan GCash QR Code">
                    <div className="flex justify-center p-1 bg-white rounded-md">
                        <img src="https://storage.googleapis.com/qr-rdg/rdg" alt="GCash QR Code" className="w-full h-auto max-w-xl object-contain rounded-md" />
                    </div>
                </Modal>
            </>
        );
    }
    
    return (
        <div className="min-h-screen">
            <Header title="Teacher's Resources" />
            <div className="p-8">
                <div className="mb-6 bg-base-200 p-4 rounded-lg flex items-center gap-4">
                    <HeartIcon className="w-10 h-10 text-primary flex-shrink-0" />
                    <div>
                        <h3 className="font-bold text-lg text-base-content">Thank You for Your Support!</h3>
                        <p className="text-sm text-base-content/80">
                            Your contribution helps keep this tool free and growing. As a token of our appreciation, please enjoy these downloadable resources.
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search for a file..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-base-200 border border-base-300 rounded-md h-12 px-4 text-base-content focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div className="space-y-8">
                    {Object.keys(filteredAndGroupedResources).sort().map(category => (
                        <div key={category}>
                            <h2 className="text-xl font-bold text-primary mb-3 flex items-center gap-2">
                                <FolderIcon className="w-6 h-6" />
                                {category}
                            </h2>
                            <div className="bg-base-200 rounded-lg shadow-md divide-y divide-base-300">
                                {filteredAndGroupedResources[category].map(resource => (
                                    <a
                                        key={resource.name}
                                        href={(resource as any).link || DOWNLOAD_LINK}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-4 hover:bg-base-300/50 transition-colors duration-150"
                                    >
                                        <span className="text-base-content">{resource.name}</span>
                                        <DownloadIcon className="w-5 h-5 text-primary flex-shrink-0" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                    {Object.keys(filteredAndGroupedResources).length === 0 && (
                        <p className="text-center py-10 text-base-content/70">No resources found matching your search.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherResources;