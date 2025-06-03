import { useState } from 'react';
import { Button } from './Button';
import type { Patient, CustomCondition, AllergyItem, SurgeryTraumaItem, DrugUseItem, MedicationItem } from '@/types/patient';
import { motion } from 'framer-motion';
import { PatientDocumentUploader } from './PatientDocumentUploader';
import { MedicalConditionCard } from './MedicalConditionCard';
import { ItemListManager } from './ItemListManager';
import { Heart, Activity, Droplets, Pill } from 'lucide-react';

// Temporary lung icon since Lucide doesn't have Lungs
const LungIcon = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M6.081 20c1.6-.001 2.64-.055 3.37-.558a2.009 2.009 0 0 0 .67-.841c.137-.3.13-.389.186-.89.12-1.079.475-1.71 2.193-2.209.736-.213 1.148-.832 1.234-1.466.346-2.523-2.611-3.026-4.4-.475" />
    <path d="M17.92 20c-1.599-.001-2.64-.055-3.37-.558a2.009 2.009 0 0 1-.67-.841c-.137-.3-.13-.389-.186-.89-.12-1.079-.474-1.71-2.193-2.209-.736-.213-1.147-.832-1.234-1.466-.292-2.13 1.724-2.942 3.67-1.26" />
    <path d="M9.5 5.5c0 .91-.405 1.7-1.5 2.25C6.809 8.364 6 9.177 6 10.5v7c0 1.886 0 2.828.586 3.414S8.114 21.5 10 21.5h4c1.886 0 2.828 0 3.414-.586S18 19.386 18 17.5v-8.5" />
    <path d="M12 8V2.5" />
  </svg>
);

type Gender = 'Male' | 'Female';

interface PatientFormProps {
  initialData?: Patient;
  onSubmit: (data: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  isLoading?: boolean;
}

interface FormPhysicalExam {
  consciousness: string;
  cooperation: string;
  orientation: string;
  mental_status: string;
  general_appearance: string;
  special_positions: string;
}

// Update the PatientFormData type to include id
type PatientFormData = Omit<
  Patient,
  'created_at' | 'updated_at' | 'physical_examination'
> & FormPhysicalExam;

export function PatientForm({ initialData, onSubmit, isLoading }: PatientFormProps) {
  const [formData, setFormData] = useState<PatientFormData>({
    // Basic Info
    id: initialData?.id ?? '',
    security_id: initialData?.security_id ?? '',
    bed_number: initialData?.bed_number ?? '',
    admission_date: initialData?.admission_date?.split('T')[0] ?? new Date().toISOString().split('T')[0],
    status_tags: initialData?.status_tags ?? [],
    full_name: initialData?.full_name ?? '',
    gender: initialData?.gender as Gender ?? 'Male',
    birth_date: initialData?.birth_date?.split('T')[0] ?? new Date().toISOString().split('T')[0],
    chief_complaint: initialData?.chief_complaint ?? '',
    present_illness: initialData?.present_illness ?? '',

    // Medical History
    past_medical_history: initialData?.past_medical_history ?? {
      cardiovascular: {
      hypertension: false,
        coronary_artery_disease: false,
        atrial_fibrillation: false,
        heart_failure: false,
        cerebral_infarction: false,
        others: []
      },
      endocrine: {
        diabetes_type1: false,
        diabetes_type2: false,
        hyperthyroidism: false,
        hypothyroidism: false,
        others: []
      },
      respiratory: {
        asthma: false,
        copd: false,
        others: []
      },
      kidney: {
        acute_kidney_injury: false,
        chronic_kidney_disease: false,
        others: []
      },
      liver: {
        fatty_liver: false,
        cirrhosis: false,
        others: []
      },
      infectious_disease: {
        hepatitis: false,
        tuberculosis: false,
        others: []
      }
    },
    surgical_history: initialData?.surgical_history ?? [],
    allergies: initialData?.allergies ?? [],
    medication_history: initialData?.medication_history ?? [],
    drug_use_history: initialData?.drug_use_history ?? [],
    vaccination_history: initialData?.vaccination_history ?? '',

    // Family History
    family_history: initialData?.family_history ?? {
      father: {
        status: 'alive' as const,
        cause: ''
      },
      mother: {
        status: 'alive' as const,
        cause: ''
      },
      hereditary_diseases: false,
      hereditary_details: [],
      infectious_diseases_in_family: false,
      infectious_details: [],
      cancer_history: false,
      cancer_details: []
    },

    // Social History
    habits: initialData?.habits ?? {
      smoking: false,
      smoking_details: {
        duration: '',
        cigarettes_per_day: 0
      },
      alcohol: false,
      alcohol_details: {
        duration: '',
        quantity_per_day: ''
      },
      toxic_exposure: false,
      toxic_exposure_details: {
        type: '',
        duration: ''
      }
    },

    // Optional Menstrual History
    menstrual_history: initialData?.menstrual_history ?? {
      flow: '',
      dysmenorrhea: false,
      cycle: '',
      post_menopausal_bleeding: false
    },

    // Physical Examination
    vital_signs: initialData?.vital_signs ?? {
      pulse: 0,
      respiration: 0,
      blood_pressure: '',
      temperature: 0,
      weight: null,
      height: null
    },
    consciousness: initialData?.physical_examination?.consciousness ?? 'Alert',
    orientation: initialData?.physical_examination?.orientation ?? 'Oriented',
    mental_status: initialData?.physical_examination?.mental_status ?? '',
    cooperation: initialData?.physical_examination?.cooperation ?? '',
    general_appearance: initialData?.physical_examination?.general_appearance ?? '',
    special_positions: initialData?.physical_examination?.special_positions ?? '',

    // Neurological Examination
    neurological_examination: initialData?.neurological_examination ?? {
      cranial_nerves: {
        pupil_size: {
          left: 3.5,
          right: 3.5
        },
        light_reflex: {
          direct: '',
          indirect: ''
        },
        cn_i: { 
          status: 'normal', 
          right_status: 'normal',
          notes: '' 
        },
        cn_ii: { 
          visual_acuity_left: 'normal',
          visual_acuity_right: 'normal',
          visual_fields_left: 'normal',
          visual_fields_right: 'normal',
          fundus_left: 'normal',
          fundus_right: 'normal',
          notes: '' 
        },
        cn_iii_iv_vi: { 
          eye_movement: 'normal',
          ptosis: false,
          nystagmus: false,
          diplopia: false,
          status: 'normal', 
          notes: '' 
        },
        cn_v: { 
          sensation_v1: 'normal',
          sensation_v2: 'normal',
          sensation_v3: 'normal',
          corneal_left: 'normal',
          corneal_right: 'normal',
          jaw_strength: 'normal',
          status: 'normal', 
          notes: '' 
        },
        cn_vii: { 
          eye_fissure_left: 0,
          eye_fissure_right: 0,
          nasolabial_left: 'normal',
          nasolabial_right: 'normal',
          mouth_deviation: 'none',
          facial_movement: 'normal',
          status: 'normal', 
          notes: '' 
        },
        cn_viii: { 
          hearing_left: 'normal',
          hearing_right: 'normal',
          rinne_test: 'normal',
          weber_test: 'normal',
          status: 'normal', 
          notes: '' 
        },
        cn_ix_x: { 
          palate_elevation: 'normal',
          gag_reflex: 'normal',
          speech: 'normal',
          swallowing: 'normal',
          status: 'normal', 
          notes: '' 
        },
        cn_xi: { 
          scm_strength_left: 'normal',
          scm_strength_right: 'normal',
          trapezius_strength_left: 'normal',
          trapezius_strength_right: 'normal',
          status: 'normal', 
          notes: '' 
        },
        cn_xii: { 
          tongue_position: 'midline',
          tongue_strength: 'normal',
          tongue_atrophy: false,
          tongue_fasciculations: false,
          status: 'normal', 
          notes: '' 
        }
      },
      motor: {
        tone: '',
        strength: {
          upper_limbs: {
            left: 0,
            right: 0
          },
          lower_limbs: {
            left: 0,
            right: 0
          }
        },
        babinski_sign: {
          left: 'negative',
          right: 'negative'
        }
      },
      meningeal_signs: {
        neck_stiffness: 'negative',
        kernig_sign: 'negative',
        brudzinski_sign: 'negative'
      },
      reflexes: '',
      coordination: '',
      sensory: '',
      autonomic_signs: ''
    },

    // Tests and Results
    labs: initialData?.labs ?? [],
    imaging: initialData?.imaging ?? [],

    // Treatment
    diagnoses: initialData?.diagnoses ?? ['', '', ''],
    procedures: initialData?.procedures ?? [],

    // Personal History
    personal_history: initialData?.personal_history ?? {
      epidemic_region: false,
      epidemic_region_details: '',
      infected_water_exposure: false,
      infected_water_details: ''
    },
    current_medications: initialData?.current_medications ?? [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a properly typed submission object
    const {
      id, // Destructure 'id' to exclude it from restOfPatientData
      consciousness,
      orientation,
      mental_status,
      cooperation,
      general_appearance,
      special_positions,
      ...restOfPatientData // Contains all other top-level fields from formData (e.g., security_id, full_name)
    } = formData;

    // submissionData must match Omit<Patient, 'id' | 'created_at' | 'updated_at'>
    // 'id' is now correctly omitted from this object.
    const submissionData: Omit<Patient, 'id' | 'created_at' | 'updated_at'> = {
      ...restOfPatientData, // Spread fields like security_id, full_name, vital_signs, etc.
      physical_examination: { // Reconstruct the nested physical_examination object
        consciousness,
        orientation,
        mental_status,
        cooperation,
        general_appearance,
        special_positions,
      },
      // All other relevant top-level properties from formData (like past_medical_history,
      // current_medications, labs, imaging, etc.) are included via ...restOfPatientData.
    };
    
    await onSubmit(submissionData); 
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev };
      name.split('.').reduce((obj: Record<string, unknown>, key, index, arr) => {
        if (index === arr.length - 1) {
          obj[key] = value;
        } else {
          obj[key] = { ...obj[key] as Record<string, unknown> };
        }
        return obj[key] as Record<string, unknown>;
      }, updated);
      return updated;
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => {
      const updated = { ...prev };
      name.split('.').reduce((obj: Record<string, unknown>, key, index, arr) => {
        if (index === arr.length - 1) {
          obj[key] = checked;
        } else {
          obj[key] = { ...obj[key] as Record<string, unknown> };
        }
        return obj[key] as Record<string, unknown>;
      }, updated);
      return updated;
    });
  };

  const handleGenderChange = (newGender: Gender) => {
    setFormData(prev => ({
      ...prev,
      gender: newGender,
      // Remove menstrual history data when switching to Male
      menstrual_history: newGender === 'Male' ? undefined : (prev.menstrual_history ?? {
        flow: '',
        dysmenorrhea: false,
        cycle: '',
        post_menopausal_bleeding: false
      })
    }));
  };

  // Medical Condition Cards handlers
  const handleConditionChange = (category: string, condition: string, checked: boolean) => {
    setFormData(prev => {
      if (!prev.past_medical_history) return prev;
      
      const updated = { ...prev };
      const categoryData = { ...updated.past_medical_history[category as keyof typeof updated.past_medical_history] };
      
      // Type assertion to avoid TypeScript error
      (categoryData as Record<string, unknown>)[condition] = checked;
      
      updated.past_medical_history = {
        ...updated.past_medical_history,
        [category]: categoryData
      };
      
      return updated;
    });
  };

  const handleAddCustomCondition = (category: string, condition: CustomCondition) => {
    setFormData(prev => {
      if (!prev.past_medical_history) return prev;
      
      const updated = { ...prev };
      const categoryData = { ...updated.past_medical_history[category as keyof typeof updated.past_medical_history] };
      
      // Type assertion to avoid TypeScript error
      const others = [...((categoryData as any).others || []), condition];
      
      (categoryData as any).others = others;
      
      updated.past_medical_history = {
        ...updated.past_medical_history,
        [category]: categoryData
      };
      
      return updated;
    });
  };

  const handleRemoveCustomCondition = (category: string, index: number) => {
    setFormData(prev => {
      if (!prev.past_medical_history) return prev;
      
      const updated = { ...prev };
      const categoryData = { ...updated.past_medical_history[category as keyof typeof updated.past_medical_history] };
      
      // Type assertion to avoid TypeScript error
      const others = [...((categoryData as any).others || [])];
      others.splice(index, 1);
      
      (categoryData as any).others = others;
      
      updated.past_medical_history = {
        ...updated.past_medical_history,
        [category]: categoryData
      };
      
      return updated;
    });
  };

  // Family History handlers
  const handleAddFamilyCondition = (category: string, condition: CustomCondition) => {
    setFormData(prev => {
      if (!prev.family_history) return prev;
      
      const updated = { ...prev };
      const detailsKey = `${category}_details`;
      
      // Type assertion to avoid TypeScript error
      const currentDetails = [...((updated.family_history as any)[detailsKey] || [])];
      
      updated.family_history = {
        ...updated.family_history,
        [detailsKey]: [...currentDetails, condition]
      };
      
      return updated;
    });
  };

  const handleRemoveFamilyCondition = (category: string, index: number) => {
    setFormData(prev => {
      if (!prev.family_history) return prev;
      
      const updated = { ...prev };
      const detailsKey = `${category}_details`;
      
      // Type assertion to avoid TypeScript error
      const currentDetails = [...((updated.family_history as any)[detailsKey] || [])];
      currentDetails.splice(index, 1);
      
      updated.family_history = {
        ...updated.family_history,
        [detailsKey]: currentDetails
      };
      
      return updated;
    });
  };

  // Social habits handlers
  const handleHabitDetailsChange = (habit: string, field: string, value: string | number) => {
    setFormData(prev => {
      if (!prev.habits) return prev;
      
      const updated = { ...prev };
      const detailsKey = `${habit}_details`;
      
      // Type assertion to avoid TypeScript error
      updated.habits = {
        ...updated.habits,
        [detailsKey]: {
          ...((updated.habits as any)[detailsKey] || {}),
          [field]: value
        }
      };
      
      return updated;
    });
  };

  // Item list handlers
  const handleAddAllergy = (item: AllergyItem) => {
    setFormData(prev => ({
      ...prev,
      allergies: [...(prev.allergies || []), item]
    }));
  };

  const handleRemoveAllergy = (index: number) => {
    setFormData(prev => {
      const allergies = [...(prev.allergies || [])];
      allergies.splice(index, 1);
      return { ...prev, allergies };
    });
  };

  const handleAddSurgery = (item: SurgeryTraumaItem) => {
    setFormData(prev => ({
      ...prev,
      surgical_history: [...(prev.surgical_history || []), item]
    }));
  };

  const handleRemoveSurgery = (index: number) => {
    setFormData(prev => {
      const surgical_history = [...(prev.surgical_history || [])];
      surgical_history.splice(index, 1);
      return { ...prev, surgical_history };
    });
  };

  const handleAddDrugUse = (item: DrugUseItem) => {
    setFormData(prev => ({
      ...prev,
      drug_use_history: [...(prev.drug_use_history || []), item]
    }));
  };

  const handleRemoveDrugUse = (index: number) => {
    setFormData(prev => {
      const drug_use_history = [...(prev.drug_use_history || [])];
      drug_use_history.splice(index, 1);
      return { ...prev, drug_use_history };
    });
  };

  // Handle AI extracted data
  const handleDocumentDataExtracted = (extractedData: Partial<Patient>) => {
    if (!extractedData) return;
    
    // Create a new form data object that merges the AI extracted data
    const newFormData = { ...formData };
    
    // Process the extracted data and update the form
    // Handle basic string fields
    if (extractedData.security_id) newFormData.security_id = extractedData.security_id;
    if (extractedData.admission_date) newFormData.admission_date = extractedData.admission_date;
    if (extractedData.full_name) newFormData.full_name = extractedData.full_name;
    if (extractedData.gender && (extractedData.gender === 'Male' || extractedData.gender === 'Female')) {
      newFormData.gender = extractedData.gender;
    }
    if (extractedData.birth_date) newFormData.birth_date = extractedData.birth_date;
    if (extractedData.chief_complaint) newFormData.chief_complaint = extractedData.chief_complaint;
    if (extractedData.present_illness) newFormData.present_illness = extractedData.present_illness;
    if (extractedData.vaccination_history) newFormData.vaccination_history = extractedData.vaccination_history;

    // Handle current treatment
    if (extractedData.current_treatment) {
      newFormData.current_medications = extractedData.current_treatment.map(treatment => ({
        name: treatment.name || '',
        dosage: treatment.dosage || '',
        frequency: treatment.frequency || '',
        duration: treatment.duration || '',
        notes: treatment.notes || ''
      }));
    }
    
    // Handle complex objects
    if (extractedData.past_medical_history) {
      newFormData.past_medical_history = {
        ...newFormData.past_medical_history,
        ...extractedData.past_medical_history
      };
    }
    
    if (extractedData.vital_signs) {
      newFormData.vital_signs = {
        ...newFormData.vital_signs,
        ...extractedData.vital_signs
      };
    }
    
    if (extractedData.neurological_examination) {
      newFormData.neurological_examination = {
        ...newFormData.neurological_examination,
        ...extractedData.neurological_examination
      };
    }
    
    if (extractedData.family_history) {
      newFormData.family_history = {
        ...newFormData.family_history,
        ...extractedData.family_history
      };
    }
    
    if (extractedData.habits) {
      newFormData.habits = {
        ...newFormData.habits,
        ...extractedData.habits
      };
    }
    
    // Handle array types
    if (extractedData.surgical_history) newFormData.surgical_history = extractedData.surgical_history;
    if (extractedData.allergies) newFormData.allergies = extractedData.allergies;
    if (extractedData.medication_history) newFormData.medication_history = extractedData.medication_history;
    if (extractedData.drug_use_history) newFormData.drug_use_history = extractedData.drug_use_history;
    if (extractedData.diagnoses) newFormData.diagnoses = extractedData.diagnoses;
    if (extractedData.personal_history) newFormData.personal_history = extractedData.personal_history;
    
    // For physical_examination fields, extract them to the form data
    if (extractedData.physical_examination) {
      const { consciousness, cooperation, general_appearance, special_positions } = 
        extractedData.physical_examination;
        
      if (consciousness) newFormData.consciousness = consciousness;
      if (cooperation) newFormData.cooperation = cooperation;
      if (general_appearance) newFormData.general_appearance = general_appearance;
      if (special_positions) newFormData.special_positions = special_positions;
    }
    
    // Update the form state
    setFormData(newFormData);
  };
  
  // Create a template for AI extraction based on the current form structure
  const formTemplate: Partial<Patient> = {
    full_name: '',
    gender: '',
    birth_date: '',
    chief_complaint: '',
    present_illness: '',
    past_medical_history: formData.past_medical_history,
    vital_signs: formData.vital_signs,
    physical_examination: {
      consciousness: '',
      cooperation: '',
      general_appearance: '',
      special_positions: ''
    },
    neurological_examination: formData.neurological_examination
  };

  const inputClassName = "mt-1 block w-full rounded-md border px-3 py-2 bg-[var(--input)] text-[var(--input-foreground)] border-[var(--input-border)] shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const checkboxClassName = "h-5 w-5 rounded-md border-2 border-[#7984E8] bg-transparent focus:ring-2 focus:ring-offset-0 focus:ring-[#7984E8] focus:ring-opacity-30 transition-colors duration-200 ease-in-out cursor-pointer";
  const cardClassName = "p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700";

  // Add a handler for current treatment
  const handleAddMedication = (item: MedicationItem) => {
    setFormData(prev => ({
      ...prev,
      current_medications: [...(prev.current_medications || []), item]
    }));
  };

  const handleRemoveMedication = (index: number) => {
    setFormData(prev => {
      const current_medications = [...(prev.current_medications || [])];
      current_medications.splice(index, 1);
      return { ...prev, current_medications };
    });
  };

  // Add handlers for personal history toggles
  const handlePersonalHistoryToggle = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      personal_history: {
        ...prev.personal_history!,
        [field]: checked
      }
    }));
  };

  const handlePersonalHistoryDetails = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personal_history: {
        ...prev.personal_history!,
        [field]: value
      }
    }));
  };

  // Function to handle cranial nerve status change
  const handleCranialNerveChange = (nerve: string, field: 'status' | 'notes', value: string) => {
    setFormData(prev => {
      if (!prev.neurological_examination) return prev;
      
      return {
        ...prev,
        neurological_examination: {
          ...prev.neurological_examination,
          cranial_nerves: {
            ...prev.neurological_examination.cranial_nerves,
            [nerve]: {
              ...prev.neurological_examination.cranial_nerves[nerve as keyof typeof prev.neurological_examination.cranial_nerves],
              [field]: value
            }
          }
        }
      };
    });
  };

  // Add a handler for meningeal signs
  const handleMeningealSignChange = (sign: keyof MeningealSigns, value: 'negative' | 'positive') => {
    setFormData(prev => {
      if (!prev.neurological_examination) return prev;
      
      return {
        ...prev,
        neurological_examination: {
          ...prev.neurological_examination,
          meningeal_signs: {
            ...prev.neurological_examination.meningeal_signs,
            [sign]: value
          }
        }
      };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      {/* Document Uploader for AI extraction */}
      <PatientDocumentUploader 
        onDataExtracted={handleDocumentDataExtracted}
        formTemplate={formTemplate}
      />
      
      {/* Basic Information */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Basic Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="security_id" className="block text-sm font-medium">
              Security ID *
            </label>
            <input
              type="text"
              id="security_id"
              name="security_id"
              required
              value={formData.security_id}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="bed_number" className="block text-sm font-medium">
              Bed Number *
            </label>
            <input
              type="text"
              id="bed_number"
              name="bed_number"
              required
              value={formData.bed_number}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="admission_date" className="block text-sm font-medium">
              Admission Date *
            </label>
            <input
              type="date"
              id="admission_date"
              name="admission_date"
              required
              value={formData.admission_date}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status Tags</label>
            <div className="space-y-2">
              {['new_patient', 'transferred', 'discharge_today', 'discharge_tomorrow', 'isolation', 'ncu'].map((tag) => (
                <div key={tag} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`status_${tag}`}
                    checked={formData.status_tags?.includes(tag)}
                    onChange={(e) => {
                      const newTags = e.target.checked
                        ? [...(formData.status_tags || []), tag]
                        : (formData.status_tags || []).filter(t => t !== tag);
                      setFormData(prev => ({
                        ...prev,
                        status_tags: newTags
                      }));
                    }}
                    className={checkboxClassName}
                  />
                  <label htmlFor={`status_${tag}`} className="ml-2 text-sm">
                    {tag.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="full_name" className="block text-sm font-medium">
              Full Name *
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Gender *</label>
            <div className="relative w-48 h-10 rounded-full shadow-sm overflow-hidden">
              <input 
                type="hidden"
                name="gender"
                required
                value={formData.gender}
              />
              <div 
                className="absolute inset-0 flex items-center rounded-full border border-[var(--input-border)] cursor-pointer bg-[var(--input)]"
                onClick={() => handleGenderChange(formData.gender === 'Male' ? 'Female' : 'Male')}
              >
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 flex items-center justify-center text-sm font-medium z-10"
                    style={{ color: formData.gender === 'Female' ? 'white' : 'var(--muted-foreground)' }}>
                    Female
                  </div>
                  <div className="w-1/2 flex items-center justify-center text-sm font-medium z-10"
                    style={{ color: formData.gender === 'Male' ? 'white' : 'var(--muted-foreground)' }}>
                    Male
                  </div>
                </div>

                <motion.div
                  className="absolute top-0 bottom-0 w-1/2 rounded-full z-0"
                  animate={{
                    x: formData.gender === 'Male' ? '100%' : 0,
                    backgroundColor: formData.gender === 'Male' ? '#547792' : '#FF8282'
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="birth_date" className="block text-sm font-medium">
              Birth Date *
            </label>
            <input
              type="date"
              id="birth_date"
              name="birth_date"
              required
              value={formData.birth_date}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="chief_complaint" className="block text-sm font-medium">
            Chief Complaint
          </label>
          <textarea
            id="chief_complaint"
            name="chief_complaint"
            value={formData.chief_complaint}
            onChange={handleChange}
            rows={2}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="present_illness" className="block text-sm font-medium">
            Present Illness
          </label>
          <textarea
            id="present_illness"
            name="present_illness"
            value={formData.present_illness}
            onChange={handleChange}
            rows={4}
            className={inputClassName}
          />
        </div>
      </section>

      {/* Past Medical History */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Past Medical History</h2>
        
        {/* Cardiovascular Diseases */}
        {formData.past_medical_history && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MedicalConditionCard
              title="Cardiovascular Diseases"
              icon={<Heart className="text-red-500" size={20} />}
              backgroundColor="bg-red-50 dark:bg-red-900/20"
              conditionsMap={formData.past_medical_history.cardiovascular}
              customConditions={formData.past_medical_history.cardiovascular.others || []}
              onConditionChange={(name, checked) => handleConditionChange('cardiovascular', name, checked)}
              onAddCustomCondition={(condition) => handleAddCustomCondition('cardiovascular', condition)}
              onRemoveCustomCondition={(index) => handleRemoveCustomCondition('cardiovascular', index)}
            />
            
            {/* Endocrine Disorders */}
            <MedicalConditionCard
              title="Endocrine Disorders"
              icon={<Activity className="text-blue-500" size={20} />}
              backgroundColor="bg-blue-50 dark:bg-blue-900/20"
              conditionsMap={formData.past_medical_history.endocrine}
              customConditions={formData.past_medical_history.endocrine.others || []}
              onConditionChange={(name, checked) => handleConditionChange('endocrine', name, checked)}
              onAddCustomCondition={(condition) => handleAddCustomCondition('endocrine', condition)}
              onRemoveCustomCondition={(index) => handleRemoveCustomCondition('endocrine', index)}
            />
            
            {/* Respiratory Diseases */}
            <MedicalConditionCard
              title="Respiratory Diseases"
              icon={<LungIcon className="text-indigo-500" size={20} />}
              backgroundColor="bg-indigo-50 dark:bg-indigo-900/20"
              conditionsMap={formData.past_medical_history.respiratory}
              customConditions={formData.past_medical_history.respiratory.others || []}
              onConditionChange={(name, checked) => handleConditionChange('respiratory', name, checked)}
              onAddCustomCondition={(condition) => handleAddCustomCondition('respiratory', condition)}
              onRemoveCustomCondition={(index) => handleRemoveCustomCondition('respiratory', index)}
            />
            
            {/* Kidney Diseases */}
            <MedicalConditionCard
              title="Kidney Diseases"
              icon={<Droplets className="text-emerald-500" size={20} />}
              backgroundColor="bg-emerald-50 dark:bg-emerald-900/20"
              conditionsMap={formData.past_medical_history.kidney}
              customConditions={formData.past_medical_history.kidney.others || []}
              onConditionChange={(name, checked) => handleConditionChange('kidney', name, checked)}
              onAddCustomCondition={(condition) => handleAddCustomCondition('kidney', condition)}
              onRemoveCustomCondition={(index) => handleRemoveCustomCondition('kidney', index)}
            />
            
            {/* Liver Diseases */}
            <MedicalConditionCard
              title="Liver Diseases"
              backgroundColor="bg-yellow-50 dark:bg-yellow-900/20"
              conditionsMap={formData.past_medical_history.liver}
              customConditions={formData.past_medical_history.liver.others || []}
              onConditionChange={(name, checked) => handleConditionChange('liver', name, checked)}
              onAddCustomCondition={(condition) => handleAddCustomCondition('liver', condition)}
              onRemoveCustomCondition={(index) => handleRemoveCustomCondition('liver', index)}
            />
            
            {/* Infectious Diseases */}
            <MedicalConditionCard
              title="Infectious Diseases"
              icon={<Pill className="text-purple-500" size={20} />}
              backgroundColor="bg-purple-50 dark:bg-purple-900/20"
              conditionsMap={formData.past_medical_history.infectious_disease}
              customConditions={formData.past_medical_history.infectious_disease.others || []}
              onConditionChange={(name, checked) => handleConditionChange('infectious_disease', name, checked)}
              onAddCustomCondition={(condition) => handleAddCustomCondition('infectious_disease', condition)}
              onRemoveCustomCondition={(index) => handleRemoveCustomCondition('infectious_disease', index)}
            />
          </div>
        )}
      </section>
      
      {/* Medical History Lists */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Medical History</h2>
        
        {/* Current Treatment */}
        <ItemListManager<MedicationItem>
          title="Current Treatment"
          items={formData.current_medications || []}
          fields={[
            { name: 'name', label: 'Medication', placeholder: 'e.g. Lisinopril', required: true },
            { name: 'dosage', label: 'Dosage', placeholder: 'e.g. 10mg', required: true },
            { name: 'frequency', label: 'Frequency', placeholder: 'e.g. Once daily', required: true },
            { name: 'start_date', label: 'Start Date', placeholder: '', type: 'date' },
            { name: 'purpose', label: 'Purpose', placeholder: 'e.g. Blood pressure control' }
          ]}
          onAddItem={handleAddMedication}
          onRemoveItem={handleRemoveMedication}
          emptyMessage="No current medications recorded."
        />
        
        {/* Allergies */}
        <ItemListManager<AllergyItem>
          title="Allergies"
          items={formData.allergies || []}
          fields={[
            { name: 'name', label: 'Allergen', placeholder: 'e.g. Penicillin', required: true },
            { name: 'reaction', label: 'Reaction', placeholder: 'e.g. Rash, Anaphylaxis', required: true }
          ]}
          onAddItem={handleAddAllergy}
          onRemoveItem={handleRemoveAllergy}
          emptyMessage="No allergies recorded."
        />
        
        {/* Surgical and Trauma History */}
        <ItemListManager<SurgeryTraumaItem>
          title="Surgical & Trauma History"
          items={formData.surgical_history || []}
          fields={[
            { name: 'name', label: 'Procedure/Trauma', placeholder: 'e.g. Appendectomy', required: true },
            { name: 'date', label: 'Date', placeholder: '', type: 'date', required: true },
            { name: 'details', label: 'Details', placeholder: 'Additional information', type: 'textarea' }
          ]}
          onAddItem={handleAddSurgery}
          onRemoveItem={handleRemoveSurgery}
          emptyMessage="No surgical or trauma history recorded."
        />
        
        {/* Drug Use History */}
        <ItemListManager<DrugUseItem>
          title="Drug Use History"
          items={formData.drug_use_history || []}
          fields={[
            { name: 'name', label: 'Substance', placeholder: 'e.g. Tobacco, Cannabis', required: true },
            { name: 'duration', label: 'Duration', placeholder: 'e.g. 5 years', required: true },
            { name: 'details', label: 'Details', placeholder: 'Frequency, amount, etc.', type: 'textarea' }
          ]}
          onAddItem={handleAddDrugUse}
          onRemoveItem={handleRemoveDrugUse}
          emptyMessage="No drug use history recorded."
        />
        
        {/* Vaccination History */}
        <div>
          <label htmlFor="vaccination_history" className="block text-sm font-medium">
            Vaccination History
          </label>
          <textarea
            id="vaccination_history"
            name="vaccination_history"
            value={formData.vaccination_history}
            onChange={handleChange}
            rows={3}
            className={inputClassName}
          />
        </div>
      </section>

      {/* Personal History Section - New */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Personal History</h2>
        <div className={`${cardClassName}`}>
          {/* Epidemic Region */}
          <div className="mb-4">
            <div className="flex items-center">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                  id="personal_history.epidemic_region"
                  name="personal_history.epidemic_region"
                  checked={Boolean(formData.personal_history?.epidemic_region)}
                  onChange={(e) => handlePersonalHistoryToggle('epidemic_region', e.target.checked)}
                  style={{ 
                    backgroundColor: formData.personal_history?.epidemic_region ? '#7984E8' : 'transparent', 
                    borderColor: '#7984E8' 
                  }}
                      className={checkboxClassName}
                    />
                  </div>
              <label htmlFor="personal_history.epidemic_region" className="ml-2 text-sm font-medium">
                Residence in Epidemic Region
                  </label>
                </div>
            
            {formData.personal_history?.epidemic_region && (
              <div className="ml-7 mt-2">
                <label htmlFor="personal_history.epidemic_region_details" className="block text-sm font-medium">
                  Details
                </label>
                <textarea
                  id="personal_history.epidemic_region_details"
                  name="personal_history.epidemic_region_details"
                  value={formData.personal_history?.epidemic_region_details || ''}
                  onChange={(e) => handlePersonalHistoryDetails('epidemic_region_details', e.target.value)}
                  placeholder="Region, duration, known diseases, etc."
                  rows={2}
                  className={inputClassName}
                />
              </div>
            )}
        </div>

          {/* Infected Water Exposure */}
        <div>
            <div className="flex items-center">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                  id="personal_history.infected_water_exposure"
                  name="personal_history.infected_water_exposure"
                  checked={Boolean(formData.personal_history?.infected_water_exposure)}
                  onChange={(e) => handlePersonalHistoryToggle('infected_water_exposure', e.target.checked)}
                  style={{ 
                    backgroundColor: formData.personal_history?.infected_water_exposure ? '#7984E8' : 'transparent', 
                    borderColor: '#7984E8' 
                  }}
                    className={checkboxClassName}
                  />
                </div>
              <label htmlFor="personal_history.infected_water_exposure" className="ml-2 text-sm font-medium">
                Exposure to Infected Water
                </label>
              </div>
            
            {formData.personal_history?.infected_water_exposure && (
              <div className="ml-7 mt-2">
                <label htmlFor="personal_history.infected_water_details" className="block text-sm font-medium">
                  Details
          </label>
          <textarea
                  id="personal_history.infected_water_details"
                  name="personal_history.infected_water_details"
                  value={formData.personal_history?.infected_water_details || ''}
                  onChange={(e) => handlePersonalHistoryDetails('infected_water_details', e.target.value)}
                  placeholder="Source, timing, symptoms after exposure, etc."
                  rows={2}
            className={inputClassName}
          />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Family History */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Family History</h2>
        
        <div className={`${cardClassName} mb-4`}>
          <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Parents Status */}
          <div>
            <label htmlFor="family_history.father.status" className="block text-sm font-medium">
              Father&apos;s Status
            </label>
            <select
              id="family_history.father.status"
              name="family_history.father.status"
                value={formData.family_history?.father.status || 'alive'}
              onChange={handleChange}
              className={inputClassName}
            >
              <option value="alive">Alive</option>
              <option value="deceased">Deceased</option>
            </select>
              
              {formData.family_history?.father.status === 'deceased' && (
                <div className="mt-2">
                  <label htmlFor="family_history.father.cause" className="block text-sm font-medium">
                    Cause of Death
                  </label>
                  <input
                    type="text"
                    id="family_history.father.cause"
                    name="family_history.father.cause"
                    value={formData.family_history?.father.cause || ''}
                    onChange={handleChange}
                    placeholder="e.g. Heart attack, Cancer"
                    className={inputClassName}
                  />
                </div>
              )}
          </div>

          <div>
            <label htmlFor="family_history.mother.status" className="block text-sm font-medium">
              Mother&apos;s Status
            </label>
            <select
              id="family_history.mother.status"
              name="family_history.mother.status"
                value={formData.family_history?.mother.status || 'alive'}
              onChange={handleChange}
              className={inputClassName}
            >
              <option value="alive">Alive</option>
              <option value="deceased">Deceased</option>
            </select>
              
              {formData.family_history?.mother.status === 'deceased' && (
                <div className="mt-2">
                  <label htmlFor="family_history.mother.cause" className="block text-sm font-medium">
                    Cause of Death
                  </label>
                  <input
                    type="text"
                    id="family_history.mother.cause"
                    name="family_history.mother.cause"
                    value={formData.family_history?.mother.cause || ''}
                    onChange={handleChange}
                    placeholder="e.g. Heart attack, Cancer"
                    className={inputClassName}
                  />
                </div>
              )}
          </div>
        </div>

        {/* Family Medical History */}
          <div className="space-y-4">
            {/* Hereditary Diseases */}
            <div>
              <div className="flex items-center">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="family_history.hereditary_diseases"
                    name="family_history.hereditary_diseases"
                    checked={Boolean(formData.family_history?.hereditary_diseases)}
                    onChange={handleCheckboxChange}
                    style={{ backgroundColor: formData.family_history?.hereditary_diseases ? '#7984E8' : 'transparent', borderColor: '#7984E8' }}
                    className={checkboxClassName}
                  />
                </div>
                <label htmlFor="family_history.hereditary_diseases" className="ml-2 text-sm font-medium">
                  Hereditary Diseases
                </label>
              </div>
              
              {formData.family_history?.hereditary_diseases && (
                <div className="ml-7 mt-2">
                  <MedicalConditionCard
                    title="Hereditary Disease Details"
                    backgroundColor="bg-blue-50 dark:bg-blue-900/20"
                    conditionsMap={{}}
                    customConditions={formData.family_history?.hereditary_details || []}
                    onConditionChange={() => {}}
                    onAddCustomCondition={(condition) => handleAddFamilyCondition('hereditary', condition)}
                    onRemoveCustomCondition={(index) => handleRemoveFamilyCondition('hereditary', index)}
                  />
                </div>
              )}
            </div>
            
            {/* Infectious Diseases in Family */}
            <div>
              <div className="flex items-center">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="family_history.infectious_diseases_in_family"
                    name="family_history.infectious_diseases_in_family"
                    checked={Boolean(formData.family_history?.infectious_diseases_in_family)}
                    onChange={handleCheckboxChange}
                    style={{ backgroundColor: formData.family_history?.infectious_diseases_in_family ? '#7984E8' : 'transparent', borderColor: '#7984E8' }}
                    className={checkboxClassName}
                  />
                </div>
                <label htmlFor="family_history.infectious_diseases_in_family" className="ml-2 text-sm font-medium">
                  Infectious Diseases in Family
                </label>
              </div>
              
              {formData.family_history?.infectious_diseases_in_family && (
                <div className="ml-7 mt-2">
                  <MedicalConditionCard
                    title="Infectious Disease Details"
                    backgroundColor="bg-purple-50 dark:bg-purple-900/20"
                    conditionsMap={{}}
                    customConditions={formData.family_history?.infectious_details || []}
                    onConditionChange={() => {}}
                    onAddCustomCondition={(condition) => handleAddFamilyCondition('infectious', condition)}
                    onRemoveCustomCondition={(index) => handleRemoveFamilyCondition('infectious', index)}
                  />
                </div>
              )}
            </div>
            
            {/* Cancer History */}
            <div>
              <div className="flex items-center">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    id="family_history.cancer_history"
                    name="family_history.cancer_history"
                    checked={Boolean(formData.family_history?.cancer_history)}
                    onChange={handleCheckboxChange}
                    style={{ backgroundColor: formData.family_history?.cancer_history ? '#7984E8' : 'transparent', borderColor: '#7984E8' }}
                    className={checkboxClassName}
                  />
                </div>
                <label htmlFor="family_history.cancer_history" className="ml-2 text-sm font-medium">
                  Cancer History in Family
                </label>
              </div>
              
              {formData.family_history?.cancer_history && (
                <div className="ml-7 mt-2">
                  <MedicalConditionCard
                    title="Cancer Types and Details"
                    backgroundColor="bg-yellow-50 dark:bg-yellow-900/20"
                    conditionsMap={{}}
                    customConditions={formData.family_history?.cancer_details || []}
                    onConditionChange={() => {}}
                    onAddCustomCondition={(condition) => handleAddFamilyCondition('cancer', condition)}
                    onRemoveCustomCondition={(index) => handleRemoveFamilyCondition('cancer', index)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Social History and Habits */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Social History and Habits</h2>
        <div className={`${cardClassName}`}>
          {/* Smoking */}
          <div className="mb-4">
            <div className="flex items-center">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="habits.smoking"
                  name="habits.smoking"
                  checked={Boolean(formData.habits?.smoking)}
                  onChange={handleCheckboxChange}
                  style={{ backgroundColor: formData.habits?.smoking ? '#7984E8' : 'transparent', borderColor: '#7984E8' }}
                  className={checkboxClassName}
                />
              </div>
              <label htmlFor="habits.smoking" className="ml-2 text-sm font-medium">
                Smoking
              </label>
            </div>
            
            {formData.habits?.smoking && (
              <div className="ml-7 mt-2 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="smoking-duration" className="block text-sm font-medium">
                    Duration
                  </label>
                  <input
                    type="text"
                    id="smoking-duration"
                    value={formData.habits?.smoking_details?.duration || ''}
                    onChange={(e) => handleHabitDetailsChange('smoking', 'duration', e.target.value)}
                    placeholder="e.g. 5 years"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label htmlFor="smoking-amount" className="block text-sm font-medium">
                    Cigarettes per day
                  </label>
                  <input
                    type="number"
                    id="smoking-amount"
                    value={formData.habits?.smoking_details?.cigarettes_per_day || ''}
                    onChange={(e) => handleHabitDetailsChange('smoking', 'cigarettes_per_day', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 10"
                    className={inputClassName}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Alcohol */}
          <div className="mb-4">
            <div className="flex items-center">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="habits.alcohol"
                  name="habits.alcohol"
                  checked={Boolean(formData.habits?.alcohol)}
                  onChange={handleCheckboxChange}
                  style={{ backgroundColor: formData.habits?.alcohol ? '#7984E8' : 'transparent', borderColor: '#7984E8' }}
                  className={checkboxClassName}
                />
              </div>
              <label htmlFor="habits.alcohol" className="ml-2 text-sm font-medium">
                Alcohol
              </label>
            </div>
            
            {formData.habits?.alcohol && (
              <div className="ml-7 mt-2 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="alcohol-duration" className="block text-sm font-medium">
                    Duration
                  </label>
                  <input
                    type="text"
                    id="alcohol-duration"
                    value={formData.habits?.alcohol_details?.duration || ''}
                    onChange={(e) => handleHabitDetailsChange('alcohol', 'duration', e.target.value)}
                    placeholder="e.g. 10 years"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label htmlFor="alcohol-quantity" className="block text-sm font-medium">
                    Quantity per day
                  </label>
                  <input
                    type="text"
                    id="alcohol-quantity"
                    value={formData.habits?.alcohol_details?.quantity_per_day || ''}
                    onChange={(e) => handleHabitDetailsChange('alcohol', 'quantity_per_day', e.target.value)}
                    placeholder="e.g. 2 glasses of wine"
                    className={inputClassName}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Toxic Exposure */}
          <div>
            <div className="flex items-center">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="habits.toxic_exposure"
                  name="habits.toxic_exposure"
                  checked={Boolean(formData.habits?.toxic_exposure)}
                  onChange={handleCheckboxChange}
                  style={{ backgroundColor: formData.habits?.toxic_exposure ? '#7984E8' : 'transparent', borderColor: '#7984E8' }}
                  className={checkboxClassName}
                />
              </div>
              <label htmlFor="habits.toxic_exposure" className="ml-2 text-sm font-medium">
                Toxic Exposure
              </label>
            </div>
            
            {formData.habits?.toxic_exposure && (
              <div className="ml-7 mt-2 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="toxic-type" className="block text-sm font-medium">
                    Type of Exposure
                  </label>
                  <input
                    type="text"
                    id="toxic-type"
                    value={formData.habits?.toxic_exposure_details?.type || ''}
                    onChange={(e) => handleHabitDetailsChange('toxic_exposure', 'type', e.target.value)}
                    placeholder="e.g. Asbestos, Lead"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label htmlFor="toxic-duration" className="block text-sm font-medium">
                    Duration
                  </label>
                  <input
                    type="text"
                    id="toxic-duration"
                    value={formData.habits?.toxic_exposure_details?.duration || ''}
                    onChange={(e) => handleHabitDetailsChange('toxic_exposure', 'duration', e.target.value)}
                    placeholder="e.g. 3 years"
                    className={inputClassName}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Menstrual History (show only for female patients) */}
      {formData.gender === 'Female' && formData.menstrual_history && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Menstrual History</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="menstrual_history.flow" className="block text-sm font-medium">
                Flow
              </label>
              <input
                type="text"
                id="menstrual_history.flow"
                name="menstrual_history.flow"
                value={formData.menstrual_history.flow}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="menstrual_history.cycle" className="block text-sm font-medium">
                Cycle
              </label>
              <input
                type="text"
                id="menstrual_history.cycle"
                name="menstrual_history.cycle"
                value={formData.menstrual_history.cycle}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="menstrual_history.dysmenorrhea"
                name="menstrual_history.dysmenorrhea"
                checked={formData.menstrual_history?.dysmenorrhea || false}
                onChange={handleCheckboxChange}
                style={{ backgroundColor: formData.menstrual_history?.dysmenorrhea ? '#7984E8' : 'transparent', borderColor: '#7984E8' }}
                className={checkboxClassName}
              />
              <label htmlFor="menstrual_history.dysmenorrhea" className="ml-2 text-sm">
                Dysmenorrhea
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="menstrual_history.post_menopausal_bleeding"
                name="menstrual_history.post_menopausal_bleeding"
                checked={formData.menstrual_history?.post_menopausal_bleeding || false}
                onChange={handleCheckboxChange}
                style={{ backgroundColor: formData.menstrual_history?.post_menopausal_bleeding ? '#7984E8' : 'transparent', borderColor: '#7984E8' }}
                className={checkboxClassName}
              />
              <label htmlFor="menstrual_history.post_menopausal_bleeding" className="ml-2 text-sm">
                Post-menopausal Bleeding
              </label>
            </div>
          </div>
        </section>
      )}

      {/* Vital Signs and Physical Examination */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Vital Signs and Physical Examination</h2>
        <div className={`${cardClassName}`}>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="vital_signs.pulse" className="block text-sm font-medium">
              Pulse (bpm)
            </label>
            <input
              type="number"
              id="vital_signs.pulse"
              name="vital_signs.pulse"
              value={formData.vital_signs?.pulse || 0}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="vital_signs.respiration" className="block text-sm font-medium">
              Respiration Rate
            </label>
            <input
              type="number"
              id="vital_signs.respiration"
              name="vital_signs.respiration"
              value={formData.vital_signs?.respiration || 0}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="vital_signs.blood_pressure" className="block text-sm font-medium">
              Blood Pressure
            </label>
            <input
              type="text"
              id="vital_signs.blood_pressure"
              name="vital_signs.blood_pressure"
              placeholder="120/80"
              value={formData.vital_signs?.blood_pressure || ''}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="vital_signs.temperature" className="block text-sm font-medium">
              Temperature (°C)
            </label>
            <input
              type="number"
              step="0.1"
              id="vital_signs.temperature"
              name="vital_signs.temperature"
              value={formData.vital_signs?.temperature || 0}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="vital_signs.weight" className="block text-sm font-medium">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              id="vital_signs.weight"
              name="vital_signs.weight"
              value={formData.vital_signs?.weight || ''}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="vital_signs.height" className="block text-sm font-medium">
              Height (cm)
            </label>
            <input
              type="number"
              id="vital_signs.height"
              name="vital_signs.height"
              value={formData.vital_signs?.height || ''}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>
        </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label htmlFor="consciousness" className="block text-sm font-medium">
              Consciousness Level
            </label>
              <select
              id="consciousness"
              name="consciousness"
              value={formData.consciousness}
              onChange={handleChange}
              className={inputClassName}
              >
                <option value="Alert">Alert</option>
                <option value="Drowsy">Drowsy</option>
                <option value="Lethargic">Lethargic</option>
                <option value="Stuporous">Stuporous</option>
                <option value="Comatose">Comatose</option>
              </select>
            </div>

            <div>
              <label htmlFor="orientation" className="block text-sm font-medium">
                Orientation
              </label>
              <select
                id="orientation"
                name="orientation"
                value={formData.orientation}
                onChange={handleChange}
                className={inputClassName}
              >
                <option value="Oriented">Oriented in time and space</option>
                <option value="Not oriented">Not oriented</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="mental_status" className="block text-sm font-medium">
                Mental Status
              </label>
              <input
                type="text"
                id="mental_status"
                name="mental_status"
                value={formData.mental_status}
                onChange={handleChange}
                placeholder="Memory, attention, language, etc."
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="cooperation" className="block text-sm font-medium">
              Cooperation
            </label>
            <input
              type="text"
              id="cooperation"
              name="cooperation"
              value={formData.cooperation}
              onChange={handleChange}
              className={inputClassName}
            />
          </div>
        </div>

          <div className="mt-4">
          <label htmlFor="general_appearance" className="block text-sm font-medium">
            General Appearance
          </label>
          <textarea
            id="general_appearance"
            name="general_appearance"
            value={formData.general_appearance}
            onChange={handleChange}
            rows={2}
            className={inputClassName}
          />
        </div>

          <div className="mt-4">
          <label htmlFor="special_positions" className="block text-sm font-medium">
            Special Positions/Posture
          </label>
          <textarea
            id="special_positions"
            name="special_positions"
            value={formData.special_positions}
            onChange={handleChange}
            rows={2}
            className={inputClassName}
          />
          </div>
        </div>
      </section>

      {/* Neurological Examination with enhanced Cranial Nerves section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Neurological Examination</h2>
        <div className={`${cardClassName}`}>
          {/* Meningeal Signs */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Meningeal Signs</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Neck Stiffness</label>
                <div className="relative w-36 h-8 shadow-sm overflow-hidden rounded-md">
                  <div 
                    className="absolute inset-0 flex items-center border border-[var(--input-border)] cursor-pointer bg-[var(--input)] rounded-md"
                    onClick={() => {
                      const newValue = formData.neurological_examination?.meningeal_signs.neck_stiffness === 'positive' ? 'negative' : 'positive';
                      handleMeningealSignChange('neck_stiffness', newValue);
                    }}
                  >
                    <div className="absolute inset-0 flex">
                      <div className="w-1/2 flex items-center justify-center text-xs font-medium z-10"
                        style={{ color: formData.neurological_examination?.meningeal_signs.neck_stiffness === 'negative' ? 'white' : 'var(--muted-foreground)' }}>
                        Negative
                      </div>
                      <div className="w-1/2 flex items-center justify-center text-xs font-medium z-10"
                        style={{ color: formData.neurological_examination?.meningeal_signs.neck_stiffness === 'positive' ? 'white' : 'var(--muted-foreground)' }}>
                        Positive
                      </div>
                    </div>

                    <motion.div
                      className="absolute top-0 bottom-0 w-1/2 z-0 rounded-sm"
                      animate={{
                        x: formData.neurological_examination?.meningeal_signs.neck_stiffness === 'positive' ? '100%' : 0,
                        backgroundColor: '#7984E8'
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30
                      }}
                    />
                  </div>
                </div>
              </div>

        <div>
                <label className="block text-sm font-medium mb-2">Kernig&apos;s Sign</label>
                <div className="relative w-36 h-8 shadow-sm overflow-hidden rounded-md">
                  <div 
                    className="absolute inset-0 flex items-center border border-[var(--input-border)] cursor-pointer bg-[var(--input)] rounded-md"
                    onClick={() => {
                      const newValue = formData.neurological_examination?.meningeal_signs.kernig_sign === 'positive' ? 'negative' : 'positive';
                      handleMeningealSignChange('kernig_sign', newValue);
                    }}
                  >
                    <div className="absolute inset-0 flex">
                      <div className="w-1/2 flex items-center justify-center text-xs font-medium z-10"
                        style={{ color: formData.neurological_examination?.meningeal_signs.kernig_sign === 'negative' ? 'white' : 'var(--muted-foreground)' }}>
                        Negative
                      </div>
                      <div className="w-1/2 flex items-center justify-center text-xs font-medium z-10"
                        style={{ color: formData.neurological_examination?.meningeal_signs.kernig_sign === 'positive' ? 'white' : 'var(--muted-foreground)' }}>
                        Positive
                      </div>
                    </div>

                    <motion.div
                      className="absolute top-0 bottom-0 w-1/2 z-0 rounded-sm"
                      animate={{
                        x: formData.neurological_examination?.meningeal_signs.kernig_sign === 'positive' ? '100%' : 0,
                        backgroundColor: '#7984E8'
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30
                      }}
                    />
                  </div>
                </div>
              </div>

            <div>
                <label className="block text-sm font-medium mb-2">Brudzinski&apos;s Sign</label>
                <div className="relative w-36 h-8 shadow-sm overflow-hidden rounded-md">
                  <div 
                    className="absolute inset-0 flex items-center border border-[var(--input-border)] cursor-pointer bg-[var(--input)] rounded-md"
                    onClick={() => {
                      const newValue = formData.neurological_examination?.meningeal_signs.brudzinski_sign === 'positive' ? 'negative' : 'positive';
                      handleMeningealSignChange('brudzinski_sign', newValue);
                    }}
                  >
                    <div className="absolute inset-0 flex">
                      <div className="w-1/2 flex items-center justify-center text-xs font-medium z-10"
                        style={{ color: formData.neurological_examination?.meningeal_signs.brudzinski_sign === 'negative' ? 'white' : 'var(--muted-foreground)' }}>
                        Negative
                      </div>
                      <div className="w-1/2 flex items-center justify-center text-xs font-medium z-10"
                        style={{ color: formData.neurological_examination?.meningeal_signs.brudzinski_sign === 'positive' ? 'white' : 'var(--muted-foreground)' }}>
                        Positive
                      </div>
                    </div>

                    <motion.div
                      className="absolute top-0 bottom-0 w-1/2 z-0 rounded-sm"
                      animate={{
                        x: formData.neurological_examination?.meningeal_signs.brudzinski_sign === 'positive' ? '100%' : 0,
                        backgroundColor: '#7984E8'
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cranial Nerves - Complete table-based redesign */}
          <div>
            <h3 className="text-lg font-medium mb-4">Cranial Nerves Examination</h3>
            <div className="overflow-hidden rounded-lg border border-[var(--border)] mb-4">
              <table className="w-full text-sm">
                <thead className="bg-[var(--muted)]">
                  <tr>
                    <th className="py-2 px-4 text-left font-medium">Nerve</th>
                    <th className="py-2 px-4 text-left font-medium">Examination</th>
                    <th className="py-2 px-4 text-left font-medium">Status</th>
                    <th className="py-2 px-4 text-left font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {/* CN I */}
                  <tr className="odd:bg-[var(--card)] even:bg-[var(--background)] hover:bg-[#2D336B]">
                    <td className="py-2 px-4 font-medium">CN I</td>
                    <td className="py-2 px-4">Smell test</td>
                    <td className="py-2 px-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Left nostril</label>
                          <select
                            value={formData.neurological_examination?.cranial_nerves.cn_i?.status || 'normal'}
                            onChange={(e) => handleCranialNerveChange('cn_i', 'status', e.target.value)}
                            className={inputClassName}
                          >
                            <option value="normal">Normal</option>
                            <option value="anosmia">Anosmia</option>
                            <option value="uncooperate">Uncooperative</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Right nostril</label>
                          <select
                            value={formData.neurological_examination?.cranial_nerves.cn_i?.right_status || 'normal'}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                neurological_examination: {
                                  ...prev.neurological_examination!,
                                  cranial_nerves: {
                                    ...prev.neurological_examination!.cranial_nerves,
                                    cn_i: {
                                      ...prev.neurological_examination!.cranial_nerves.cn_i,
                                      right_status: e.target.value
                                    }
                                  }
                                }
                              }));
                            }}
                            className={inputClassName}
                          >
                            <option value="normal">Normal</option>
                            <option value="anosmia">Anosmia</option>
                            <option value="uncooperate">Uncooperative</option>
                          </select>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={formData.neurological_examination?.cranial_nerves.cn_i?.notes || ''}
                        onChange={(e) => handleCranialNerveChange('cn_i', 'notes', e.target.value)}
                        placeholder="Notes"
                        className={inputClassName}
                      />
                    </td>
                  </tr>
                  
                  {/* CN II */}
                  <tr className="odd:bg-[var(--card)] even:bg-[var(--background)] hover:bg-[#2D336B]">
                    <td className="py-2 px-4 font-medium">CN II</td>
                    <td className="py-2 px-4">Visual examination</td>
                    <td className="py-2 px-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Visual Acuity</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Left eye</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_ii?.visual_acuity_left || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_ii: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_ii,
                                          visual_acuity_left: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Normal</option>
                                <option value="impaired">Impaired</option>
                                <option value="severely_impaired">Severely impaired</option>
                                <option value="blind">Blind</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Right eye</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_ii?.visual_acuity_right || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_ii: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_ii,
                                          visual_acuity_right: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Normal</option>
                                <option value="impaired">Impaired</option>
                                <option value="severely_impaired">Severely impaired</option>
                                <option value="blind">Blind</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Visual Fields</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Left eye</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_ii?.visual_fields_left || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_ii: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_ii,
                                          visual_fields_left: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Full field</option>
                                <option value="defect">Field defect</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Right eye</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_ii?.visual_fields_right || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_ii: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_ii,
                                          visual_fields_right: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Full field</option>
                                <option value="defect">Field defect</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Fundus Exam</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Left eye</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_ii?.fundus_left || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_ii: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_ii,
                                          fundus_left: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Normal disc</option>
                                <option value="papilledema">Papilledema</option>
                                <option value="atrophy">Optic atrophy</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Right eye</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_ii?.fundus_right || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_ii: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_ii,
                                          fundus_right: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Normal disc</option>
                                <option value="papilledema">Papilledema</option>
                                <option value="atrophy">Optic atrophy</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={formData.neurological_examination?.cranial_nerves.cn_ii?.notes || ''}
                        onChange={(e) => handleCranialNerveChange('cn_ii', 'notes', e.target.value)}
                        placeholder="Notes"
                        className={inputClassName}
                      />
                    </td>
                  </tr>
                  
                  {/* CN III, IV, VI */}
                  <tr className="odd:bg-[var(--card)] even:bg-[var(--background)] hover:bg-[#2D336B]">
                    <td className="py-2 px-4 font-medium">CN III, IV, VI</td>
                    <td className="py-2 px-4">Eye movement, pupil reactivity</td>
                    <td className="py-2 px-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Pupil Size</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Left eye (mm)</label>
              <input
                type="number"
                step="0.1"
                                value={formData.neurological_examination?.cranial_nerves.pupil_size.left || 3.5}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        pupil_size: {
                                          ...prev.neurological_examination!.cranial_nerves.pupil_size,
                                          left: parseFloat(e.target.value)
                                        }
                                      }
                                    }
                                  }));
                                }}
                className={inputClassName}
              />
            </div>
            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Right eye (mm)</label>
              <input
                type="number"
                step="0.1"
                                value={formData.neurological_examination?.cranial_nerves.pupil_size.right || 3.5}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        pupil_size: {
                                          ...prev.neurological_examination!.cranial_nerves.pupil_size,
                                          right: parseFloat(e.target.value)
                                        }
                                      }
                                    }
                                  }));
                                }}
                className={inputClassName}
              />
                            </div>
                          </div>
            </div>

            <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Light Reflex</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Left eye</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.light_reflex.direct || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        light_reflex: {
                                          ...prev.neurological_examination!.cranial_nerves.light_reflex,
                                          direct: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Normal - Brisk</option>
                                <option value="sluggish">Sluggish</option>
                                <option value="nonreactive">Non-reactive</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Right eye</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.light_reflex.indirect || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        light_reflex: {
                                          ...prev.neurological_examination!.cranial_nerves.light_reflex,
                                          indirect: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Normal - Brisk</option>
                                <option value="sluggish">Sluggish</option>
                                <option value="nonreactive">Non-reactive</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-xs text-[var(--muted-foreground)] mb-1">Left Eye</label>
                            <div className="flex flex-col space-y-1">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={formData.neurological_examination?.cranial_nerves.cn_iii_iv_vi?.ptosis_left || false}
                                  onChange={(e) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      neurological_examination: {
                                        ...prev.neurological_examination!,
                                        cranial_nerves: {
                                          ...prev.neurological_examination!.cranial_nerves,
                                          cn_iii_iv_vi: {
                                            ...prev.neurological_examination!.cranial_nerves.cn_iii_iv_vi,
                                            ptosis_left: e.target.checked
                                          }
                                        }
                                      }
                                    }));
                                  }}
                                  className="h-4 w-4 rounded-sm border-[var(--border)]"
                                />
                                <span className="text-sm">Ptosis</span>
              </label>

                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={formData.neurological_examination?.cranial_nerves.cn_iii_iv_vi?.nystagmus_left || false}
                                  onChange={(e) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      neurological_examination: {
                                        ...prev.neurological_examination!,
                                        cranial_nerves: {
                                          ...prev.neurological_examination!.cranial_nerves,
                                          cn_iii_iv_vi: {
                                            ...prev.neurological_examination!.cranial_nerves.cn_iii_iv_vi,
                                            nystagmus_left: e.target.checked
                                          }
                                        }
                                      }
                                    }));
                                  }}
                                  className="h-4 w-4 rounded-sm border-[var(--border)]"
                                />
                                <span className="text-sm">Nystagmus</span>
                              </label>

                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={formData.neurological_examination?.cranial_nerves.cn_iii_iv_vi?.diplopia_left || false}
                                  onChange={(e) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      neurological_examination: {
                                        ...prev.neurological_examination!,
                                        cranial_nerves: {
                                          ...prev.neurological_examination!.cranial_nerves,
                                          cn_iii_iv_vi: {
                                            ...prev.neurological_examination!.cranial_nerves.cn_iii_iv_vi,
                                            diplopia_left: e.target.checked
                                          }
                                        }
                                      }
                                    }));
                                  }}
                                  className="h-4 w-4 rounded-sm border-[var(--border)]"
                                />
                                <span className="text-sm">Diplopia</span>
                              </label>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-xs text-[var(--muted-foreground)] mb-1">Right Eye</label>
                            <div className="flex flex-col space-y-1">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={formData.neurological_examination?.cranial_nerves.cn_iii_iv_vi?.ptosis_right || false}
                                  onChange={(e) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      neurological_examination: {
                                        ...prev.neurological_examination!,
                                        cranial_nerves: {
                                          ...prev.neurological_examination!.cranial_nerves,
                                          cn_iii_iv_vi: {
                                            ...prev.neurological_examination!.cranial_nerves.cn_iii_iv_vi,
                                            ptosis_right: e.target.checked
                                          }
                                        }
                                      }
                                    }));
                                  }}
                                  className="h-4 w-4 rounded-sm border-[var(--border)]"
                                />
                                <span className="text-sm">Ptosis</span>
                              </label>

                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={formData.neurological_examination?.cranial_nerves.cn_iii_iv_vi?.nystagmus_right || false}
                                  onChange={(e) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      neurological_examination: {
                                        ...prev.neurological_examination!,
                                        cranial_nerves: {
                                          ...prev.neurological_examination!.cranial_nerves,
                                          cn_iii_iv_vi: {
                                            ...prev.neurological_examination!.cranial_nerves.cn_iii_iv_vi,
                                            nystagmus_right: e.target.checked
                                          }
                                        }
                                      }
                                    }));
                                  }}
                                  className="h-4 w-4 rounded-sm border-[var(--border)]"
                                />
                                <span className="text-sm">Nystagmus</span>
                              </label>

                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={formData.neurological_examination?.cranial_nerves.cn_iii_iv_vi?.diplopia_right || false}
                                  onChange={(e) => {
                                    setFormData(prev => ({
                                      ...prev,
                                      neurological_examination: {
                                        ...prev.neurological_examination!,
                                        cranial_nerves: {
                                          ...prev.neurological_examination!.cranial_nerves,
                                          cn_iii_iv_vi: {
                                            ...prev.neurological_examination!.cranial_nerves.cn_iii_iv_vi,
                                            diplopia_right: e.target.checked
                                          }
                                        }
                                      }
                                    }));
                                  }}
                                  className="h-4 w-4 rounded-sm border-[var(--border)]"
                                />
                                <span className="text-sm">Diplopia</span>
                              </label>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Eye Movement</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Left</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_iii_iv_vi?.eye_movement_left || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_iii_iv_vi: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_iii_iv_vi,
                                          eye_movement_left: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Full movement</option>
                                <option value="limited">Limited movement</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Right</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_iii_iv_vi?.eye_movement_right || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_iii_iv_vi: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_iii_iv_vi,
                                          eye_movement_right: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Full movement</option>
                                <option value="limited">Limited movement</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4">
              <input
                type="text"
                        value={formData.neurological_examination?.cranial_nerves.cn_iii_iv_vi?.notes || ''}
                        onChange={(e) => handleCranialNerveChange('cn_iii_iv_vi', 'notes', e.target.value)}
                        placeholder="Notes"
                className={inputClassName}
              />
                    </td>
                  </tr>
                  
                  {/* CN V */}
                  <tr className="odd:bg-[var(--card)] even:bg-[var(--background)] hover:bg-[#2D336B]">
                    <td className="py-2 px-4 font-medium">CN V</td>
                    <td className="py-2 px-4">Trigeminal nerve</td>
                    <td className="py-2 px-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Facial Sensation</label>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">V1 (Ophthalmic)</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_v?.sensation_v1 || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_v: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_v,
                                          sensation_v1: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Normal</option>
                                <option value="decreased">Decreased</option>
                                <option value="absent">Absent</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">V2 (Maxillary)</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_v?.sensation_v2 || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_v: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_v,
                                          sensation_v2: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Normal</option>
                                <option value="decreased">Decreased</option>
                                <option value="absent">Absent</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">V3 (Mandibular)</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_v?.sensation_v3 || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_v: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_v,
                                          sensation_v3: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Normal</option>
                                <option value="decreased">Decreased</option>
                                <option value="absent">Absent</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                          </div>
            </div>

            <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Corneal Reflex</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Left</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_v?.corneal_left || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_v: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_v,
                                          corneal_left: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Present</option>
                                <option value="decreased">Decreased</option>
                                <option value="absent">Absent</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Right</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_v?.corneal_right || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_v: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_v,
                                          corneal_right: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Present</option>
                                <option value="decreased">Decreased</option>
                                <option value="absent">Absent</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Jaw Strength</label>
                          <select
                            value={formData.neurological_examination?.cranial_nerves.cn_v?.jaw_strength || 'normal'}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                neurological_examination: {
                                  ...prev.neurological_examination!,
                                  cranial_nerves: {
                                    ...prev.neurological_examination!.cranial_nerves,
                                    cn_v: {
                                      ...prev.neurological_examination!.cranial_nerves.cn_v,
                                      jaw_strength: e.target.value
                                    }
                                  }
                                }
                              }));
                            }}
                            className={inputClassName}
                          >
                            <option value="normal">Normal</option>
                            <option value="weak">Weak</option>
                            <option value="uncooperate">Uncooperative</option>
                          </select>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4">
              <input
                type="text"
                        value={formData.neurological_examination?.cranial_nerves.cn_v?.notes || ''}
                        onChange={(e) => handleCranialNerveChange('cn_v', 'notes', e.target.value)}
                        placeholder="Notes"
                        className={inputClassName}
                      />
                    </td>
                  </tr>
                  
                  {/* CN VII */}
                  <tr className="odd:bg-[var(--card)] even:bg-[var(--background)] hover:bg-[#2D336B]">
                    <td className="py-2 px-4 font-medium">CN VII</td>
                    <td className="py-2 px-4">Facial nerve</td>
                    <td className="py-2 px-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Eye Fissure (mm)</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Left</label>
                              <input
                                type="number"
                                step="0.5"
                                value={formData.neurological_examination?.cranial_nerves.cn_vii?.eye_fissure_left || 0}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_vii: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_vii,
                                          eye_fissure_left: parseFloat(e.target.value)
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Right</label>
                              <input
                                type="number"
                                step="0.5"
                                value={formData.neurological_examination?.cranial_nerves.cn_vii?.eye_fissure_right || 0}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_vii: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_vii,
                                          eye_fissure_right: parseFloat(e.target.value)
                                        }
                                      }
                                    }
                                  }));
                                }}
                className={inputClassName}
              />
            </div>
          </div>
        </div>

        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Nasolabial Fold</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Left</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_vii?.nasolabial_left || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_vii: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_vii,
                                          nasolabial_left: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Normal</option>
                                <option value="flattened">Flattened</option>
                                <option value="absent">Absent</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Right</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_vii?.nasolabial_right || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_vii: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_vii,
                                          nasolabial_right: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Normal</option>
                                <option value="flattened">Flattened</option>
                                <option value="absent">Absent</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Mouth Deviation</label>
                          <select
                            value={formData.neurological_examination?.cranial_nerves.cn_vii?.mouth_deviation || 'none'}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                neurological_examination: {
                                  ...prev.neurological_examination!,
                                  cranial_nerves: {
                                    ...prev.neurological_examination!.cranial_nerves,
                                    cn_vii: {
                                      ...prev.neurological_examination!.cranial_nerves.cn_vii,
                                      mouth_deviation: e.target.value
                                    }
                                  }
                                }
                              }));
                            }}
                            className={inputClassName}
                          >
                            <option value="none">None</option>
                            <option value="right">Rightward</option>
                            <option value="left">Leftward</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Facial Movements</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="col-span-2">
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_vii?.facial_movement || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_vii: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_vii,
                                          facial_movement: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Normal</option>
                                <option value="partial">Partial weakness</option>
                                <option value="paralysis">Complete paralysis</option>
                                <option value="uncooperate">Unable to cooperate</option>
                              </select>
                            </div>
                            <div className="col-span-2 text-xs text-[var(--muted-foreground)]">
                              <div className="mt-1 italic">Includes: Forehead wrinkling, eye closing, puffing cheeks, whistling, showing teeth</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={formData.neurological_examination?.cranial_nerves.cn_vii?.notes || ''}
                        onChange={(e) => handleCranialNerveChange('cn_vii', 'notes', e.target.value)}
                        placeholder="Notes"
                        className={inputClassName}
                      />
                    </td>
                  </tr>
                  
                  {/* CN VIII */}
                  <tr className="odd:bg-[var(--card)] even:bg-[var(--background)] hover:bg-[#2D336B]">
                    <td className="py-2 px-4 font-medium">CN VIII</td>
                    <td className="py-2 px-4">Hearing</td>
                    <td className="py-2 px-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Hearing Test</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Left</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_viii?.hearing_left || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_viii: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_viii,
                                          hearing_left: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Normal</option>
                                <option value="decreased">Decreased</option>
                                <option value="deaf">Deaf</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Right</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_viii?.hearing_right || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_viii: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_viii,
                                          hearing_right: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Normal</option>
                                <option value="decreased">Decreased</option>
                                <option value="deaf">Deaf</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Rinne Test</label>
                          <select
                            value={formData.neurological_examination?.cranial_nerves.cn_viii?.rinne_test || 'normal'}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                neurological_examination: {
                                  ...prev.neurological_examination!,
                                  cranial_nerves: {
                                    ...prev.neurological_examination!.cranial_nerves,
                                    cn_viii: {
                                      ...prev.neurological_examination!.cranial_nerves.cn_viii,
                                      rinne_test: e.target.value
                                    }
                                  }
                                }
                              }));
                            }}
                            className={inputClassName}
                          >
                            <option value="normal">Positive (AC > BC)</option>
                            <option value="abnormal">Negative (BC > AC)</option>
                            <option value="uncooperate">Uncooperative</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Weber Test</label>
                          <select
                            value={formData.neurological_examination?.cranial_nerves.cn_viii?.weber_test || 'normal'}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                neurological_examination: {
                                  ...prev.neurological_examination!,
                                  cranial_nerves: {
                                    ...prev.neurological_examination!.cranial_nerves,
                                    cn_viii: {
                                      ...prev.neurological_examination!.cranial_nerves.cn_viii,
                                      weber_test: e.target.value
                                    }
                                  }
                                }
                              }));
                            }}
                            className={inputClassName}
                          >
                            <option value="normal">Midline</option>
                            <option value="left">Lateralizes to left</option>
                            <option value="right">Lateralizes to right</option>
                            <option value="uncooperate">Uncooperative</option>
                          </select>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={formData.neurological_examination?.cranial_nerves.cn_viii?.notes || ''}
                        onChange={(e) => handleCranialNerveChange('cn_viii', 'notes', e.target.value)}
                        placeholder="Notes"
                        className={inputClassName}
                      />
                    </td>
                  </tr>
                  
                  {/* CN IX, X */}
                  <tr className="odd:bg-[var(--card)] even:bg-[var(--background)] hover:bg-[#2D336B]">
                    <td className="py-2 px-4 font-medium">CN IX, X</td>
                    <td className="py-2 px-4">Glossopharyngeal and Vagus</td>
                    <td className="py-2 px-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Palate Elevation</label>
                          <select
                            value={formData.neurological_examination?.cranial_nerves.cn_ix_x?.palate_elevation || 'normal'}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                neurological_examination: {
                                  ...prev.neurological_examination!,
                                  cranial_nerves: {
                                    ...prev.neurological_examination!.cranial_nerves,
                                    cn_ix_x: {
                                      ...prev.neurological_examination!.cranial_nerves.cn_ix_x,
                                      palate_elevation: e.target.value
                                    }
                                  }
                                }
                              }));
                            }}
                            className={inputClassName}
                          >
                            <option value="normal">Symmetric</option>
                            <option value="asymmetric">Asymmetric</option>
                            <option value="absent">Absent</option>
                            <option value="uncooperate">Uncooperative</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Gag Reflex</label>
                          <select
                            value={formData.neurological_examination?.cranial_nerves.cn_ix_x?.gag_reflex || 'normal'}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                neurological_examination: {
                                  ...prev.neurological_examination!,
                                  cranial_nerves: {
                                    ...prev.neurological_examination!.cranial_nerves,
                                    cn_ix_x: {
                                      ...prev.neurological_examination!.cranial_nerves.cn_ix_x,
                                      gag_reflex: e.target.value
                                    }
                                  }
                                }
                              }));
                            }}
                            className={inputClassName}
                          >
                            <option value="normal">Present</option>
                            <option value="decreased">Decreased</option>
                            <option value="absent">Absent</option>
                            <option value="uncooperate">Uncooperative</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Speech</label>
                          <select
                            value={formData.neurological_examination?.cranial_nerves.cn_ix_x?.speech || 'normal'}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                neurological_examination: {
                                  ...prev.neurological_examination!,
                                  cranial_nerves: {
                                    ...prev.neurological_examination!.cranial_nerves,
                                    cn_ix_x: {
                                      ...prev.neurological_examination!.cranial_nerves.cn_ix_x,
                                      speech: e.target.value
                                    }
                                  }
                                }
                              }));
                            }}
                            className={inputClassName}
                          >
                            <option value="normal">Normal</option>
                            <option value="dysarthria">Dysarthria</option>
                            <option value="aphonia">Aphonia</option>
                            <option value="uncooperate">Uncooperative</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Swallowing</label>
                          <select
                            value={formData.neurological_examination?.cranial_nerves.cn_ix_x?.swallowing || 'normal'}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                neurological_examination: {
                                  ...prev.neurological_examination!,
                                  cranial_nerves: {
                                    ...prev.neurological_examination!.cranial_nerves,
                                    cn_ix_x: {
                                      ...prev.neurological_examination!.cranial_nerves.cn_ix_x,
                                      swallowing: e.target.value
                                    }
                                  }
                                }
                              }));
                            }}
                            className={inputClassName}
                          >
                            <option value="normal">Normal</option>
                            <option value="impaired">Impaired</option>
                            <option value="unable">Unable</option>
                            <option value="uncooperate">Uncooperative</option>
                          </select>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={formData.neurological_examination?.cranial_nerves.cn_ix_x?.notes || ''}
                        onChange={(e) => handleCranialNerveChange('cn_ix_x', 'notes', e.target.value)}
                        placeholder="Notes"
                        className={inputClassName}
                      />
                    </td>
                  </tr>
                  
                  {/* CN XI */}
                  <tr className="odd:bg-[var(--card)] even:bg-[var(--background)] hover:bg-[#2D336B]">
                    <td className="py-2 px-4 font-medium">CN XI</td>
                    <td className="py-2 px-4">Accessory nerve</td>
                    <td className="py-2 px-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">SCM Strength</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Left</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_xi?.scm_strength_left || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_xi: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_xi,
                                          scm_strength_left: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Normal</option>
                                <option value="weak">Weak</option>
                                <option value="absent">Absent</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Right</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_xi?.scm_strength_right || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_xi: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_xi,
                                          scm_strength_right: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Normal</option>
                                <option value="weak">Weak</option>
                                <option value="absent">Absent</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Trapezius Strength</label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Left</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_xi?.trapezius_strength_left || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_xi: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_xi,
                                          trapezius_strength_left: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Normal</option>
                                <option value="weak">Weak</option>
                                <option value="absent">Absent</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-[var(--muted-foreground)]">Right</label>
                              <select
                                value={formData.neurological_examination?.cranial_nerves.cn_xi?.trapezius_strength_right || 'normal'}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_xi: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_xi,
                                          trapezius_strength_right: e.target.value
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className={inputClassName}
                              >
                                <option value="normal">Normal</option>
                                <option value="weak">Weak</option>
                                <option value="absent">Absent</option>
                                <option value="uncooperate">Uncooperative</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={formData.neurological_examination?.cranial_nerves.cn_xi?.notes || ''}
                        onChange={(e) => handleCranialNerveChange('cn_xi', 'notes', e.target.value)}
                        placeholder="Notes"
                        className={inputClassName}
                      />
                    </td>
                  </tr>
                  
                  {/* CN XII */}
                  <tr className="odd:bg-[var(--card)] even:bg-[var(--background)] hover:bg-[#2D336B]">
                    <td className="py-2 px-4 font-medium">CN XII</td>
                    <td className="py-2 px-4">Hypoglossal nerve</td>
                    <td className="py-2 px-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Tongue Position</label>
                          <select
                            value={formData.neurological_examination?.cranial_nerves.cn_xii?.tongue_position || 'midline'}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                neurological_examination: {
                                  ...prev.neurological_examination!,
                                  cranial_nerves: {
                                    ...prev.neurological_examination!.cranial_nerves,
                                    cn_xii: {
                                      ...prev.neurological_examination!.cranial_nerves.cn_xii,
                                      tongue_position: e.target.value
                                    }
                                  }
                                }
                              }));
                            }}
                            className={inputClassName}
                          >
                            <option value="midline">Midline</option>
                            <option value="deviates_left">Deviates left</option>
                            <option value="deviates_right">Deviates right</option>
                            <option value="uncooperate">Uncooperative</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-[var(--muted-foreground)] mb-1">Tongue Strength</label>
                          <select
                            value={formData.neurological_examination?.cranial_nerves.cn_xii?.tongue_strength || 'normal'}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                neurological_examination: {
                                  ...prev.neurological_examination!,
                                  cranial_nerves: {
                                    ...prev.neurological_examination!.cranial_nerves,
                                    cn_xii: {
                                      ...prev.neurological_examination!.cranial_nerves.cn_xii,
                                      tongue_strength: e.target.value
                                    }
                                  }
                                }
                              }));
                            }}
                            className={inputClassName}
                          >
                            <option value="normal">Normal</option>
                            <option value="weak">Weak</option>
                            <option value="uncooperate">Uncooperative</option>
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.neurological_examination?.cranial_nerves.cn_xii?.tongue_atrophy || false}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_xii: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_xii,
                                          tongue_atrophy: e.target.checked
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className="h-4 w-4 rounded-sm border-[var(--border)]"
                              />
                              <span className="text-sm">Atrophy</span>
                            </label>
                          </div>
                          <div>
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={formData.neurological_examination?.cranial_nerves.cn_xii?.tongue_fasciculations || false}
                                onChange={(e) => {
                                  setFormData(prev => ({
                                    ...prev,
                                    neurological_examination: {
                                      ...prev.neurological_examination!,
                                      cranial_nerves: {
                                        ...prev.neurological_examination!.cranial_nerves,
                                        cn_xii: {
                                          ...prev.neurological_examination!.cranial_nerves.cn_xii,
                                          tongue_fasciculations: e.target.checked
                                        }
                                      }
                                    }
                                  }));
                                }}
                                className="h-4 w-4 rounded-sm border-[var(--border)]"
                              />
                              <span className="text-sm">Fasciculations</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={formData.neurological_examination?.cranial_nerves.cn_xii?.notes || ''}
                        onChange={(e) => handleCranialNerveChange('cn_xii', 'notes', e.target.value)}
                        placeholder="Notes"
                        className={inputClassName}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Keep the original light reflex section since it's separate */}
          <div className="mt-6"></div>

          {/* Motor Examination - Keep existing code */}
          <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Motor Examination</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="neurological_examination.motor.strength.upper_limbs.left" className="block text-sm font-medium">
                Left Upper Limb Strength (0-5)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                id="neurological_examination.motor.strength.upper_limbs.left"
                name="neurological_examination.motor.strength.upper_limbs.left"
                value={formData.neurological_examination?.motor.strength.upper_limbs.left || 0}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="neurological_examination.motor.strength.lower_limbs.left" className="block text-sm font-medium">
                Left Lower Limb Strength (0-5)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                id="neurological_examination.motor.strength.lower_limbs.left"
                name="neurological_examination.motor.strength.lower_limbs.left"
                value={formData.neurological_examination?.motor.strength.lower_limbs.left || 0}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="neurological_examination.motor.strength.upper_limbs.right" className="block text-sm font-medium">
                Right Upper Limb Strength (0-5)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                id="neurological_examination.motor.strength.upper_limbs.right"
                name="neurological_examination.motor.strength.upper_limbs.right"
                value={formData.neurological_examination?.motor.strength.upper_limbs.right || 0}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="neurological_examination.motor.strength.lower_limbs.right" className="block text-sm font-medium">
                Right Lower Limb Strength (0-5)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                id="neurological_examination.motor.strength.lower_limbs.right"
                name="neurological_examination.motor.strength.lower_limbs.right"
                value={formData.neurological_examination?.motor.strength.lower_limbs.right || 0}
                onChange={handleChange}
                className={inputClassName}
              />
            </div>
          </div>
        </div>

        {/* Other Neurological Findings */}
          <div className="grid grid-cols-2 gap-4 mt-6">
          <div>
            <label htmlFor="neurological_examination.reflexes" className="block text-sm font-medium">
              Reflexes
            </label>
            <textarea
              id="neurological_examination.reflexes"
              name="neurological_examination.reflexes"
              value={formData.neurological_examination?.reflexes || ''}
              onChange={handleChange}
              rows={3}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="neurological_examination.coordination" className="block text-sm font-medium">
              Coordination
            </label>
            <textarea
              id="neurological_examination.coordination"
              name="neurological_examination.coordination"
              value={formData.neurological_examination?.coordination || ''}
              onChange={handleChange}
              rows={3}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="neurological_examination.sensory" className="block text-sm font-medium">
              Sensory Examination
            </label>
            <textarea
              id="neurological_examination.sensory"
              name="neurological_examination.sensory"
              value={formData.neurological_examination?.sensory || ''}
              onChange={handleChange}
              rows={3}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="neurological_examination.autonomic_signs" className="block text-sm font-medium">
              Autonomic Signs
            </label>
            <textarea
              id="neurological_examination.autonomic_signs"
              name="neurological_examination.autonomic_signs"
              value={formData.neurological_examination?.autonomic_signs || ''}
              onChange={handleChange}
              rows={3}
              className={inputClassName}
            />
            </div>
          </div>
        </div>
      </section>

      {/* Labs and Imaging */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Labs and Imaging</h2>
        
        {/* Dynamic Lab Results */}
        <div>
          <h3 className="text-lg font-medium mb-2">Laboratory Tests</h3>
          <div className="space-y-4">
            {(formData.labs || []).map((test, index) => (
              <div key={index} className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`labs.${index}.test`} className="block text-sm font-medium">
                    Test Name
                  </label>
                  <input
                    type="text"
                    id={`labs.${index}.test`}
                    name={`labs.${index}.test`}
                    value={test.test}
                    onChange={(e) => {
                      const newLabs = [...(formData.labs || [])];
                      newLabs[index].test = e.target.value;
                      setFormData({ ...formData, labs: newLabs });
                    }}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor={`labs.${index}.date`} className="block text-sm font-medium">
                    Date
                  </label>
                  <input
                    type="date"
                    id={`labs.${index}.date`}
                    name={`labs.${index}.date`}
                    value={test.date.split('T')[0]}
                    onChange={(e) => {
                      const newLabs = [...(formData.labs || [])];
                      newLabs[index] = { ...newLabs[index], date: e.target.value };
                      setFormData({ ...formData, labs: newLabs });
                    }}
                    className={inputClassName}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  labs: [
                    ...(prev.labs || []),
                    {
                      test: '',
                      date: new Date().toISOString().split('T')[0],
                      results: {}
                    },
                  ],
                }));
              }}
              className="px-4 py-2 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
            >
              Add Test
            </button>
          </div>
        </div>

        {/* Imaging Studies */}
        <div>
          <h3 className="text-lg font-medium mb-2">Imaging Studies</h3>
          <div className="space-y-4">
            {(formData.imaging || []).map((study, index) => (
              <div key={index} className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`imaging.${index}.type`} className="block text-sm font-medium">
                    Type
                  </label>
                  <input
                    type="text"
                    id={`imaging.${index}.type`}
                    name={`imaging.${index}.type`}
                    value={study.type}
                    onChange={(e) => {
                      const newImaging = [...(formData.imaging || [])];
                      newImaging[index].type = e.target.value;
                      setFormData({ ...formData, imaging: newImaging });
                    }}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor={`imaging.${index}.findings`} className="block text-sm font-medium">
                    Findings
                  </label>
                  <textarea
                    id={`imaging.${index}.findings`}
                    name={`imaging.${index}.findings`}
                    value={study.findings}
                    onChange={(e) => {
                      const newImaging = [...(formData.imaging || [])];
                      newImaging[index] = { ...newImaging[index], findings: e.target.value };
                      setFormData({ ...formData, imaging: newImaging });
                    }}
                    rows={2}
                    className={inputClassName}
                  />
                </div>

                {study.type === 'CTP' && (
                  <>
                    <div>
                      <label htmlFor={`imaging.${index}.core`} className="block text-sm font-medium">
                        Core Volume
                      </label>
                      <input
                        type="text"
                        id={`imaging.${index}.core`}
                        name={`imaging.${index}.core`}
                        value={study.core}
                        onChange={(e) => {
                          const newImaging = [...(formData.imaging || [])];
                          newImaging[index] = { ...newImaging[index], core: e.target.value };
                          setFormData({ ...formData, imaging: newImaging });
                        }}
                        className={inputClassName}
                      />
                    </div>

                    <div>
                      <label htmlFor={`imaging.${index}.mismatch`} className="block text-sm font-medium">
                        Mismatch Volume
                      </label>
                      <input
                        type="text"
                        id={`imaging.${index}.mismatch`}
                        name={`imaging.${index}.mismatch`}
                        value={study.mismatch}
                        onChange={(e) => {
                          const newImaging = [...(formData.imaging || [])];
                          newImaging[index] = { ...newImaging[index], mismatch: e.target.value };
                          setFormData({ ...formData, imaging: newImaging });
                        }}
                        className={inputClassName}
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  imaging: [
                    ...(prev.imaging || []),
                    {
                      type: '',
                      findings: '',
                    },
                  ],
                }));
              }}
              className="px-4 py-2 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
            >
              Add Imaging Study
            </button>
          </div>
        </div>
      </section>

      {/* Diagnoses and Treatment */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Diagnoses and Treatment</h2>
        
        {/* Diagnoses */}
        <div>
          <h3 className="text-lg font-medium mb-2">Diagnoses</h3>
          <div className="space-y-2">
            {(formData.diagnoses || []).map((diagnosis, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  id={`diagnoses.${index}`}
                  name={`diagnoses.${index}`}
                  value={diagnosis}
                  onChange={(e) => {
                    const newDiagnoses = [...(formData.diagnoses || [])];
                    newDiagnoses[index] = e.target.value;
                    setFormData({ ...formData, diagnoses: newDiagnoses });
                  }}
                  className={inputClassName}
                  placeholder={`Diagnosis ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Procedures */}
        <div>
          <h3 className="text-lg font-medium mb-2">Procedures</h3>
          <div className="space-y-4">
            {(formData.procedures || []).map((procedure, index) => (
              <div key={index} className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-[var(--muted)]">
                <div>
                  <label htmlFor={`procedures.${index}.name`} className="block text-sm font-medium">
                    Procedure Name
                  </label>
                  <input
                    type="text"
                    id={`procedures.${index}.name`}
                    name={`procedures.${index}.name`}
                    value={procedure.name}
                    onChange={(e) => {
                      const newProcedures = [...(formData.procedures || [])];
                      newProcedures[index] = { ...newProcedures[index], name: e.target.value };
                      setFormData({ ...formData, procedures: newProcedures });
                    }}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor={`procedures.${index}.date`} className="block text-sm font-medium">
                    Date
                  </label>
                  <input
                    type="date"
                    id={`procedures.${index}.date`}
                    name={`procedures.${index}.date`}
                    value={procedure.date.split('T')[0]}
                    onChange={(e) => {
                      const newProcedures = [...(formData.procedures || [])];
                      newProcedures[index] = { ...newProcedures[index], date: e.target.value };
                      setFormData({ ...formData, procedures: newProcedures });
                    }}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor={`procedures.${index}.anesthesia`} className="block text-sm font-medium">
                    Anesthesia
                  </label>
                  <input
                    type="text"
                    id={`procedures.${index}.anesthesia`}
                    name={`procedures.${index}.anesthesia`}
                    value={procedure.anesthesia}
                    onChange={(e) => {
                      const newProcedures = [...(formData.procedures || [])];
                      newProcedures[index] = { ...newProcedures[index], anesthesia: e.target.value };
                      setFormData({ ...formData, procedures: newProcedures });
                    }}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor={`procedures.${index}.outcome`} className="block text-sm font-medium">
                    Outcome
                  </label>
                  <input
                    type="text"
                    id={`procedures.${index}.outcome`}
                    name={`procedures.${index}.outcome`}
                    value={procedure.outcome}
                    onChange={(e) => {
                      const newProcedures = [...(formData.procedures || [])];
                      newProcedures[index] = { ...newProcedures[index], outcome: e.target.value };
                      setFormData({ ...formData, procedures: newProcedures });
                    }}
                    className={inputClassName}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  procedures: [
                    ...(prev.procedures || []),
                    {
                      name: '',
                      date: new Date().toISOString().split('T')[0],
                      anesthesia: '',
                      outcome: ''
                    },
                  ],
                }));
              }}
              className="px-4 py-2 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
            >
              Add Procedure
            </button>
          </div>
        </div>
      </section>

      {/* Submit Button */}
      <div className="flex justify-end mt-8">
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Update Patient' : 'Add Patient'}
        </Button>
      </div>
    </form>
  );
}