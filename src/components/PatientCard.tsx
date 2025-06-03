import { useRouter } from 'next/navigation';
import type { Patient as BasePatient } from '@/types/patient';
import { Tooltip } from './Tooltip';

// Extended Patient interface to handle legacy fields
interface Patient extends BasePatient {
  date_of_birth?: string;
  diagnosis?: string;
  bed_number: string;
  admission_date: string;
  status_tags: string[];
}

interface PatientCardProps {
  patient: Patient;
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
}

export function PatientCard({ patient }: PatientCardProps) {
  const router = useRouter();
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format dates for display - handle both field name variations
  const birthDate = patient.birth_date || patient.date_of_birth || '';
  
  // Calculate age from birth date
  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    
    return age;
  };
  
  const age = birthDate ? calculateAge(birthDate) : 0;
  
  // View patient details
  const handleViewPatient = () => {
    router.push(`/dashboard/patients/${patient.id}`);
  };
  
  // Gender icon - improved detection
  const GenderIcon = () => {
    const gender = (patient.gender || '').toLowerCase().trim();
    
    if (gender === 'female' || gender === 'f') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-pink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="5"/>
          <path d="M12 13v8"/>
          <path d="M9 18h6"/>
        </svg>
      );
    } else if (gender === 'male' || gender === 'm') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10.5" cy="6" r="5"/>
          <path d="M14 9l7 7"/>
          <path d="M21 8v8"/>
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7" r="4"/>
          <path d="M5 21v-2a7 7 0 0 1 14 0v2"/>
        </svg>
      );
    }
  };

  // Status icons
  const StatusIcon = ({ tag }: { tag: string }) => {
    const iconProps = {
      className: "h-4 w-4",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const
    };

    switch (tag) {
      case 'new_patient':
        return (
          <svg {...iconProps} className={`${iconProps.className} text-green-500`}>
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v8"/>
            <path d="M8 12h8"/>
          </svg>
        );
      case 'transferred':
        return (
          <svg {...iconProps} className={`${iconProps.className} text-blue-500`}>
            <path d="M21 12l-4-4v3H3v2h14v3l4-4z"/>
          </svg>
        );
      case 'discharge_today':
        return (
          <svg {...iconProps} className={`${iconProps.className} text-orange-500`}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        );
      case 'discharge_tomorrow':
        return (
          <svg {...iconProps} className={`${iconProps.className} text-yellow-500`}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" className="opacity-50"/>
          </svg>
        );
      case 'isolation':
        return (
          <svg {...iconProps} className={`${iconProps.className} text-red-500`}>
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        );
      case 'allergy':
        return (
          <svg {...iconProps} className={`${iconProps.className} text-purple-500`}>
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
        );
      case 'ncu':
        return (
          <svg {...iconProps} className={`${iconProps.className} text-indigo-500`}>
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
            <path d="M12 2v20"/>
            <path d="M2 7h20"/>
            <path d="M2 17h20"/>
          </svg>
        );
      default:
        return null;
    }
  };

  // Format diagnosis text
  const formatDiagnosis = (diagnoses: string[] | string | undefined) => {
    if (!diagnoses) return null;
    
    if (Array.isArray(diagnoses)) {
      // Sort diagnoses alphabetically and join with commas
      return diagnoses.sort().join(', ');
    }
    return diagnoses;
  };
  
  return (
    <div 
      className="rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={handleViewPatient}
    >
      {/* Header with name, gender, age, and bed number */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-shrink-0 p-1 rounded-full bg-white dark:bg-gray-700">
            <GenderIcon />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {patient.full_name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{age}y</span>
              <span>•</span>
              <span>Bed {patient.bed_number}</span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 ml-2">
          {formatDate(patient.admission_date)}
        </div>
      </div>

      {/* Diagnosis */}
      {(patient.diagnoses || patient.diagnosis) && (
        <div className="text-xs text-gray-600 dark:text-gray-300 mb-2">
          <span className="font-medium">Diagnosis: </span>
          <span className="line-clamp-1">
            {formatDiagnosis(patient.diagnoses || patient.diagnosis)}
          </span>
        </div>
      )}

      {/* Status icons */}
      {patient.status_tags && patient.status_tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {patient.status_tags.map((tag) => (
            <Tooltip
              key={tag}
              content={tag.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            >
              <div className="flex-shrink-0 p-1 rounded-full bg-white dark:bg-gray-700">
                <StatusIcon tag={tag} />
              </div>
            </Tooltip>
          ))}
        </div>
      )}
    </div>
  );
} 