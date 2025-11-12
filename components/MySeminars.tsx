import React, { useState, useMemo } from 'react';
import Header from './Header';
import { useAppContext } from '../contexts/AppContext';
import { ProfessionalDevelopmentLog } from '../types';
import { PlusIcon, BriefcaseIcon, EditIcon, TrashIcon, EyeIcon } from './icons';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';
import SeminarForm from './SeminarForm';
import { toast } from 'react-hot-toast';

const MySeminars: React.FC = () => {
    const { pdLogs, addPdLog, updatePdLog, deletePdLog } = useAppContext();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const [logToEdit, setLogToEdit] = useState<ProfessionalDevelopmentLog | null>(null);
    const [logToDelete, setLogToDelete] = useState<ProfessionalDevelopmentLog | null>(null);
    const [imageToView, setImageToView] = useState<string | null>(null);

    const totalHours = useMemo(() => {
        return pdLogs.reduce((total, log) => total + (log.hours || 0), 0);
    }, [pdLogs]);

    const handleOpenAddModal = () => {
        setLogToEdit(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (log: ProfessionalDevelopmentLog) => {
        setLogToEdit(log);
        setIsFormModalOpen(true);
    };

    const handleSaveLog = (logData: Omit<ProfessionalDevelopmentLog, 'id'>) => {
        if (logToEdit) {
            updatePdLog(logToEdit.id, logData);
            toast.success('Log updated successfully!');
        } else {
            addPdLog(logData);
            toast.success('New log added successfully!');
        }
        setIsFormModalOpen(false);
    };

    const openDeleteConfirmation = (log: ProfessionalDevelopmentLog) => {
        setLogToDelete(log);
        setIsConfirmModalOpen(true);
    };

    const handleDeleteConfirmed = () => {
        if (logToDelete) {
            deletePdLog(logToDelete.id);
            toast.success(`Log "${logToDelete.title}" deleted.`);
        }
        setIsConfirmModalOpen(false);
        setLogToDelete(null);
    };

    const openImageViewer = (imageData: string) => {
        setImageToView(imageData);
        setIsImageViewerOpen(true);
    };

    return (
        <div className="min-h-screen">
            <Header title="My Seminars & Professional Development" />
            <div className="p-4 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div className="bg-base-200 p-4 rounded-lg flex items-center gap-4">
                        <BriefcaseIcon className="w-10 h-10 text-primary flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-lg text-base-content">Total Training Hours</h3>
                            <p className="text-3xl font-bold text-primary">{totalHours}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleOpenAddModal}
                        className="flex-shrink-0 flex items-center bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add New Entry
                    </button>
                </div>
                
                <div className="bg-base-200 rounded-xl shadow-lg overflow-x-auto">
                    <table className="w-full text-sm text-left text-base-content">
                        <thead className="text-xs text-base-content/70 uppercase bg-base-300">
                            <tr>
                                <th scope="col" className="px-6 py-3">Title</th>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3 text-center">Hours</th>
                                <th scope="col" className="px-6 py-3">Type / Level</th>
                                <th scope="col" className="px-6 py-3 text-center">Certificate</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pdLogs.map(log => (
                                <tr key={log.id} className="border-b border-base-300 hover:bg-base-300/50">
                                    <td className="px-6 py-4 font-medium whitespace-nowrap">{log.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(log.dateFrom).toLocaleDateString()} - {new Date(log.dateTo).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-center font-bold">{log.hours}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-primary/20 text-primary text-xs font-semibold px-2 py-1 rounded-full">{log.type}</span>
                                        <span className="bg-secondary/20 text-secondary-content text-xs font-semibold px-2 py-1 rounded-full ml-2">{log.level}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {log.certificateImage ? (
                                            <button onClick={() => openImageViewer(log.certificateImage!)} className="text-primary hover:underline">
                                                <EyeIcon className="w-5 h-5 mx-auto" />
                                            </button>
                                        ) : (
                                            <span className="text-base-content/50">N/A</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <button onClick={() => handleOpenEditModal(log)} className="text-info hover:text-info/80 p-2"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => openDeleteConfirmation(log)} className="text-error hover:text-error/80 p-2"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {pdLogs.length === 0 && (
                        <div className="text-center p-16">
                            <BriefcaseIcon className="w-16 h-16 mx-auto text-primary/50 mb-4" />
                            <h3 className="text-2xl font-bold text-base-content">No Logs Found</h3>
                            <p className="text-base-content mt-2">Click "Add New Entry" to start tracking your professional development.</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={logToEdit ? 'Edit Log Entry' : 'Add New Log Entry'}>
                <SeminarForm 
                    onSave={handleSaveLog} 
                    onClose={() => setIsFormModalOpen(false)} 
                    logToEdit={logToEdit}
                />
            </Modal>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleDeleteConfirmed}
                title="Delete Log Entry"
                message={`Are you sure you want to delete the log for "${logToDelete?.title}"? This action cannot be undone.`}
            />
            
             <Modal isOpen={isImageViewerOpen} onClose={() => setIsImageViewerOpen(false)} title="Certificate Viewer" maxWidth="max-w-4xl">
                {imageToView && <img src={imageToView} alt="Certificate" className="w-full h-auto rounded-lg" />}
            </Modal>
        </div>
    );
};

export default MySeminars;
