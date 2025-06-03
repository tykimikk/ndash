import { useState } from 'react';
import { CustomCondition } from '@/types/patient';
import { X } from 'lucide-react';

interface MedicalConditionCardProps {
  title: string;
  icon?: React.ReactNode;
  backgroundColor?: string;
  conditionsMap: Record<string, boolean | CustomCondition[] | Record<string, unknown>>;
  customConditions: CustomCondition[];
  onConditionChange: (name: string, checked: boolean) => void;
  onAddCustomCondition: (condition: CustomCondition) => void;
  onRemoveCustomCondition: (index: number) => void;
}

export function MedicalConditionCard({
  title,
  icon,
  backgroundColor = 'bg-white dark:bg-gray-800',
  conditionsMap,
  customConditions,
  onConditionChange,
  onAddCustomCondition,
  onRemoveCustomCondition
}: MedicalConditionCardProps) {
  const [newCondition, setNewCondition] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [newDetails, setNewDetails] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newCondition.trim()) {
      e.preventDefault();
      onAddCustomCondition({ 
        name: newCondition.trim(), 
        details: newDetails.trim() || undefined 
      });
      setNewCondition('');
      setNewDetails('');
      setShowDetails(false);
    }
  };

  const handleAddClick = () => {
    if (newCondition.trim()) {
      onAddCustomCondition({ 
        name: newCondition.trim(), 
        details: newDetails.trim() || undefined 
      });
      setNewCondition('');
      setNewDetails('');
      setShowDetails(false);
    }
  };

  // Filter out non-boolean properties from the conditionsMap
  const booleanConditions = Object.entries(conditionsMap).filter(
    ([, value]) => typeof value === 'boolean'
  ) as [string, boolean][];

  const checkboxClassName = "h-5 w-5 rounded-md border-2 border-[#7984E8] bg-transparent focus:ring-2 focus:ring-offset-0 focus:ring-[#7984E8] focus:ring-opacity-30 transition-colors duration-200 ease-in-out cursor-pointer";
  
  return (
    <div className={`rounded-lg shadow-md p-4 ${backgroundColor} mb-4 border border-[var(--border)] text-[var(--foreground)]`}>
      <div className="flex items-center mb-3">
        {icon && <div className="mr-2">{icon}</div>}
        <h3 className="text-lg font-medium">{title}</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        {booleanConditions.map(([key, value]) => (
          <div key={key} className="flex items-center">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id={key}
                checked={value}
                onChange={(e) => onConditionChange(key, e.target.checked)}
                style={{ backgroundColor: value ? '#7984E8' : 'transparent', borderColor: '#7984E8' }}
                className={checkboxClassName}
              />
            </div>
            <label htmlFor={key} className="ml-2 text-sm capitalize">
              {key.split('_').join(' ')}
            </label>
          </div>
        ))}
      </div>
      
      {customConditions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Conditions</h4>
          <div className="flex flex-wrap gap-2">
            {customConditions.map((condition, index) => (
              <div 
                key={index} 
                className="flex items-center bg-[var(--muted)] rounded-full px-3 py-1 text-xs"
                title={condition.details}
              >
                <span>{condition.name}</span>
                <button 
                  onClick={() => onRemoveCustomCondition(index)}
                  className="ml-2 text-[var(--muted-foreground)] hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-2">
        <div className="relative flex flex-col space-y-2">
          <input
            type="text"
            placeholder="Add condition..."
            value={newCondition}
            onChange={(e) => setNewCondition(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowDetails(true)}
            className="px-3 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input)] text-[var(--input-foreground)] text-sm"
          />
          
          {showDetails && newCondition.trim() && (
            <input
              type="text"
              placeholder="Details (optional)"
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
              onKeyDown={handleKeyDown}
              className="px-3 py-2 rounded-md border border-[var(--input-border)] bg-[var(--input)] text-[var(--input-foreground)] text-sm"
            />
          )}
          
          {newCondition.trim() && (
            <button
              type="button"
              onClick={handleAddClick}
              className="absolute right-2 top-2 text-sm font-medium text-[var(--primary)]"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 