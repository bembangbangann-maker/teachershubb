import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { HomeIcon, UsersIcon, BookOpenIcon, FileTextIcon, NotebookIcon, SettingsIcon, AwardIcon, SparklesIcon, HeartIcon, IdCardIcon, FolderIcon, LockIcon, MailIcon, ClipboardIcon, EyeIcon, EyeOffIcon, InfoIcon, HelpCircleIcon, TargetIcon, ChevronsLeftIcon, ChevronsRightIcon, ListIcon, XIcon, TrendingUpIcon, BriefcaseIcon } from './icons';
import Modal from './Modal';
import { useAppContext } from '../contexts/AppContext';
import { toast } from 'react-hot-toast';

const mainNavLinks = [
  { to: '/', text: 'Dashboard', icon: HomeIcon },
  { to: '/students', text: 'Class Roster', icon: UsersIcon },
  { to: '/grades', text: 'Grading Sheets', icon: BookOpenIcon },
  { to: '/forms', text: 'Official Forms', icon: FileTextIcon },
  { to: '/records', text: 'Anecdotal Records', icon: NotebookIcon },
  { to: '/certificates', text: 'Certificates', icon: IdCardIcon },
  { to: '/honors-calculator', text: 'Honors Calculator', icon: AwardIcon },
  { to: '/lesson-planners', text: 'Lesson Planners', icon: SparklesIcon },
  { to: '/wheel-of-names', text: 'Wheel of Names', icon: TargetIcon },
];

const bottomNavLinks = [
  { to: '/settings', text: 'Settings', icon: SettingsIcon },
  { to: '/tutorials', text: 'On-screen Tutorials', icon: ListIcon },
  { to: '/about', text: 'About', icon: InfoIcon },
];

interface SidebarProps {
    isMobileOpen: boolean;
    onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onClose }) => {
  const { uiState, updateUiState } = useAppContext();
  const { isSidebarCollapsed } = uiState;
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    updateUiState({ isSidebarCollapsed: !isSidebarCollapsed });
  };
  
  const handleLinkClick = () => {
    onClose(); // Close sidebar on mobile after navigation
  };

  const linkClass = "flex items-center px-4 py-3 text-base-content hover:bg-base-100 rounded-lg transition-colors duration-200 group w-full";
  const activeLinkClass = "bg-primary text-primary-content";
  
  const handleUnlock = () => {
    if (password === '08091995') {
        updateUiState({ isResourcesUnlocked: true });
        setIsDonationModalOpen(false);
        setPassword('');
        toast.success("Thank you for your support! Resources unlocked for this session.", { duration: 4000 });
        navigate('/resources');
        onClose();
    } else {
        toast.error("Incorrect password. Please try again.");
        setPassword('');
    }
  };

  const openModal = () => {
    setPassword('');
    setIsPasswordVisible(false);
    setIsDonationModalOpen(true);
    onClose();
  }

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const emailRecipient = 'onlineachievers047@gmail.com';
  const emailSubject = "GCash Donation Receipt Submission";
  const emailBody = "Hello! I've made a donation to support The Teacher's Hub. Please see my attached receipt. Thank you!";
  const mailtoLink = `mailto:${emailRecipient}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;


  return (
    <>
      {isMobileOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} aria-hidden="true"></div>}
      <div className={`bg-base-200 h-screen p-2 flex flex-col fixed inset-y-0 left-0 print-hide transition-transform duration-300 ease-in-out z-50 w-64 ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        
        <div className={`p-4 mb-2 flex items-center gap-3 border-b border-base-content/10 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className={`flex items-center gap-3 ${isSidebarCollapsed && 'lg:justify-center'}`}>
                <BookOpenIcon className="w-8 h-8 text-primary flex-shrink-0" />
                {!isSidebarCollapsed && (
                    <h1 className="text-xl font-bold whitespace-nowrap">
                        <span className="text-white">Teacher's</span>
                        <span className="text-primary"> HUB</span>
                    </h1>
                )}
            </div>
            <button onClick={onClose} className="p-1 lg:hidden">
                <XIcon className="w-6 h-6"/>
            </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto sidebar-nav-scroll space-y-1 p-2">
          <ul>
            {mainNavLinks.map((link) => (
              <li key={link.to} className="mb-1">
                <NavLink
                  to={link.to}
                  onClick={handleLinkClick}
                  className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''} ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}
                  title={isSidebarCollapsed ? link.text : undefined}
                >
                  <link.icon className={`w-5 h-5 flex-shrink-0 ${!isSidebarCollapsed ? 'mr-4' : 'lg:mr-0'}`} />
                  {!isSidebarCollapsed && <span className="font-semibold whitespace-nowrap">{link.text}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
          
          <div className="!my-3 border-t border-base-content/10"></div>
          
          <ul>
            <li className="mb-1">
                {uiState.isResourcesUnlocked ? (
                    <NavLink to="/resources" onClick={handleLinkClick} className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''} ${isSidebarCollapsed ? 'lg:justify-center' : ''}`} title={isSidebarCollapsed ? "Teacher's Resources" : undefined}>
                        <FolderIcon className={`w-5 h-5 flex-shrink-0 ${!isSidebarCollapsed ? 'mr-4' : 'lg:mr-0'}`} />
                        {!isSidebarCollapsed && <span className="font-semibold whitespace-nowrap">Teacher's Resources</span>}
                    </NavLink>
                ) : (
                    <button onClick={openModal} className={`${linkClass} w-full relative ${isSidebarCollapsed ? 'lg:justify-center' : 'justify-start'} ${!isSidebarCollapsed ? 'pr-12' : 'lg:pr-4'}`} title={isSidebarCollapsed ? "Teacher's Resources" : undefined}>
                        <FolderIcon className={`w-5 h-5 flex-shrink-0 ${!isSidebarCollapsed ? 'mr-4' : 'lg:mr-0'}`} />
                        {!isSidebarCollapsed && <span className="font-semibold whitespace-nowrap">Teacher's Resources</span>}
                        <LockIcon className={`w-4 h-4 text-yellow-500 absolute right-4 top-1/2 -translate-y-1/2 ${isSidebarCollapsed && 'lg:hidden'}`}/>
                    </button>
                )}
            </li>
            <li className="mb-1">
                <NavLink
                  to="/career-progression"
                  onClick={handleLinkClick}
                  className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''} ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}
                  title={isSidebarCollapsed ? "Career Progression" : undefined}
                >
                  <TrendingUpIcon className={`w-5 h-5 flex-shrink-0 ${!isSidebarCollapsed ? 'mr-4' : 'lg:mr-0'}`} />
                  {!isSidebarCollapsed && <span className="font-semibold whitespace-nowrap">Career Progression</span>}
                </NavLink>
            </li>
            <li className="mb-1">
                <NavLink
                  to="/my-seminars"
                  onClick={handleLinkClick}
                  className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''} ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}
                  title={isSidebarCollapsed ? "My Seminars" : undefined}
                >
                  <BriefcaseIcon className={`w-5 h-5 flex-shrink-0 ${!isSidebarCollapsed ? 'mr-4' : 'lg:mr-0'}`} />
                  {!isSidebarCollapsed && <span className="font-semibold whitespace-nowrap">My Seminars</span>}
                </NavLink>
            </li>
          </ul>

          <div className="!my-3 border-t border-base-content/10"></div>
          
          <ul>
            {bottomNavLinks.map((link) => (
              <li key={link.to} className="mb-1">
                <NavLink
                  to={link.to}
                  onClick={handleLinkClick}
                  className={({ isActive }) => `${linkClass} ${isActive ? activeLinkClass : ''} ${isSidebarCollapsed ? 'lg:justify-center' : ''}`}
                  title={isSidebarCollapsed ? link.text : undefined}
                >
                  <link.icon className={`w-5 h-5 flex-shrink-0 ${!isSidebarCollapsed ? 'mr-4' : 'lg:mr-0'}`} />
                  {!isSidebarCollapsed && <span className="font-semibold whitespace-nowrap">{link.text}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-2 mt-auto border-t border-base-content/10 hidden lg:block">
            <button onClick={toggleSidebar} title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"} className="w-full flex items-center justify-center p-3 text-base-content hover:bg-base-100 rounded-lg">
                {isSidebarCollapsed ? <ChevronsRightIcon className="w-5 h-5"/> : <ChevronsLeftIcon className="w-5 h-5"/>}
            </button>
        </div>
      </div>

      <Modal isOpen={isDonationModalOpen} onClose={() => setIsDonationModalOpen(false)} title="Support the Hub & Unlock Resources!">
        <div className="text-base-content space-y-4">
            <p>Your support helps keep this tool free and allows for the development of new features. As a <strong className="text-primary">thank you</strong>, supporters get access to the <strong className="text-primary">Teacher's Resources</strong> tab!</p>
            
            <div className="bg-info/10 border-l-4 border-info text-base-content p-4 rounded-r-lg">
                <p className="font-semibold">A Note on AI Features & Costs</p>
                <p className="text-sm mt-1">
                    Many of the app's powerful features, like the DLP/Quiz generators and performance analysis, rely on Google's AI services. These services require API keys that have associated costs to operate. Your donation directly contributes to covering these expenses, ensuring these advanced tools remain functional for everyone. Your support is greatly appreciated!
                </p>
            </div>

            <div className="bg-base-100 p-4 rounded-lg mt-6 space-y-4">
                <div>
                    <h4 className="font-bold text-lg text-base-content mb-2">How to Unlock:</h4>
                    <ol className="list-decimal list-inside space-y-3 text-sm">
                        <li>Send any amount via GCash and save a screenshot of your receipt.
                            <div className="flex flex-col md:flex-row items-center gap-4 bg-base-300 p-4 rounded-md mt-2">
                                <div className="flex-shrink-0 relative group">
                                    <img src="https://storage.googleapis.com/qr-rdg/rdg" alt="GCash QR Code" 
                                        className="w-32 h-32 rounded-lg cursor-pointer transition-opacity group-hover:opacity-70"
                                        onClick={() => setIsQrModalOpen(true)}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        Tap to Zoom
                                    </div>
                                </div>
                                <div className="flex-grow text-sm space-y-2">
                                    <p><strong className="w-28 inline-block">GCash Name:</strong> Sir RDG</p>
                                    <div className="flex items-center gap-2">
                                        <p><strong className="w-28 inline-block">GCash Number:</strong> 09666305404</p>
                                        <button onClick={() => handleCopyToClipboard('09666305404', 'GCash Number')} className="p-1.5 bg-secondary hover:bg-secondary-focus rounded-md text-white">
                                            <ClipboardIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                    <p className="text-xs text-base-content/70 pt-2">Scan the QR code or use the number above to send your support.</p>
                                </div>
                            </div>
                        </li>
                        <li>Email your receipt to us. We will verify it and reply with the password.
                             <a href={mailtoLink} className="w-full mt-2 flex items-center justify-center gap-3 bg-info hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                <MailIcon className="w-5 h-5" />
                                <span>Email Receipt to Get Password</span>
                            </a>
                        </li>
                        <li>Once you have the password, enter it below to unlock the resources for your current session.</li>
                    </ol>
                </div>
                 <div className="pt-2">
                    <label htmlFor="unlock-password" className="block text-sm font-medium text-base-content mb-1">Already have the password?</label>
                    <div className="relative">
                        <input
                            type={isPasswordVisible ? 'text' : 'password'}
                            id="unlock-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-base-300 border border-base-200 rounded-md p-2 h-10 text-center pr-10"
                            placeholder="Enter Password"
                            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                        />
                        <button
                            type="button"
                            onClick={() => setIsPasswordVisible(prev => !prev)}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-base-content/70 hover:text-white"
                            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                        >
                            {isPasswordVisible ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
                <button
                    onClick={handleUnlock}
                    className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary-focus text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg"
                >
                    <LockIcon className="w-5 h-5"/>
                    <span>Unlock Resources</span>
                </button>
            </div>
        </div>
      </Modal>

      <Modal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} title="Scan GCash QR Code">
        <div className="flex justify-center p-1 bg-white rounded-md">
            <img src="https://storage.googleapis.com/qr-rdg/rdg" alt="GCash QR Code" className="w-full h-auto max-w-xl object-contain rounded-md" />
        </div>
      </Modal>
    </>
  );
};

export default Sidebar;