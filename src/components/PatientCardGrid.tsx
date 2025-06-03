import type { Patient as BasePatient } from '@/types/patient';
import { PatientCard } from './PatientCard';
import { Loader } from './Loader';

// Extended Patient interface to handle legacy fields
interface Patient extends BasePatient {
  date_of_birth?: string;
  diagnosis?: string;
  bed_number: string;
  admission_date: string;
  status_tags: string[];
}

interface PatientCardGridProps {
  data: Patient[];
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function PatientCardGrid({ 
  data, 
  onEdit, 
  onDelete, 
  isLoading = false 
}: PatientCardGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader size="lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow">
        <p className="text-gray-500">No patients found. Add your first patient to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {data.map((patient) => (
        <PatientCard
          key={patient.id}
          patient={patient}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
} 