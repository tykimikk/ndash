'use client';

import { getPatientById, getPatientNotes, savePatientNote, updatePatientNote, deletePatientNote, deletePatient, getImaging, getLabResults } from '@/lib/supabase';
import type { Patient, PatientNote, ImagingStudy } from '@/types/patient';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import React from 'react';
import { RichTextEditor } from '@/components/RichTextEditor';
import { TreatmentSchema } from '@/components/treatment/TreatmentSchema';
import { supabase } from '@/lib/supabase';
import { LabResultsTable } from '@/components/lab/LabResultsTable';
import { Loader } from '@/components/Loader';

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const unwrappedParams = React.use(params);

  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState<string>('');
  const [quickNoteContent, setQuickNoteContent] = useState<string>('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Imaging state
  const [isAddImageModalOpen, setIsAddImageModalOpen] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<ImagingStudy | null>(null);
  const [newImageData, setNewImageData] = useState({
    type: '',
    findings: '',
    imageUrl: '',
    modelUrl: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [viewingFullModel, setViewingFullModel] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Add state for floating note button
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isNoteButtonRotating, setIsNoteButtonRotating] = useState(false);

  // Add state to detect real device size
  const [windowWidth, setWindowWidth] = useState(0);

  const handleAddNote = async (type: string) => {
    try {
      setIsSavingNote(true);
      // Clear content first before creating a new note
      setNoteContent('');
      
      const newNote = {
        patient_id: unwrappedParams.id,
        type,
        date: new Date().toISOString(),
        content: ''
      };
      
      const savedNote = await savePatientNote(newNote);
      setNotes(prev => [savedNote, ...prev]);
      setSelectedNote(savedNote.id);
      toast.success('New note created');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to create note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    
    try {
      setIsSavingNote(true);
      
      // Find if this is a new or existing note
      const existingNote = notes.find(note => note.id === selectedNote);
      
      if (existingNote) {
        // Debug logs for saving note
        console.log('Saving note:', selectedNote);
        console.log('Content before saving:', noteContent);
        
        // Update existing note
        const response = await updatePatientNote(selectedNote, noteContent);
        console.log('Update response:', response);
        
        // Update local state
        setNotes(prev => prev.map(note => 
          note.id === selectedNote 
            ? { ...note, content: noteContent, updated_at: new Date().toISOString() }
            : note
        ));
      }
      
      toast.success('Note saved successfully');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote) return;
    
    try {
      setIsSavingNote(true);
      
      // Delete note from database
      await deletePatientNote(selectedNote);
      
      // Update local state
      setNotes(prev => prev.filter(note => note.id !== selectedNote));
      setSelectedNote(null);
      setNoteContent('');
      toast.success('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    } finally {
      setIsSavingNote(false);
    }
  };

  useEffect(() => {
    async function loadPatient() {
      try {
        const data = await getPatientById(unwrappedParams.id);
        if (!data) {
          toast.error('Patient not found');
          router.push('/dashboard');
          return;
        }
        setPatient(data);
        
        // Load patient notes
        try {
          console.log('Attempting to load notes for patient:', unwrappedParams.id);
          const patientNotes = await getPatientNotes(unwrappedParams.id);
          console.log('Notes loaded:', patientNotes.length);
          
          // Debug note content
          patientNotes.forEach((note, index) => {
            console.log(`Note ${index + 1} (${note.id}) content:`, 
              note.content ? `Content exists (${note.content.length} chars)` : 'No content', 
              'Type:', note.type);
          });
          
          setNotes(patientNotes);
        } catch (noteError) {
          console.error('Error loading notes:', noteError);
          // Don't let notes error break the whole page
          setNotes([]);
        }

        // Load patient imaging
        try {
          const imagingData = await getImaging(unwrappedParams.id);
          if (imagingData.length > 0) {
            // Update the patient object with the imaging data
            setPatient(prevPatient => {
              if (!prevPatient) return data;
              return {
                ...prevPatient,
                imaging: imagingData
              };
            });
          }
        } catch (imagingError) {
          console.error('Error loading imaging:', imagingError);
        }

        // Load patient lab results
        try {
          const labResults = await getLabResults(unwrappedParams.id);
          if (labResults.length > 0) {
            // Update the patient object with the lab results
            setPatient(prevPatient => {
              if (!prevPatient) return data;
              return {
                ...prevPatient,
                lab_results: labResults
              };
            });
          }
        } catch (labError) {
          console.error('Error loading lab results:', labError);
        }

      } catch (error) {
        console.error('Error loading patient:', error);
        toast.error('Failed to load patient');
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    }

    loadPatient();
  }, [unwrappedParams.id, router]);

  // Handle note selection - make sure to clear or set content properly
  useEffect(() => {
    if (selectedNote) {
      const note = notes.find(n => n.id === selectedNote);
      if (note) {
        console.log('Setting note content from selection:', note.id);
        console.log('Content length:', note.content ? note.content.length : 0);
        setNoteContent(note.content || '');
      }
    } else {
      console.log('Clearing note content - no selection');
      setNoteContent('');
    }
  }, [selectedNote, notes]);

  const handleEdit = () => {
    router.push(`/dashboard/patients/${unwrappedParams.id}/edit`);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this patient? This action cannot be undone.');
    if (!confirmed) return;
    
    try {
      setIsLoading(true);
      await deletePatient(unwrappedParams.id);
      toast.success('Patient deleted successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error('Failed to delete patient');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  const tabs = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'treatment', label: 'Treatment Schema' },
    { id: 'records', label: 'Records' },
    { id: 'labs', label: 'Laboratory Tests' },
    { id: 'imaging', label: 'Imaging' },
  ];

  const handleAddImageClick = (type: string) => {
    setSelectedImageType(type);
    setNewImageData({
      type: type,
      findings: '',
      imageUrl: '',
      modelUrl: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsAddImageModalOpen(true);
  };

  const handleImageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patient) return;

    try {
      // Create a new imaging record directly in the database
      toast.success(`Adding ${newImageData.type} image`);

      // Create the new imaging study object
      const newImaging = {
        patient_id: patient.id,
        type: newImageData.type,
        findings: newImageData.findings,
        date: newImageData.date,
        core: newImageData.imageUrl || null,
        mismatch: newImageData.modelUrl || null
      };

      console.log("Attempting to insert imaging record:", newImaging);

      // Directly insert into supabase
      try {
        const { data, error } = await supabase
          .from('imaging')
          .insert([newImaging])
          .select()
          .single();

        if (error) {
          console.error('Supabase error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw new Error(`Database error: ${error.message}`);
        }

        console.log("Successfully added imaging record:", data);

        // Update local state with the new imaging
        setPatient(prevPatient => {
          if (!prevPatient) return null;
          return {
            ...prevPatient,
            imaging: [...(prevPatient.imaging || []), data]
          };
        });

        setIsAddImageModalOpen(false);

        toast.success('Image added successfully');
      } catch (dbError) {
        console.error('Database operation error:', dbError);
        throw new Error(`Database operation failed: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`);
      }
    } catch (error) {
      console.error('Error adding image:', error);
      toast.error(`Failed to add image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSelectImage = (img: ImagingStudy) => {
    setSelectedImage(img);
  };

  // Update the useEffect for responsive behavior with window width tracking
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768;
      setWindowWidth(window.innerWidth);

      // Auto-collapse sidebar on mobile
      if (isMobileView) {
        setSidebarVisible(false);
      } else if (!sidebarVisible && !viewingFullModel) {
        // Auto-expand on desktop if not viewing full model
        setSidebarVisible(true);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarVisible, viewingFullModel]);

  // Add handler for floating note button
  const handleNoteButtonClick = () => {
    setIsNoteButtonRotating(true);
    
    // Check for existing quick note from today
    const today = new Date().toISOString().split('T')[0];
    const existingNote = notes.find(note => 
      note.type === 'quick' && 
      new Date(note.date).toISOString().split('T')[0] === today
    );

    if (existingNote) {
      // If there's an existing note from today, open it
      setQuickNoteContent(existingNote.content || '');
    } else {
      // If no note exists for today, clear the content for a new note
      setQuickNoteContent('');
    }

    setTimeout(() => {
      setIsNoteModalOpen(!isNoteModalOpen);
      setIsNoteButtonRotating(false);
    }, 300);
  };

  // Add handler for quick note save
  const handleQuickNoteSave = async () => {
    if (!quickNoteContent.trim()) return;
    
    try {
      setIsSavingNote(true);
      
      // Check if we're updating an existing note or creating a new one
      const today = new Date().toISOString().split('T')[0];
      const existingNote = notes.find(note => 
        note.type === 'quick' && 
        new Date(note.date).toISOString().split('T')[0] === today
      );

      if (existingNote) {
        // Update existing note
        await updatePatientNote(existingNote.id, quickNoteContent);
        setNotes(prev => prev.map(note => 
          note.id === existingNote.id 
            ? { ...note, content: quickNoteContent, updated_at: new Date().toISOString() }
            : note
        ));
      } else {
        // Create new note
        const newNote = {
          patient_id: unwrappedParams.id,
          type: 'quick',
          date: new Date().toISOString(),
          content: quickNoteContent
        };
        
        const savedNote = await savePatientNote(newNote);
        setNotes(prev => [savedNote, ...prev]);
      }

      setQuickNoteContent('');
      setIsNoteModalOpen(false);
      toast.success('Note saved successfully');
    } catch (error) {
      console.error('Error saving quick note:', error);
      toast.error('Failed to save note');
    } finally {
      setIsSavingNote(false);
    }
  };

  const renderBasicInformation = () => {
    if (!patient) return <div>Loading patient information...</div>;

    const age = patient.birth_date ? calculateAge(patient.birth_date) : null;

    const capitalizeName = (name: string) => {
      return name
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    const consciousnessLevels = [
      { value: 'lethargy', label: 'Lethargy', color: 'bg-yellow-100 border-yellow-300', description: 'Drowsy but arousable' },
      { value: 'obtunded', label: 'Obtunded', color: 'bg-orange-100 border-orange-300', description: 'Sleepy, difficult to arouse' },
      { value: 'stupor', label: 'Stupor', color: 'bg-red-100 border-red-300', description: 'Only responsive to painful stimuli' },
      { value: 'coma', label: 'Coma', color: 'bg-red-200 border-red-400', description: 'Unresponsive to all stimuli' },
    ];

    return (
      <div className="space-y-8 p-4">
        {/* Demographics Section */}
        <section>
          <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-semibold">Demographics</h2>
            <div className="flex space-x-2 flex-wrap gap-2">
              <button
                onClick={handleEdit}
                className="p-2 rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity"
                title="Edit Patient"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.75 19.25L9 18.25L19.25 8C19.6642 7.58579 19.6642 6.91421 19.25 6.5L17.5 4.75C17.0858 4.33579 16.4142 4.33579 16 4.75L5.75 15L4.75 19.25Z" />
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.25 19.25H13.75" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                title="Delete Patient"
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6.75 7.75L7.59115 17.4233C7.68102 18.4568 8.54622 19.25 9.58363 19.25H14.4164C15.4538 19.25 16.319 18.4568 16.4088 17.4233L17.25 7.75" />
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 7.5V6.75C9.75 5.64543 10.6454 4.75 11.75 4.75H12.25C13.3546 4.75 14.25 5.64543 14.25 6.75V7.5" />
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 7.75H19" />
                </svg>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div>
              <div className="text-sm font-medium text-[var(--muted-foreground)]">Full Name</div>
              <div className="mt-1 font-semibold">{capitalizeName(patient.full_name)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--muted-foreground)]">Gender</div>
              <div className="mt-1">{patient.gender}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--muted-foreground)]">Date of Birth</div>
              <div className="mt-1">
                {new Date(patient.birth_date).toLocaleDateString()} {age && `(${age} years)`}
              </div>
            </div>
          </div>
        </section>

        {/* Current Diagnoses Section */}
        {patient.diagnoses && patient.diagnoses.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Current Diagnoses</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {patient.diagnoses.map((diagnosis, index) => {
                const opacity = 0.9 - index * 0.15;
                const bgColor = `rgba(50, 142, 110, ${opacity * 0.15})`;
                const borderColor = `rgba(50, 142, 110, ${opacity * 0.3})`;

                return (
                  <div
                    key={index}
                    className="p-3 rounded-lg border"
                    style={{
                      backgroundColor: bgColor,
                      borderColor: borderColor,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: '#328E6E' }}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={diagnosis}>
                          {diagnosis}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Present Illness Section */}
        {(patient.chief_complaint || patient.present_illness) && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Present Illness</h2>
            {patient.chief_complaint && (
              <div className="mb-4">
                <div className="text-sm font-medium text-[var(--muted-foreground)]">Chief Complaint</div>
                <div className="mt-1 text-lg">{patient.chief_complaint}</div>
              </div>
            )}
            {patient.present_illness && (
              <div>
                <div className="text-sm font-medium text-[var(--muted-foreground)]">History of Present Illness</div>
                <div className="mt-1">{patient.present_illness}</div>
              </div>
            )}
          </section>
        )}

        {/* Past Medical History */}
        {patient.past_medical_history && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Past Medical History</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Cardiovascular Conditions */}
              <div className="p-4 rounded-lg border bg-[var(--muted)]">
                <h3 className="text-lg font-medium mb-4">Cardiovascular Conditions</h3>
                <div className="grid grid-cols-1 gap-2">
                  {patient.past_medical_history.cardiovascular && Object.entries(patient.past_medical_history.cardiovascular)
                    .filter(([key, value]) => key !== 'others' && value === true)
                    .map(([key]) => (
                        <div
                          key={key}
                          className="flex items-center p-2 rounded bg-[var(--background)] border border-[var(--foreground)] border-opacity-10"
                        >
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 mr-3"></div>
                          <span className="text-sm">
                            {key
                              .split('_')
                              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                              .join(' ')}
                          </span>
                        </div>
                    ))}
                  {patient.past_medical_history.cardiovascular.others &&
                    patient.past_medical_history.cardiovascular.others.map((item, index) => (
                      <div
                        key={`cv-other-${index}`}
                        className="flex items-center p-2 rounded bg-[var(--background)] border border-[var(--foreground)] border-opacity-10"
                      >
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 mr-3"></div>
                        <span className="text-sm">{item.name}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Endocrine Conditions */}
              <div className="p-4 rounded-lg border bg-[var(--muted)]">
                <h3 className="text-lg font-medium mb-4">Endocrine Conditions</h3>
                <div className="grid grid-cols-1 gap-2">
                  {patient.past_medical_history.endocrine && Object.entries(patient.past_medical_history.endocrine)
                    .filter(([key, value]) => key !== 'others' && value === true)
                    .map(([key]) => (
                      <div
                        key={key}
                        className="flex items-center p-2 rounded bg-[var(--background)] border border-[var(--foreground)] border-opacity-10"
                      >
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-yellow-500 mr-3"></div>
                        <span className="text-sm">
                          {key
                            .split('_')
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')}
                        </span>
                      </div>
                    ))}
                  {patient.past_medical_history.endocrine.others &&
                    patient.past_medical_history.endocrine.others.map((item, index) => (
                      <div
                        key={`endo-other-${index}`}
                        className="flex items-center p-2 rounded bg-[var(--background)] border border-[var(--foreground)] border-opacity-10"
                      >
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-yellow-500 mr-3"></div>
                        <span className="text-sm">{item.name}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Respiratory Conditions */}
              <div className="p-4 rounded-lg border bg-[var(--muted)]">
                <h3 className="text-lg font-medium mb-4">Respiratory Conditions</h3>
                <div className="grid grid-cols-1 gap-2">
                  {patient.past_medical_history.respiratory && Object.entries(patient.past_medical_history.respiratory)
                    .filter(([key, value]) => key !== 'others' && value === true)
                    .map(([key]) => (
                      <div
                        key={key}
                        className="flex items-center p-2 rounded bg-[var(--background)] border border-[var(--foreground)] border-opacity-10"
                      >
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                        <span className="text-sm">
                          {key
                            .split('_')
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')}
                        </span>
                      </div>
                    ))}
                  {patient.past_medical_history.respiratory.others &&
                    patient.past_medical_history.respiratory.others.map((item, index) => (
                      <div
                        key={`resp-other-${index}`}
                        className="flex items-center p-2 rounded bg-[var(--background)] border border-[var(--foreground)] border-opacity-10"
                      >
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                        <span className="text-sm">{item.name}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Infectious Disease Section */}
                <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/20">
                  <h3 className="text-lg font-medium mb-4 text-red-700 dark:text-red-400">Infectious Diseases</h3>
                  <div className="grid grid-cols-1 gap-2">
                  {patient.past_medical_history.infectious_disease && Object.entries(patient.past_medical_history.infectious_disease)
                    .filter(([key, value]) => key !== 'others' && value === true)
                    .map(([disease]) => (
                          <div
                            key={disease}
                            className="flex items-center p-2 rounded bg-white dark:bg-red-900/20 border border-red-200 dark:border-red-900/30"
                          >
                            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 mr-3"></div>
                            <span className="text-sm text-red-700 dark:text-red-400">
                              {disease.charAt(0).toUpperCase() + disease.slice(1)}
                            </span>
                          </div>
                    ))}
                  {patient.past_medical_history.infectious_disease.others &&
                    patient.past_medical_history.infectious_disease.others.map((item, index) => (
                      <div
                        key={`inf-other-${index}`}
                        className="flex items-center p-2 rounded bg-white dark:bg-red-900/20 border border-red-200 dark:border-red-900/30"
                      >
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500 mr-3"></div>
                        <span className="text-sm text-red-700 dark:text-red-400">{item.name}</span>
                  </div>
                    ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Family & Social History Section */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* Family History */}
          {patient.family_history && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Family History</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-[var(--muted)]">
                    <h3 className="text-lg font-medium mb-3">Father</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-[var(--muted-foreground)]">Status</span>
                        <p className="capitalize">{patient.family_history.father.status}</p>
                      </div>
                      {patient.family_history.father.status === 'deceased' && patient.family_history.father.cause && (
                        <div>
                          <span className="text-sm font-medium text-[var(--muted-foreground)]">Cause</span>
                          <p>{patient.family_history.father.cause}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border bg-[var(--muted)]">
                    <h3 className="text-lg font-medium mb-3">Mother</h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-[var(--muted-foreground)]">Status</span>
                        <p className="capitalize">{patient.family_history.mother.status}</p>
                      </div>
                      {patient.family_history.mother.status === 'deceased' && patient.family_history.mother.cause && (
                        <div>
                          <span className="text-sm font-medium text-[var(--muted-foreground)]">Cause</span>
                          <p>{patient.family_history.mother.cause}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {patient.family_history.hereditary_diseases && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 rounded-full text-sm">
                      Hereditary Diseases
                    </span>
                  )}
                  {patient.family_history.infectious_diseases_in_family && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 rounded-full text-sm">
                      Infectious Diseases
                    </span>
                  )}
                  {patient.family_history.cancer_history && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 rounded-full text-sm">
                      Cancer History
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Social History */}
          {patient.habits && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Social History</h2>
              <div className="p-4 rounded-lg border bg-[var(--muted)]">
                <div className="grid gap-3">
                  {patient.habits.smoking && (
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5z" />
                      </svg>
                      <span>Smoking</span>
                    </div>
                  )}
                  {patient.habits.alcohol && (
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5z" />
                      </svg>
                      <span>Alcohol Use</span>
                    </div>
                  )}
                  {patient.habits.toxic_exposure && (
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5z" />
                      </svg>
                      <span>Toxic Exposure</span>
                    </div>
                  )}
                  {!patient.habits.smoking && !patient.habits.alcohol && !patient.habits.toxic_exposure && (
                    <p className="text-[var(--muted-foreground)]">No significant habits reported</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* General Examination */}
        {patient.physical_examination && (
          <section>
            <h2 className="text-xl font-semibold mb-4">General Examination</h2>
            <div className="grid gap-6">
              {/* Consciousness Scale */}
              <div className="p-4 rounded-lg border bg-[var(--muted)]">
                <h3 className="text-lg font-medium mb-4">Level of Consciousness</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {consciousnessLevels.map((level) => (
                    <div
                      key={level.value}
                      className={`p-3 rounded-lg border ${patient.physical_examination?.consciousness === level.value
                          ? `${level.color} border-2`
                          : 'bg-white/50 border-gray-200'
                      } relative`}
                    >
                      {patient.physical_examination?.consciousness === level.value && (
                        <div className="absolute -top-2 -right-2">
                          <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        </div>
                      )}
                      <h4 className="font-medium mb-1">{level.label}</h4>
                      <p className="text-sm text-[var(--muted-foreground)]">{level.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Other Physical Examination Findings */}
              <div className="grid md:grid-cols-2 gap-4">
                {patient.physical_examination.cooperation && (
                  <div className="p-4 rounded-lg border bg-[var(--muted)]">
                    <h3 className="text-lg font-medium mb-2">Cooperation</h3>
                    <p>{patient.physical_examination.cooperation}</p>
                  </div>
                )}
                {patient.physical_examination.general_appearance && (
                  <div className="p-4 rounded-lg border bg-[var(--muted)]">
                    <h3 className="text-lg font-medium mb-2">General Appearance</h3>
                    <p>{patient.physical_examination.general_appearance}</p>
                  </div>
                )}
                {patient.physical_examination.special_positions && (
                  <div className="p-4 rounded-lg border bg-[var(--muted)]">
                    <h3 className="text-lg font-medium mb-2">Special Positions</h3>
                    <p>{patient.physical_examination.special_positions}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Neurological Examination */}
        {patient.neurological_examination && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Neurological Examination</h2>
            <div className="space-y-6">
              <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-900/20">
                <h3 className="text-lg font-medium mb-4 text-yellow-800 dark:text-yellow-200">Cranial Nerves</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-yellow-700 dark:text-yellow-300">Pupil Size</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">Left:</span>
                        <span>{patient.neurological_examination.cranial_nerves.pupil_size.left} mm</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">Right:</span>
                        <span>{patient.neurological_examination.cranial_nerves.pupil_size.right} mm</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-yellow-700 dark:text-yellow-300">Light Reflex</h4>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">Direct:</span>
                        <span>{patient.neurological_examination.cranial_nerves.light_reflex.direct || 'Not tested'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">Indirect:</span>
                        <span>{patient.neurological_examination.cranial_nerves.light_reflex.indirect || 'Not tested'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-900/20">
                <h3 className="text-lg font-medium mb-4 text-yellow-800 dark:text-yellow-200">Motor Function</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3 text-yellow-700 dark:text-yellow-300">Muscle Strength</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium mb-2 text-yellow-600 dark:text-yellow-400">Left Side</h5>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm">Upper: </span>
                            <span className="font-medium">
                              {patient.neurological_examination.motor.strength.upper_limbs.left}/5
                            </span>
                          </div>
                          <div>
                            <span className="text-sm">Lower: </span>
                            <span className="font-medium">
                              {patient.neurological_examination.motor.strength.lower_limbs.left}/5
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium mb-2 text-yellow-600 dark:text-yellow-400">Right Side</h5>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm">Upper: </span>
                            <span className="font-medium">
                              {patient.neurological_examination.motor.strength.upper_limbs.right}/5
                            </span>
                          </div>
                          <div>
                            <span className="text-sm">Lower: </span>
                            <span className="font-medium">
                              {patient.neurological_examination.motor.strength.lower_limbs.right}/5
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3 text-yellow-700 dark:text-yellow-300">Babinski Sign</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">Left:</span>
                        <span
                          className={`font-medium ${patient.neurological_examination.motor.babinski_sign.left === 'positive'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {patient.neurological_examination.motor.babinski_sign.left}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">Right:</span>
                        <span
                          className={`font-medium ${patient.neurological_examination.motor.babinski_sign.right === 'positive'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {patient.neurological_examination.motor.babinski_sign.right}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: 'Reflexes', value: patient.neurological_examination.reflexes },
                  { label: 'Coordination', value: patient.neurological_examination.coordination },
                  { label: 'Sensory', value: patient.neurological_examination.sensory },
                  { label: 'Autonomic Signs', value: patient.neurological_examination.autonomic_signs },
                ].map(
                  (item) =>
                    item.value && (
                      <div
                        key={item.label}
                        className="p-4 rounded-lg border border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-900/20"
                      >
                        <h4 className="font-medium mb-2 text-yellow-700 dark:text-yellow-300">{item.label}</h4>
                        <p className="text-yellow-900 dark:text-yellow-100">{item.value}</p>
                      </div>
                    )
                )}
              </div>
            </div>
          </section>
        )}

        {/* Vital Signs Section */}
        {patient.vital_signs && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Vital Signs</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {patient.vital_signs.blood_pressure && (
                <div>
                  <div className="text-sm font-medium text-[var(--muted-foreground)]">Blood Pressure</div>
                  <div className="mt-1">{patient.vital_signs.blood_pressure} mmHg</div>
                </div>
              )}
              {patient.vital_signs.pulse && (
                <div>
                  <div className="text-sm font-medium text-[var(--muted-foreground)]">Pulse</div>
                  <div className="mt-1">{patient.vital_signs.pulse} bpm</div>
                </div>
              )}
              {patient.vital_signs.temperature && (
                <div>
                  <div className="text-sm font-medium text-[var(--muted-foreground)]">Temperature</div>
                  <div className="mt-1">{patient.vital_signs.temperature}°C</div>
                </div>
              )}
              {patient.vital_signs.respiration && (
                <div>
                  <div className="text-sm font-medium text-[var(--muted-foreground)]">Respiratory Rate</div>
                  <div className="mt-1">{patient.vital_signs.respiration} /min</div>
                </div>
              )}
              {patient.vital_signs.height && (
                <div>
                  <div className="text-sm font-medium text-[var(--muted-foreground)]">Height</div>
                  <div className="mt-1">{patient.vital_signs.height} cm</div>
                </div>
              )}
              {patient.vital_signs.weight && (
                <div>
                  <div className="text-sm font-medium text-[var(--muted-foreground)]">Weight</div>
                  <div className="mt-1">{patient.vital_signs.weight} kg</div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    );
  };

  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return renderBasicInformation();
      case 'treatment':
        return patient ? (
            <TreatmentSchema 
              patient={patient}
              onUpdate={() => {
                setIsLoading(true);
                getPatientById(unwrappedParams.id)
                  .then(data => {
                    setPatient(data);
                    setIsLoading(false);
                  })
                  .catch(error => {
                    console.error('Error refreshing patient data:', error);
                    setIsLoading(false);
                  });
              }}
            />
        ) : (
          <div>Loading patient information...</div>
        );
      case 'records':
        return (
          <div className="flex flex-col md:flex-row h-full min-h-0">
            <div className="w-full md:w-64 border-r bg-[var(--muted)] p-4 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Patient Notes</h3>
              </div>
              <div className="space-y-2">
                <button onClick={() => handleAddNote('admission')} disabled={isSavingNote} className="w-full px-4 py-2 text-sm rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 disabled:opacity-50">
                  + Add Admission Note
                </button>
                <button onClick={() => handleAddNote('daily')} disabled={isSavingNote} className="w-full px-4 py-2 text-sm rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 disabled:opacity-50">
                  + Add Daily Record
                </button>
                <button onClick={() => handleAddNote('prescription')} disabled={isSavingNote} className="w-full px-4 py-2 text-sm rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 disabled:opacity-50">
                  + Add External Prescription
                </button>
                <button onClick={() => handleAddNote('discharge')} disabled={isSavingNote} className="w-full px-4 py-2 text-sm rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 disabled:opacity-50">
                  + Add Discharge Note
                </button>
              </div>
              <div className="mt-6 space-y-2 flex-1 overflow-y-auto min-h-0">
                {notes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNote(note.id)}
                    className={`p-3 rounded-md cursor-pointer ${selectedNote === note.id ? 'bg-[var(--foreground)] text-[var(--background)]' : 'bg-[var(--background)] hover:bg-[var(--foreground)] hover:text-[var(--background)]'}`}
                  >
                    <div className="font-medium">{note.type.charAt(0).toUpperCase() + note.type.slice(1)} Note</div>
                    <div className="text-xs opacity-70">{new Date(note.date).toLocaleDateString()}</div>
                  </div>
                ))}
                {notes.length === 0 && <div className="p-3 text-sm text-[var(--muted-foreground)] text-center">No notes yet. Create one to get started.</div>}
              </div>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              {selectedNote ? (
                <>
                  <div className="flex-1 p-4 overflow-y-auto min-h-0">
                    <RichTextEditor content={noteContent} onChange={setNoteContent} placeholder="Start writing your note here..." />
                  </div>
                  <div className="border-t p-4 flex justify-end gap-4">
                    <button onClick={handleDeleteNote} disabled={isSavingNote} className="px-4 py-2 text-sm rounded-md border border-red-500 text-red-500 hover:bg-red-50 disabled:opacity-50">Delete</button>
                    <button onClick={handleSaveNote} disabled={isSavingNote} className="px-4 py-2 text-sm rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 disabled:opacity-50">
                      {isSavingNote ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                  Select a note or create a new one
                </div>
              )}
            </div>
          </div>
        );
      case 'labs':
        return (
          <div className="p-4">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Laboratory Test Results</h2>
              <p className="text-[var(--muted-foreground)]">
                View and analyze patient laboratory test results. Results are automatically highlighted based on reference ranges.
              </p>
            </div>
            {patient ? (
              <LabResultsTable 
                data={patient.lab_results || []} 
                patientId={patient.id}
                onUpdate={async () => {
                  try {
                    const updatedData = await getLabResults(patient.id);
                    setPatient(prev => ({
                      ...prev!,
                      lab_results: updatedData
                    }));
                  } catch (error) {
                    console.error('Error refreshing lab results:', error);
                    toast.error('Failed to refresh lab results');
                  }
                }}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-[var(--muted-foreground)]">Loading patient data...</p>
              </div>
            )}
          </div>
        );
      case 'imaging':
        if (viewingFullModel && selectedImage?.mismatch) {
          const isMobileSize = windowWidth < 768;
          const modelUrl = selectedImage.mismatch;
          const mobileSpecificCSS = isMobileSize ? `/* Mobile-specific additional styles */ @media (max-width: 768px) { body { touch-action: manipulation; } }` : '';
          const mobileWrapperHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><style>html, body { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; position: fixed; } iframe { border: none; width: 100%; height: 100%; position: absolute; top: 0; left: 0; right: 0; bottom: 0; } ${mobileSpecificCSS}</style></head><body><script>async function loadMobileVersion() { try { const targetUrl = "${modelUrl}"; const isMobile = ${isMobileSize}; const iframe = document.createElement('iframe'); iframe.style.width = '100%'; iframe.style.height = '100%'; iframe.style.border = 'none'; iframe.src = targetUrl; iframe.allowFullscreen = true; if (isMobile) { iframe.setAttribute('data-mobile', 'true'); iframe.setAttribute('mobile', 'true'); iframe.setAttribute('data-device-type', 'mobile'); iframe.setAttribute('data-user-agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'); iframe.addEventListener('load', function() { try { const touchStartEvent = new TouchEvent('touchstart', { bubbles: true, cancelable: true, view: window }); iframe.contentWindow.dispatchEvent(touchStartEvent); if (iframe.contentWindow.matchMedia) { const originalMatchMedia = iframe.contentWindow.matchMedia; iframe.contentWindow.matchMedia = function(query) { if (query.includes('max-width') || query.includes('mobile')) { return { matches: true }; } return originalMatchMedia.call(this, query); }; } } catch (e) {} }); } document.body.appendChild(iframe); } catch (e) { console.error('Error loading mobile version:', e); const iframe = document.createElement('iframe'); iframe.src = "${modelUrl}"; iframe.style.width = '100%'; iframe.style.height = '100%'; iframe.style.border = 'none'; iframe.allowFullscreen = true; document.body.appendChild(iframe); } } loadMobileVersion();</script></body></html>`;
          const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(mobileWrapperHtml)}`;

          return (
            <div className="fixed inset-0 z-50 bg-background">
              <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-[var(--muted)] border-b border-[var(--border)]">
                <h3 className="font-medium">3D Model: {selectedImage.type}</h3>
                <button 
                  onClick={() => { 
                    setViewingFullModel(false); 
                    setSidebarVisible(true); 
                  }} 
                  className="px-4 py-2 text-sm rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
                >
                  Back to Details
                </button>
              </div>
              <div className="absolute inset-0 pt-16">
                <iframe 
                  src={dataUri} 
                  className="w-full h-full" 
                  allowFullScreen 
                  frameBorder="0" 
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
              </div>
            </div>
          );
        }

        return (
          <div className="flex flex-col md:flex-row h-full min-h-0">
            <div className="w-full md:w-64 border-r border-[var(--border)] bg-[var(--muted)] p-4 flex flex-col min-h-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Imaging</h3>
              </div>
              <div className="space-y-2">
                <div className="font-medium mb-2">Add New Image</div>
                <div className="grid grid-cols-2 gap-2">
                  {['CT', 'CTP', 'CTA', 'MRI', 'EEG', 'ECG', 'Chest CT'].map(type => (
                    <button key={type} onClick={() => handleAddImageClick(type)} className="px-2 py-1 text-xs rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90">{type}</button>
                  ))}
                  <button onClick={() => handleAddImageClick('Other')} className="px-2 py-1 text-xs rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90">Other</button>
                </div>
              </div>
              <div className="mt-6 space-y-2 flex-1 overflow-y-auto min-h-0">
                <div className="font-medium mb-2">Patient Images</div>
                {patient && patient.imaging && patient.imaging.length > 0 ? (
                  patient.imaging.map((img, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectImage(img)}
                      className={`p-3 rounded-md cursor-pointer ${selectedImage === img ? 'bg-[var(--foreground)] text-[var(--background)]' : 'bg-[var(--background)] hover:bg-[var(--foreground)] hover:text-[var(--background)]'}`}
                    >
                      <div className="font-medium">{img.type}</div>
                      <div className="text-xs opacity-70">{img.date ? new Date(img.date).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-sm text-[var(--muted-foreground)] text-center">No imaging records yet.</div>
                )}
              </div>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              {selectedImage ? (
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h2 className="text-xl font-semibold">{selectedImage.type}</h2>
                          <p className="text-sm text-[var(--muted-foreground)]">{selectedImage.date ? new Date(selectedImage.date).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { if (selectedImage.core) { window.open(selectedImage.core, '_blank'); } else { setNewImageData({ ...newImageData, type: selectedImage.type, imageUrl: '', findings: selectedImage.findings || '', date: selectedImage.date }); setIsAddImageModalOpen(true); } }} className="p-2 rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 flex items-center" title={selectedImage.core ? 'View Image' : 'Add Image'}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </button>
                          <button onClick={() => { if (selectedImage.mismatch) { setViewingFullModel(true); setSidebarVisible(false); } else { setNewImageData({ ...newImageData, type: selectedImage.type, modelUrl: '', findings: selectedImage.findings || '', date: selectedImage.date }); setIsAddImageModalOpen(true); } }} className="p-2 rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 flex items-center" title={selectedImage.mismatch ? 'View 3D Model' : 'Add 3D Model'}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          </button>
                        </div>
                      </div>
                      <div className="mb-6">
                        <h3 className="font-medium mb-2">Conclusion</h3>
                        <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--background)]">
                          {selectedImage.findings ? <p>{selectedImage.findings}</p> : <div className="flex justify-between items-center"><p className="text-sm text-[var(--muted-foreground)]">No conclusion available</p><button onClick={() => { setNewImageData({ ...newImageData, type: selectedImage.type, findings: '', date: selectedImage.date }); setIsAddImageModalOpen(true); }} className="px-2 py-1 text-xs rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90">Add Conclusion</button></div>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                  Select an image or add a new one
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 min-h-[calc(100vh-4rem)] bg-background">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <Loader size="lg" />
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center flex-wrap gap-2">
            <button onClick={handleBack} className="flex items-center text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"></path>
              </svg>
              <span className="ml-1">Back to Patients</span>
            </button>
          </div>

          <div className="overflow-x-auto border-b border-[var(--border)]">
            <div className="tabs flex min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium ${activeTab === tab.id
                      ? 'text-[var(--foreground)] border-b-2 border-[var(--foreground)]'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Tab Content Wrapper */}
          <div className={
            activeTab === 'records' || activeTab === 'imaging'
              ? 'flex-1 min-h-0 overflow-hidden'
              : 'flex-1 overflow-y-auto'
          }>
            {renderTabContent()}
          </div>

          {/* Floating Note Button - Only show on Basic Information tab */}
          {activeTab === 'basic' && (
            <div className="fixed bottom-6 right-6 z-50">
              <button
                onClick={handleNoteButtonClick}
                className={`w-14 h-14 rounded-full bg-[var(--foreground)] text-[var(--background)] shadow-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                  isNoteButtonRotating ? 'rotate-180' : ''
                }`}
              >
                <svg
                  className={`w-6 h-6 transition-transform duration-300 ${
                    isNoteModalOpen ? 'rotate-45' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={isNoteModalOpen ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"}
                  />
                </svg>
              </button>

              {/* Floating Note Modal */}
              {isNoteModalOpen && (
                <div className="absolute bottom-20 right-0 w-80 bg-[var(--background)] rounded-lg shadow-xl border border-[var(--border)] transform transition-all duration-300 animate-slide-up">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Quick Note</h3>
                    <div className="mb-4">
                      <RichTextEditor
                        content={quickNoteContent}
                        onChange={setQuickNoteContent}
                        placeholder="Write your note here..."
                        isQuickNote={true}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleQuickNoteSave}
                        disabled={isSavingNote || !quickNoteContent.trim()}
                        className="px-4 py-2 text-sm rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 disabled:opacity-50"
                      >
                        {isSavingNote ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add image modal */}
      {isAddImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          {/* Modal content */}
          <div className="bg-[var(--background)] rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden pointer-events-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add {selectedImageType} Image</h3>
                <button
                  onClick={() => setIsAddImageModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleImageSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="imageDate" className="block text-sm font-medium">
                      Date
                    </label>
                    <input
                      type="date"
                      id="imageDate"
                      value={newImageData.date}
                      onChange={(e) => setNewImageData({ ...newImageData, date: e.target.value })}
                      className="mt-1 block w-full rounded-md border p-2 bg-[var(--muted)]"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="imageTitle" className="block text-sm font-medium">
                      Image Type
                    </label>
                    <input
                      type="text"
                      id="imageTitle"
                      value={newImageData.type}
                      onChange={(e) => setNewImageData({ ...newImageData, type: e.target.value })}
                      className="mt-1 block w-full rounded-md border p-2 bg-[var(--muted)]"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="imageFindings" className="block text-sm font-medium">
                      Findings/Conclusion
                    </label>
                    <textarea
                      id="imageFindings"
                      value={newImageData.findings}
                      onChange={(e) => setNewImageData({ ...newImageData, findings: e.target.value })}
                      rows={4}
                      className="mt-1 block w-full rounded-md border p-2 bg-[var(--muted)]"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium">
                      Image URL (optional)
                    </label>
                    <input
                      type="text"
                      id="imageUrl"
                      value={newImageData.imageUrl}
                      onChange={(e) => setNewImageData({ ...newImageData, imageUrl: e.target.value })}
                      className="mt-1 block w-full rounded-md border p-2 bg-[var(--muted)]"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <label htmlFor="modelUrl" className="block text-sm font-medium">
                      3D Model URL (optional)
                    </label>
                    <input
                      type="text"
                      id="modelUrl"
                      value={newImageData.modelUrl}
                      onChange={(e) => setNewImageData({ ...newImageData, modelUrl: e.target.value })}
                      className="mt-1 block w-full rounded-md border p-2 bg-[var(--muted)]"
                      placeholder="https://example.com/model"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddImageModalOpen(false)}
                    className="mr-3 px-4 py-2 text-sm rounded-md border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm rounded-md bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
                  >
                    Add Image
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add this at the end of the file
const styles = `
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}