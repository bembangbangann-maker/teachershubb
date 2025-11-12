import React, { useState, useRef } from 'react';
import Header from './Header';
import { SettingsIcon, TrashIcon, PlusIcon, UploadIcon, DatabaseIcon, DownloadIcon } from './icons';
import { useAppContext } from '../contexts/AppContext';
import { SchoolSettings } from '../types';
import { toast } from 'react-hot-toast';
import { ALL_DATA_KEYS } from '../services/dataService';
import ConfirmationModal from './ConfirmationModal';

const InfoInputField = ({ label, name, value, placeholder, onChange }: { label: string; name: keyof SchoolSettings; value: string; placeholder: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }) => (
    <div>
      <label className="block text-sm font-medium text-base-content mb-1">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md py-2 px-3 text-base-content focus:ring-primary focus:border-primary"
        placeholder={placeholder}
      />
    </div>
);

const TextAreaField = ({ label, name, value, placeholder, onChange }: { label: string; name: keyof SchoolSettings; value: string; placeholder: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; }) => (
    <div>
      <label className="block text-sm font-medium text-base-content mb-1">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={2}
        className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md py-2 px-3 text-base-content focus:ring-primary focus:border-primary"
        placeholder={placeholder}
      />
    </div>
);


const Settings: React.FC = () => {
  const { settings, saveSchoolSettings } = useAppContext();
  const [currentSettings, setCurrentSettings] = useState<SchoolSettings>(settings);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [backupFileContent, setBackupFileContent] = useState<string | null>(null);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentSettings(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSectionChange = (id: string, field: 'gradeLevel' | 'sectionName', value: string) => {
    setCurrentSettings(prev => ({
        ...prev,
        sections: prev.sections.map(section => {
            if (section.id === id) {
                return { ...section, [field]: value };
            }
            return section;
        })
    }));
  };

  const handleAddSection = () => {
    const newSection = {
      id: `sec_${Date.now()}`,
      gradeLevel: '',
      sectionName: '',
    };
    setCurrentSettings(prev => ({
        ...prev,
        sections: [...prev.sections, newSection]
    }));
  };

  const handleDeleteSection = (id: string) => {
    setCurrentSettings(prev => ({
        ...prev,
        sections: prev.sections.filter(section => section.id !== id)
    }));
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>, logoType: 'schoolLogo' | 'secondLogo') => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setCurrentSettings(prev => ({ ...prev, [logoType]: reader.result as string }));
        };
        reader.readAsDataURL(file);
    } else if (file) {
        toast.error("Please select a valid image file (PNG, JPG).");
    }
  };

  const handleRemoveLogo = (logoType: 'schoolLogo' | 'secondLogo') => {
    setCurrentSettings(prev => ({ ...prev, [logoType]: '' }));
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>, signatureType: 'teacherSignature' | 'checkerSignature' | 'principalSignature') => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setCurrentSettings(prev => ({ ...prev, [signatureType]: reader.result as string }));
        };
        reader.readAsDataURL(file);
    } else if (file) {
        toast.error("Please select a valid image file (PNG, JPG).");
    }
  };

  const handleRemoveSignature = (signatureType: 'teacherSignature' | 'checkerSignature' | 'principalSignature') => {
    setCurrentSettings(prev => ({ ...prev, [signatureType]: '' }));
  };

  const handleSave = () => {
    saveSchoolSettings(currentSettings);
    toast.success("Settings saved successfully!");
  };
  
  const generateSchoolYears = () => {
      const currentYear = new Date().getFullYear();
      const years = [];
      for (let i = currentYear - 3; i <= currentYear + 5; i++) {
        years.push(`${i}-${i + 1}`);
      }
      return years;
  };

  const handleBackup = () => {
    const backupData: { [key: string]: any } = {};
    ALL_DATA_KEYS.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                backupData[key] = JSON.parse(data);
            } catch (e) {
                console.error(`Could not parse data for key ${key}`, e);
            }
        }
    });
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().split('T')[0];
    a.download = `teachers_hub_backup_${date}.json`;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Backup file downloaded successfully!");
  };

  const handleRestoreFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          setBackupFileContent(content);
          setIsRestoreConfirmOpen(true);
      };
      reader.readAsText(file);

      if (restoreFileInputRef.current) {
          restoreFileInputRef.current.value = '';
      }
  };

  const handleConfirmRestore = () => {
      if (!backupFileContent) {
          toast.error("No backup file content to restore.");
          return;
      }
      try {
          const backupData = JSON.parse(backupFileContent);

          const validKeysInBackup = Object.keys(backupData).filter(key => ALL_DATA_KEYS.includes(key) || key === 'teachers_hub_gemini_api_key');

          if (validKeysInBackup.length === 0) {
              toast.error("Restore failed: The selected file does not appear to be a valid Teacher's Hub backup file.");
              setIsRestoreConfirmOpen(false);
              setBackupFileContent(null);
              return;
          }
          
          ALL_DATA_KEYS.forEach(key => localStorage.removeItem(key));
          localStorage.removeItem('teachers_hub_gemini_api_key');

          validKeysInBackup.forEach(key => {
              localStorage.setItem(key, JSON.stringify(backupData[key]));
          });

          setIsRestoreConfirmOpen(false);
          setBackupFileContent(null);
          toast.success(`Data restored successfully! The app will now reload.`);
          setTimeout(() => { window.location.reload(); }, 1500);
      } catch (error) {
          console.error("Restore error:", error);
          toast.error(error instanceof Error ? error.message : "Failed to parse backup file. Please ensure it is a valid JSON backup file.");
          setIsRestoreConfirmOpen(false);
          setBackupFileContent(null);
      }
  };
  
  const schoolYears = generateSchoolYears();

  return (
    <div className="min-h-screen">
      <Header title="Settings" />
      <div className="p-8">
        <div className="bg-base-200 p-6 rounded-xl shadow-lg max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-base-content flex items-center mb-6">
            <SettingsIcon className="w-7 h-7 mr-3 text-primary" />
            School & Teacher Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoInputField label="Region" name="region" value={currentSettings.region} placeholder="Enter Region..." onChange={handleInputChange} />
            <InfoInputField label="Division" name="division" value={currentSettings.division} placeholder="Enter Division..." onChange={handleInputChange} />
            <InfoInputField label="School Name" name="schoolName" value={currentSettings.schoolName} placeholder="Enter School Name..." onChange={handleInputChange} />
            <InfoInputField label="School ID" name="schoolId" value={currentSettings.schoolId} placeholder="Enter School ID..." onChange={handleInputChange} />
            <div>
              <label className="block text-sm font-medium text-base-content mb-1">School Year</label>
              <select name="schoolYear" value={currentSettings.schoolYear} onChange={handleInputChange} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md py-2 px-3 text-base-content focus:ring-primary focus:border-primary h-[42px]"><option disabled>Select School Year</option>{schoolYears.map(year => (<option key={year} value={year}>{year}</option>))}</select>
            </div>
            <InfoInputField label="Teacher's Name" name="teacherName" value={currentSettings.teacherName || ''} placeholder="Enter Your Name..." onChange={handleInputChange} />
            <InfoInputField label="Coordinator's Name" name="checkedBy" value={currentSettings.checkedBy || ''} placeholder="Enter Coordinator's Name..." onChange={handleInputChange} />
            <TextAreaField label="Coordinator's Designation" name="checkerDesignation" value={currentSettings.checkerDesignation || ''} placeholder={"e.g., Learning Area Coordinator"} onChange={handleInputChange} />
            <InfoInputField label="Principal's Name" name="principalName" value={currentSettings.principalName || ''} placeholder="Enter Principal's Name..." onChange={handleInputChange} />
            <TextAreaField label="Principal's Designation" name="principalDesignation" value={currentSettings.principalDesignation || ''} placeholder={"e.g., School Principal II"} onChange={handleInputChange} />
          </div>

          <div className="mt-8 border-t border-base-300 pt-6">
            <h3 className="text-xl font-bold text-base-content mb-4">My Classes</h3>
            <div className="space-y-4">
              {currentSettings.sections.map((section) => (
                <div key={section.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-base-content mb-1">Grade Level</label><input type="text" value={section.gradeLevel} onChange={(e) => handleSectionChange(section.id, 'gradeLevel', e.target.value)} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary" placeholder="e.g., Grade 9"/></div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-base-content mb-1">Section Name</label><input type="text" value={section.sectionName} onChange={(e) => handleSectionChange(section.id, 'sectionName', e.target.value)} className="mt-1 block w-full bg-base-100 border border-base-300 rounded-md py-2 px-3 focus:ring-primary focus:border-primary" placeholder="e.g., Fairness"/></div>
                  <div className="md:col-span-1"><button onClick={() => handleDeleteSection(section.id)} className="w-full bg-error hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors"><TrashIcon className="w-5 h-5"/></button></div>
                </div>
              ))}
              {currentSettings.sections.length === 0 && (<p className="text-center text-base-content/70 italic py-4">No classes added yet. Click "Add Class" to start.</p>)}
            </div>
            <button onClick={handleAddSection} className="mt-4 flex items-center bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors"><PlusIcon className="w-5 h-5 mr-2" />Add Class</button>
          </div>
          
          <div className="mt-8 border-t border-base-300 pt-6">
             <h3 className="text-xl font-bold text-base-content mb-4">Customization</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div><label className="block text-sm font-medium text-base-content mb-2">Left Logo (e.g., School Seal)</label><div className="flex items-center gap-6"><div className="w-24 h-24 bg-base-100 rounded-md flex items-center justify-center border-2 border-dashed border-base-300">{currentSettings.schoolLogo ? (<img src={currentSettings.schoolLogo} alt="School Logo Preview" className="h-full w-full object-contain rounded-md p-1" />) : (<span className="text-xs text-base-content/50 text-center p-2">No Logo</span>)}</div><div className="flex flex-col gap-2"><input type="file" id="logo-upload" accept="image/png, image/jpeg" className="hidden" onChange={(e) => handleLogoChange(e, 'schoolLogo')}/><label htmlFor="logo-upload" className="cursor-pointer flex items-center justify-center bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors"><UploadIcon className="w-5 h-5 mr-2" />Upload</label>{currentSettings.schoolLogo && (<button onClick={() => handleRemoveLogo('schoolLogo')} className="flex items-center justify-center bg-error hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"><TrashIcon className="w-5 h-5 mr-2" />Remove</button>)}</div></div></div>
                  <div><label className="block text-sm font-medium text-base-content mb-2">Right Logo (e.g., DepEd Logo)</label><div className="flex items-center gap-6"><div className="w-24 h-24 bg-base-100 rounded-md flex items-center justify-center border-2 border-dashed border-base-300">{currentSettings.secondLogo ? (<img src={currentSettings.secondLogo} alt="Second Logo Preview" className="h-full w-full object-contain rounded-md p-1" />) : (<span className="text-xs text-base-content/50 text-center p-2">No Logo</span>)}</div><div className="flex flex-col gap-2"><input type="file" id="second-logo-upload" accept="image/png, image/jpeg" className="hidden" onChange={(e) => handleLogoChange(e, 'secondLogo')}/><label htmlFor="second-logo-upload" className="cursor-pointer flex items-center justify-center bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors"><UploadIcon className="w-5 h-5 mr-2" />Upload</label>{currentSettings.secondLogo && (<button onClick={() => handleRemoveLogo('secondLogo')} className="flex items-center justify-center bg-error hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"><TrashIcon className="w-5 h-5 mr-2" />Remove</button>)}</div></div></div>
              </div>
          </div>

          <div className="mt-8 border-t border-base-300 pt-6">
             <h3 className="text-xl font-bold text-base-content mb-4">E-Signatures</h3>
             <p className="text-sm text-base-content/80 mb-4">Upload transparent PNG images of signatures for best results on certificates.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div><label className="block text-sm font-medium text-base-content mb-2">Teacher's Signature</label><div className="flex items-center gap-6"><div className="w-32 h-16 bg-base-100 rounded-md flex items-center justify-center border-2 border-dashed border-base-300">{currentSettings.teacherSignature ? (<img src={currentSettings.teacherSignature} alt="Teacher Signature Preview" className="h-full w-full object-contain rounded-md p-1" />) : (<span className="text-xs text-base-content/50 text-center p-2">No Signature</span>)}</div><div className="flex flex-col gap-2"><input type="file" id="teacher-sig-upload" accept="image/png" className="hidden" onChange={(e) => handleSignatureChange(e, 'teacherSignature')}/><label htmlFor="teacher-sig-upload" className="cursor-pointer flex items-center justify-center bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">Upload</label>{currentSettings.teacherSignature && (<button onClick={() => handleRemoveSignature('teacherSignature')} className="flex items-center justify-center bg-error hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">Remove</button>)}</div></div></div>
                  <div><label className="block text-sm font-medium text-base-content mb-2">Coordinator's Signature</label><div className="flex items-center gap-6"><div className="w-32 h-16 bg-base-100 rounded-md flex items-center justify-center border-2 border-dashed border-base-300">{currentSettings.checkerSignature ? (<img src={currentSettings.checkerSignature} alt="Checker Signature Preview" className="h-full w-full object-contain rounded-md p-1" />) : (<span className="text-xs text-base-content/50 text-center p-2">No Signature</span>)}</div><div className="flex flex-col gap-2"><input type="file" id="checker-sig-upload" accept="image/png" className="hidden" onChange={(e) => handleSignatureChange(e, 'checkerSignature')}/><label htmlFor="checker-sig-upload" className="cursor-pointer flex items-center justify-center bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">Upload</label>{currentSettings.checkerSignature && (<button onClick={() => handleRemoveSignature('checkerSignature')} className="flex items-center justify-center bg-error hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">Remove</button>)}</div></div></div>
                  <div><label className="block text-sm font-medium text-base-content mb-2">Principal's Signature</label><div className="flex items-center gap-6"><div className="w-32 h-16 bg-base-100 rounded-md flex items-center justify-center border-2 border-dashed border-base-300">{currentSettings.principalSignature ? (<img src={currentSettings.principalSignature} alt="Principal Signature Preview" className="h-full w-full object-contain rounded-md p-1" />) : (<span className="text-xs text-base-content/50 text-center p-2">No Signature</span>)}</div><div className="flex flex-col gap-2"><input type="file" id="principal-sig-upload" accept="image/png" className="hidden" onChange={(e) => handleSignatureChange(e, 'principalSignature')}/><label htmlFor="principal-sig-upload" className="cursor-pointer flex items-center justify-center bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">Upload</label>{currentSettings.principalSignature && (<button onClick={() => handleRemoveSignature('principalSignature')} className="flex items-center justify-center bg-error hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">Remove</button>)}</div></div></div>
              </div>
          </div>

          <div className="mt-8 border-t border-base-300 pt-6">
            <h2 className="text-2xl font-bold text-base-content flex items-center mb-6"><DatabaseIcon className="w-7 h-7 mr-3 text-primary" />Data Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-base-100 p-4 rounded-lg">
              <div><h3 className="font-bold text-base-content">Backup All Data</h3><p className="text-sm text-base-content mt-1 mb-3">Save a complete backup of all your students, grades, settings, and records into a single JSON file. Keep this file in a safe place.</p><button onClick={handleBackup} className="flex items-center bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors"><DownloadIcon className="w-5 h-5 mr-2" />Download Backup File</button></div>
              <div><h3 className="font-bold text-base-content">Restore Data from Backup</h3><p className="text-sm text-base-content mt-1 mb-3">Upload a backup file to restore your application's data.<strong className="text-warning"> This will overwrite all current data.</strong></p><input type="file" ref={restoreFileInputRef} onChange={handleRestoreFileSelect} className="hidden" accept=".json" /><button onClick={() => restoreFileInputRef.current?.click()} className="flex items-center bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg transition-colors"><UploadIcon className="w-5 h-5 mr-2" />Restore from File</button></div>
            </div>
          </div>

          <div className="flex justify-end mt-8 border-t border-base-300 pt-6"><button onClick={handleSave} className="bg-primary hover:bg-primary-focus text-white font-bold py-2 px-6 rounded-lg transition-colors text-lg">Save All Settings</button></div>
        </div>
      </div>
      <ConfirmationModal isOpen={isRestoreConfirmOpen} onClose={() => setIsRestoreConfirmOpen(false)} onConfirm={handleConfirmRestore} title="Confirm Data Restore" message="Are you sure you want to restore data from this file? All current data in the application will be permanently overwritten. This action cannot be undone." confirmButtonText="Yes, Overwrite and Restore" confirmButtonClassName="bg-warning hover:bg-yellow-600"/>
    </div>
  );
};

export default Settings;