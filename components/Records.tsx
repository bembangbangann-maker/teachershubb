import React, { useState, useMemo, useEffect } from 'react';
import Header from './Header';
import { NotebookIcon, MessageSquareIcon, PlusIcon, SendIcon, ClipboardIcon } from './icons';
import { Anecdote, CommunicationLog, Student } from '../types';
import Modal from './Modal';
import AnecdoteForm from './AnecdoteForm';
import CommunicationLogForm from './CommunicationLogForm';
import { useAppContext } from '../contexts/AppContext';
import { toast } from 'react-hot-toast';

type ActiveTab = 'anecdotes' | 'communications';

const Records: React.FC = () => {
  const { students, anecdotes, commLogs, settings, addAnecdote, addCommunicationLog, updateStudent } = useAppContext();
  const [activeTab, setActiveTab] = useState<ActiveTab>('anecdotes');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [emailAnecdote, setEmailAnecdote] = useState<Anecdote | null>(null);
  
  const [studentForEmailUpdate, setStudentForEmailUpdate] = useState<{ student: Student; anecdote: Anecdote } | null>(null);
  const [tempEmail, setTempEmail] = useState('');

  useEffect(() => {
    const savedTab = localStorage.getItem('recordsPageActiveTab');
    if (savedTab === 'anecdotes' || savedTab === 'communications') {
        setActiveTab(savedTab as ActiveTab);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('recordsPageActiveTab', activeTab);
  }, [activeTab]);


  const studentMap = useMemo(() => {
    return new Map(students.map(s => [s.id, `${s.lastName}, ${s.firstName}${s.middleName && s.middleName.trim() ? ` ${s.middleName.trim().charAt(0)}.` : ''}`]));
  }, [students]);

  const studentObjectMap = useMemo(() => {
    return new Map(students.map(s => [s.id, s]));
  }, [students]);

  const handleSaveAnecdote = (anecdote: Omit<Anecdote, 'id'>) => {
    addAnecdote(anecdote);
    setIsFormModalOpen(false);
  };
  
  const handleSaveCommLog = (log: Omit<CommunicationLog, 'id'>) => {
    addCommunicationLog(log);
    setIsFormModalOpen(false);
  };

  const isValidEmail = (email?: string): boolean => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  const handleInitiateEmail = (anecdote: Anecdote) => {
    const student = studentObjectMap.get(anecdote.studentId);
    if (!student) {
        toast.error("Could not find the student for this record.");
        return;
    }
    
    if (isValidEmail(student.contactInfo)) {
        setEmailAnecdote(anecdote);
    } else {
        setTempEmail(student.contactInfo || '');
        setStudentForEmailUpdate({ student, anecdote });
    }
  };

  const handleSaveEmailAndProceed = () => {
    if (!studentForEmailUpdate) return;

    if (!isValidEmail(tempEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    
    updateStudent(studentForEmailUpdate.student.id, { contactInfo: tempEmail });
    toast.success("Parent's email has been saved.");

    const anecdoteToPreview = studentForEmailUpdate.anecdote;
    setStudentForEmailUpdate(null);
    setEmailAnecdote(anecdoteToPreview);
  };


  const emailContent = useMemo(() => {
    if (!emailAnecdote) return null;

    // Use the potentially updated student object from the main map
    const student = studentObjectMap.get(emailAnecdote.studentId);
    if (!student?.contactInfo || !isValidEmail(student.contactInfo)) return null;

    const parentEmail = student.contactInfo;
    const studentName = `${student.firstName} ${student.lastName}`;
    const observationDate = new Date(emailAnecdote.date).toLocaleDateString();

    const subject = `Anecdotal Record for ${studentName} (${observationDate})`;
    const body = `Dear Parent/Guardian of ${studentName},\n\nThis is an update from school regarding an observation made on ${observationDate}. Please see the details below.\n\nObservation:\n---\n${emailAnecdote.observation}\n---\n\nIf you have any questions, please feel free to reply to this email.\n\nSincerely,\n${settings.teacherName}`;
    const mailtoLink = `mailto:${parentEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    return { parentEmail, subject, body, mailtoLink };
  }, [emailAnecdote, studentObjectMap, settings.teacherName]);

  const handleCopyToClipboard = (text: string, fieldName: string) => {
      navigator.clipboard.writeText(text);
      toast.success(`${fieldName} copied!`);
  };

  const renderContent = () => {
    if (activeTab === 'anecdotes') {
      return (
         <div className="space-y-6">
          {anecdotes.length > 0 ? anecdotes.map(anecdote => (
            <div key={anecdote.id} className="bg-base-200 p-5 rounded-lg shadow-lg flex flex-col">
              <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-base-content">
                        {studentMap.get(anecdote.studentId) || 'Unknown Student'}
                      </h3>
                      <p className="text-sm text-base-content/70">
                        {new Date(anecdote.date).toLocaleString()}
                      </p>
                    </div>
                    {anecdote.tags.length > 0 && (
                       <div className="flex flex-wrap gap-2">
                        {anecdote.tags.map(tag => (
                          <span key={tag} className="bg-primary/20 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="mt-4 text-base-content whitespace-pre-wrap">{anecdote.observation}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-base-300 flex justify-end items-center">
                  <button
                      onClick={() => handleInitiateEmail(anecdote)}
                      title="Email record to parent"
                      className="flex items-center text-sm font-semibold text-primary hover:text-primary-focus transition-colors"
                  >
                      <SendIcon className="w-4 h-4 mr-2" />
                      <span>Email to Parent</span>
                  </button>
              </div>
            </div>
          )) : (
            <div className="text-center bg-base-200 p-10 rounded-xl shadow-lg">
              <NotebookIcon className="w-16 h-16 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold text-base-content mb-2">No Anecdotal Records Yet</h2>
              <p className="text-base-content">
                Click the "Add New Record" button to document a student observation.
              </p>
            </div>
          )}
        </div>
      );
    }
    
    if (activeTab === 'communications') {
      return (
         <div className="space-y-6">
          {commLogs.length > 0 ? commLogs.map(log => (
            <div key={log.id} className="bg-base-200 p-5 rounded-lg shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-base-content">
                    {studentMap.get(log.studentId) || 'Unknown Student'}
                  </h3>
                   <p className="text-sm text-base-content/70">
                    {new Date(log.date).toLocaleString()}
                  </p>
                </div>
                <span className="bg-secondary text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    {log.method}
                </span>
              </div>
              <p className="mt-4 text-base-content whitespace-pre-wrap">{log.notes}</p>
            </div>
          )) : (
            <div className="text-center bg-base-200 p-10 rounded-xl shadow-lg">
              <MessageSquareIcon className="w-16 h-16 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold text-base-content mb-2">No Communication Logs Yet</h2>
              <p className="text-base-content">
                Click the "Add New Record" button to log a parent communication.
              </p>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Anecdotal Records" />
      <div className="p-4 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex border-b border-base-300 w-full sm:w-auto flex-wrap">
                <TabButton 
                    icon={<NotebookIcon/>} 
                    label="Anecdotal Records" 
                    isActive={activeTab === 'anecdotes'} 
                    onClick={() => setActiveTab('anecdotes')}
                />
                 <TabButton 
                    icon={<MessageSquareIcon/>} 
                    label="Parent Communications" 
                    isActive={activeTab === 'communications'} 
                    onClick={() => setActiveTab('communications')}
                />
            </div>
            <button
                onClick={() => setIsFormModalOpen(true)}
                className="flex-shrink-0 flex items-center bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add New Record
            </button>
        </div>
        
        {renderContent()}

      </div>
      
      <Modal 
        isOpen={isFormModalOpen} 
        onClose={() => setIsFormModalOpen(false)} 
        title={activeTab === 'anecdotes' ? 'New Anecdotal Record' : 'New Communication Log'}
      >
        {activeTab === 'anecdotes' ? (
             <AnecdoteForm
                students={students}
                onSave={handleSaveAnecdote}
                onClose={() => setIsFormModalOpen(false)}
            />
        ) : (
            <CommunicationLogForm 
                students={students}
                onSave={handleSaveCommLog}
                onClose={() => setIsFormModalOpen(false)}
            />
        )}
      </Modal>
      
      <Modal
        isOpen={!!studentForEmailUpdate}
        onClose={() => setStudentForEmailUpdate(null)}
        title={`Update Parent Email for ${studentForEmailUpdate?.student.firstName}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-base-content">
            No valid email is on file for this student. Please enter the parent's email address to proceed. The email will be saved to the student's profile.
          </p>
          <div>
            <label htmlFor="parent-email-update" className="block text-sm font-medium text-base-content mb-1">Parent's Email Address</label>
            <input 
              id="parent-email-update"
              type="email"
              value={tempEmail}
              onChange={e => setTempEmail(e.target.value)}
              placeholder="e.g., parent@email.com"
              className="w-full bg-base-100 border border-base-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-base-300">
            <button onClick={() => setStudentForEmailUpdate(null)} className="bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={handleSaveEmailAndProceed} className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
              Save and Continue
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!emailAnecdote}
        onClose={() => setEmailAnecdote(null)}
        title="Email Anecdotal Record"
      >
        {emailContent ? (
          <div className="space-y-4">
            <p className="text-sm text-base-content">
              Your email client should open automatically. If it doesn't, you can copy the details below and paste them into a new email.
            </p>
            <div className="space-y-3 bg-base-100 p-4 rounded-lg">
                <div>
                    <label className="text-xs font-semibold text-base-content/70">To:</label>
                    <div className="flex items-center gap-2 mt-1">
                        <input type="text" readOnly value={emailContent.parentEmail} className="w-full bg-base-300 border border-base-100 rounded-md py-1 px-2 text-sm"/>
                        <button onClick={() => handleCopyToClipboard(emailContent.parentEmail, 'Email address')} title="Copy Email Address" className="p-2 bg-secondary hover:bg-secondary-focus rounded-md"><ClipboardIcon className="w-4 h-4"/></button>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-base-content/70">Subject:</label>
                    <div className="flex items-center gap-2 mt-1">
                        <input type="text" readOnly value={emailContent.subject} className="w-full bg-base-300 border border-base-100 rounded-md py-1 px-2 text-sm"/>
                        <button onClick={() => handleCopyToClipboard(emailContent.subject, 'Subject')} title="Copy Subject" className="p-2 bg-secondary hover:bg-secondary-focus rounded-md"><ClipboardIcon className="w-4 h-4"/></button>
                    </div>
                </div>
                 <div>
                    <label className="text-xs font-semibold text-base-content/70">Body:</label>
                    <div className="flex items-start gap-2 mt-1">
                        <textarea readOnly value={emailContent.body} rows={8} className="w-full bg-base-300 border border-base-100 rounded-md py-1 px-2 text-sm whitespace-pre-wrap"></textarea>
                        <button onClick={() => handleCopyToClipboard(emailContent.body, 'Body')} title="Copy Body" className="p-2 bg-secondary hover:bg-secondary-focus rounded-md"><ClipboardIcon className="w-4 h-4"/></button>
                    </div>
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-base-300">
                <button onClick={() => setEmailAnecdote(null)} className="bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Close
                </button>
                <a href={emailContent.mailtoLink} className="flex items-center gap-2 bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    <SendIcon className="w-4 h-4"/>
                    Open Email Client
                </a>
            </div>
          </div>
        ) : (
          <div className="text-center p-4">
            <p className="text-error">Could not generate email. The student's email address may be invalid.</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

const TabButton = ({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) => {
    const activeClasses = 'border-primary text-primary';
    const inactiveClasses = 'border-transparent text-base-content/70 hover:text-base-content hover:border-base-content/50';
    return (
         <button onClick={onClick} className={`flex items-center py-3 px-4 border-b-2 font-medium text-sm transition-colors ${isActive ? activeClasses : inactiveClasses}`}>
            <div className="w-5 h-5 mr-2">{icon}</div>
            {label}
        </button>
    )
}

export default Records;