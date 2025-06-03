// Base types for extensible data
import { Json } from './supabase';
export type Metadata = Record<string, string | number | boolean | null>;

// Patient note interface
export interface PatientNote {
  id: string;
  created_at?: string;
  updated_at?: string;
  patient_id: string;
  type: string;
  content: string;
  date: string;
}

export interface VitalSigns {
  pulse: number;
  respiration: number;
  blood_pressure: string;
  temperature: number;
  weight: number | null;
  height: number | null;
}

export interface CustomCondition {
  name: string;
  details?: string;
}

export interface InfectiousDisease {
  hepatitis: boolean;
  tuberculosis: boolean;
  others: CustomCondition[];
}

export interface CardiovascularDisease {
  hypertension: boolean;
  coronary_artery_disease: boolean;
  atrial_fibrillation: boolean;
  heart_failure: boolean;
  cerebral_infarction: boolean;
  others: CustomCondition[];
}

export interface EndocrineDisorder {
  diabetes_type1: boolean;
  diabetes_type2: boolean;
  hyperthyroidism: boolean;
  hypothyroidism: boolean;
  others: CustomCondition[];
}

export interface RespiratoryDisease {
  asthma: boolean;
  copd: boolean;
  others: CustomCondition[];
}

export interface KidneyDisease {
  acute_kidney_injury: boolean;
  chronic_kidney_disease: boolean;
  others: CustomCondition[];
}

export interface LiverDisease {
  fatty_liver: boolean;
  cirrhosis: boolean;
  others: CustomCondition[];
}

export interface PastMedicalHistory {
  cardiovascular: CardiovascularDisease;
  endocrine: EndocrineDisorder;
  respiratory: RespiratoryDisease;
  kidney: KidneyDisease;
  liver: LiverDisease;
  infectious_disease: InfectiousDisease;
  vaccination_history: Array<{
    vaccine_name: string;
    date: string;
    notes?: string;
  }>;
}

export interface AllergyItem {
  name: string;
  reaction: string;
}

export interface SurgeryTraumaItem {
  name: string;
  date: string;
  details?: string;
}

export interface DrugUseItem {
  name: string;
  duration: string;
  details?: string;
}

export interface ParentStatus {
  status: 'alive' | 'deceased';
  cause: string;
}

export interface FamilyHistory {
  father: ParentStatus;
  mother: ParentStatus;
  hereditary_diseases: boolean;
  hereditary_details?: CustomCondition[];
  infectious_diseases_in_family: boolean;
  infectious_details?: CustomCondition[];
  cancer_history: boolean;
  cancer_details?: CustomCondition[];
}

export interface SmokingDetails {
  duration: string;
  cigarettes_per_day: number;
}

export interface AlcoholDetails {
  duration: string;
  quantity_per_day: string;
}

export interface ToxicExposureDetails {
  type: string;
  duration: string;
}

export interface Habits {
  smoking: boolean;
  smoking_details?: SmokingDetails;
  alcohol: boolean;
  alcohol_details?: AlcoholDetails;
  toxic_exposure: boolean;
  toxic_exposure_details?: ToxicExposureDetails;
  residence_in_epidemic_region: boolean;
  epidemic_region_details: string;
  exposure_to_infected_water: boolean;
  infected_water_details: string;
}

export interface MenstrualHistory {
  flow: string;
  dysmenorrhea: boolean;
  cycle: string;
  post_menopausal_bleeding: boolean;
}

export interface PhysicalExamination {
  consciousness: string;
  cooperation: string;
  orientation: string;
  mental_status: string;
  general_appearance: string;
  special_positions: string;
}

export interface PupilSize {
  left: number;
  right: number;
}

export interface LightReflex {
  direct: string;
  indirect: string;
}

export interface MuscleStrengthSide {
  upper: number;
  lower: number;
}

export interface MuscleStrength {
  left: MuscleStrengthSide;
  right: MuscleStrengthSide;
}

export interface Motor {
  tone: string;
  strength: {
    upper_limbs: {
      left: number;
      right: number;
    };
    lower_limbs: {
      left: number;
      right: number;
    };
  };
  babinski_sign: {
    left: 'positive' | 'negative';
    right: 'positive' | 'negative';
  };
}

export interface CranialNerves {
  pupil_size: {
    left: number;
    right: number;
  };
  light_reflex: {
    direct: string;
    indirect: string;
  };
  cn_i: { 
    status: string; 
    right_status: string;
    notes: string 
  };
  cn_ii: { 
    visual_acuity_left: string;
    visual_acuity_right: string;
    visual_fields_left: string;
    visual_fields_right: string;
    fundus_left: string;
    fundus_right: string;
    notes: string 
  };
  cn_iii_iv_vi: { 
    eye_movement: string;
    ptosis: boolean;
    nystagmus: boolean;
    diplopia: boolean;
    status: string; 
    notes: string 
  };
  cn_v: { 
    sensation_v1: string;
    sensation_v2: string;
    sensation_v3: string;
    corneal_left: string;
    corneal_right: string;
    jaw_strength: string;
    status: string; 
    notes: string 
  };
  cn_vii: { 
    eye_fissure_left: number;
    eye_fissure_right: number;
    nasolabial_left: string;
    nasolabial_right: string;
    mouth_deviation: string;
    facial_movement: string;
    status: string; 
    notes: string 
  };
  cn_viii: { 
    hearing_left: string;
    hearing_right: string;
    rinne_test: string;
    weber_test: string;
    status: string; 
    notes: string 
  };
  cn_ix_x: { 
    palate_elevation: string;
    gag_reflex: string;
    speech: string;
    swallowing: string;
    status: string; 
    notes: string 
  };
  cn_xi: { 
    scm_strength_left: string;
    scm_strength_right: string;
    trapezius_strength_left: string;
    trapezius_strength_right: string;
    status: string; 
    notes: string 
  };
  cn_xii: { 
    tongue_position: string;
    tongue_strength: string;
    tongue_atrophy: boolean;
    tongue_fasciculations: boolean;
    status: string; 
    notes: string 
  };
}

export interface MeningealSigns {
  neck_stiffness: 'negative' | 'positive';
  kernig_sign: 'negative' | 'positive';
  brudzinski_sign: 'negative' | 'positive';
}

export interface NeurologicalExamination {
  cranial_nerves: CranialNerves;
  motor: Motor;
  meningeal_signs: MeningealSigns;
  reflexes: string;
  coordination: string;
  sensory: string;
  autonomic_signs: string;
}

export interface LabResult {
  value: number | string;
  unit?: string;
  reference_range?: {
    min?: number;
    max?: number;
    text?: string;
  };
  status?: 'normal' | 'high' | 'low' | 'critical';
  severity?: 'low' | 'high' | 'critical';
}

export interface LabTest {
  id: string;
  patient_id: string;
  test_date: string;
  test: string;
  category: LabCategory;
  results: LabResult;
  created_at: string;
  updated_at: string;
}

export type LabCategory = 
  | 'Complete Blood Count'
  | 'Liver Function'
  | 'Kidney Function'
  | 'Coagulation'
  | 'Tumor Markers'
  | 'Infection Markers'
  | 'Hormones'
  | 'Urinalysis'
  | 'Biochemistry'
  | 'Immunology'
  | 'Blood Gas'
  | 'Toxicology'
  | 'Genetic & Molecular'
  | 'Nutritional'
  | 'Other';

export const LAB_CATEGORY_COLORS: Record<LabCategory, string> = {
  'Complete Blood Count': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  'Liver Function': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  'Kidney Function': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  'Coagulation': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  'Tumor Markers': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  'Infection Markers': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  'Hormones': 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
  'Urinalysis': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
  'Biochemistry': 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-300',
  'Immunology': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-300',
  'Blood Gas': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
  'Toxicology': 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300',
  'Genetic & Molecular': 'bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-300',
  'Nutritional': 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
  'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
};

export interface Patient {
  id: string;
  full_name: string;
  gender: string;
  birth_date: string;
  diagnoses: string[];
  chief_complaint?: string;
  present_illness?: string;
  past_medical_history?: PastMedicalHistory;
  family_history?: FamilyHistory;
  habits?: Habits;
  physical_examination?: PhysicalExamination;
  neurological_examination?: NeurologicalExamination;
  vital_signs?: VitalSigns;
  lab_results?: LabTest[];
  imaging?: ImagingStudy[];
  created_at: string;
  updated_at: string;
}

export interface ImagingStudy {
  id: string;
  patient_id: string;
  type: string;
  date: string;
  findings?: string;
  core?: string;
  mismatch?: string;
  created_at: string;
  updated_at: string;
}