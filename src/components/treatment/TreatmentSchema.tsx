import { type Patient } from '@/types/patient';
import { CurrentMedicationComponent } from './CurrentMedication';
import { HospitalCareComponent } from './HospitalCare';
import { DischargeMedicationComponent } from './DischargeMedication';
import { getCurrentMedications, getDischargeMedications, getHospitalCare } from '@/lib/supabase';
import { useState } from 'react';
import type { CurrentMedication, HospitalCareTreatment, DischargeMedication } from '@/types/patient';

interface TreatmentSchemaProps {
  patient: Patient & {
    current_medications?: CurrentMedication[];
    hospital_care?: HospitalCareTreatment[];
    discharge_medications?: DischargeMedication[];
  };
  onUpdate: () => void;
}

export function TreatmentSchema({ patient, onUpdate }: TreatmentSchemaProps) {
  const [currentMedications, setCurrentMedications] = useState(patient.current_medications || []);
  const [dischargeMedications, setDischargeMedications] = useState(patient.discharge_medications || []);
  const [hospitalCare, setHospitalCare] = useState(patient.hospital_care || []);

  const handleMedicationUpdate = async () => {
    try {
      const updatedMedications = await getCurrentMedications(patient.id);
      setCurrentMedications(updatedMedications);
    } catch (error) {
      console.error('Error updating medications:', error);
    }
  };

  const handleDischargeMedicationUpdate = async () => {
    try {
      const updatedMedications = await getDischargeMedications(patient.id);
      setDischargeMedications(updatedMedications);
    } catch (error) {
      console.error('Error updating discharge medications:', error);
    }
  };

  const handleHospitalCareUpdate = async () => {
    try {
      const updatedTreatments = await getHospitalCare(patient.id);
      setHospitalCare(updatedTreatments);
    } catch (error) {
      console.error('Error updating hospital care:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Medications Section */}
      <section>
        <CurrentMedicationComponent 
          patientId={patient.id}
          medications={currentMedications}
          onUpdate={handleMedicationUpdate}
        />
      </section>

      {/* Hospital Care Section */}
      <section>
        <HospitalCareComponent 
          patientId={patient.id}
          treatments={hospitalCare}
          onUpdate={handleHospitalCareUpdate}
        />
      </section>

      {/* Discharge Medications Section */}
      <section>
        <DischargeMedicationComponent 
          patientId={patient.id}
          medications={dischargeMedications}
          onUpdate={handleDischargeMedicationUpdate}
        />
      </section>
    </div>
  );
} 