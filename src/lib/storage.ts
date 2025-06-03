import type { Patient } from '@/types/patient';

const STORAGE_KEY = 'ndash_patients';

function getStoredPatients(): Patient[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function setStoredPatients(patients: Patient[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
}

export async function createPatient(patientData: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) {
  const patients = getStoredPatients();
  const newPatient: Patient = {
    ...patientData,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  patients.push(newPatient);
  setStoredPatients(patients);
  return newPatient;
}

export async function updatePatient(id: string, patientData: Partial<Patient>) {
  const patients = getStoredPatients();
  const index = patients.findIndex(p => p.id === id);
  
  if (index === -1) throw new Error('Patient not found');
  
  const updatedPatient = {
    ...patients[index],
    ...patientData,
    updatedAt: new Date().toISOString()
  };
  
  patients[index] = updatedPatient;
  setStoredPatients(patients);
  return updatedPatient;
}

export async function getPatients() {
  return getStoredPatients();
}

export async function getPatientById(id: string) {
  const patients = getStoredPatients();
  const patient = patients.find(p => p.id === id);
  if (!patient) throw new Error('Patient not found');
  return patient;
}

export async function deletePatient(id: string) {
  const patients = getStoredPatients();
  const filteredPatients = patients.filter(p => p.id !== id);
  setStoredPatients(filteredPatients);
  return true;
}