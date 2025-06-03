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

export type LabTest = {
  id: string;
  patient_id: string;
  test_date: string;
  test_name: string;
  category: LabCategory;
  result_value: string;
  result_unit: string;
  reference_range: string;
  status: 'normal' | 'high' | 'low' | 'critical';
  severity: 'normal' | 'warning' | 'critical';
  created_at: string;
  updated_at: string;
};

export type LabTestInput = Omit<LabTest, 'id' | 'created_at' | 'updated_at'>; 