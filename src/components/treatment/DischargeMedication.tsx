import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { DischargeMedication } from '@/types/patient';
import { Pencil, Trash2, X } from 'lucide-react';
import {
  saveDischargeMedication,
  deleteDischargeMedication,
  updateDischargeMedication,
  getDischargeMedications
} from '@/lib/supabase';

interface DischargeMedicationProps {
  patientId: string;
  medications: DischargeMedication[];
  onUpdate: () => void;
}

type NewDischargeMedication = Omit<DischargeMedication, 'id' | 'created_at' | 'updated_at'> & { patient_id: string };

export function DischargeMedicationComponent({
  patientId,
  medications = [],
  onUpdate
}: DischargeMedicationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localMedications, setLocalMedications] = useState(medications);
  const [newMedication, setNewMedication] = useState<NewDischargeMedication>({
    patient_id: patientId,
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: ''
  });

  useEffect(() => {
    setLocalMedications(medications);
  }, [medications]);

  const handleEdit = (medication: DischargeMedication) => {
    setEditingId(medication.id);
    setNewMedication({
      patient_id: patientId,
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      duration: medication.duration,
      notes: medication.notes || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!newMedication.name || !newMedication.dosage || !newMedication.frequency || !newMedication.duration) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      if (isEditing && editingId) {
        setLocalMedications(prev => 
          prev.map(med => med.id === editingId ? { ...med, ...newMedication } : med)
        );
        
        await updateDischargeMedication(editingId, newMedication);
        toast.success('Discharge medication updated successfully');
      } else {
        const savedMedication = await saveDischargeMedication(newMedication);
        
        setLocalMedications(prev => [...prev, savedMedication]);
        toast.success('Discharge medication added successfully');
      }
      
      setIsAdding(false);
      setIsEditing(false);
      setEditingId(null);
      setNewMedication({
        patient_id: patientId,
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: ''
      });

      const updatedMedications = await getDischargeMedications(patientId);
      setLocalMedications(updatedMedications);
      
      onUpdate();
    } catch (error) {
      console.error('Error saving discharge medication:', error);
      toast.error(isEditing ? 'Failed to update discharge medication' : 'Failed to add discharge medication');
      
      const updatedMedications = await getDischargeMedications(patientId);
      setLocalMedications(updatedMedications);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsAdding(false);
    setIsEditing(false);
    setEditingId(null);
    setNewMedication({
      patient_id: patientId,
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      notes: ''
    });
  };

  const handleDelete = async (id: string) => {
    toast.custom((t) => (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-sm w-full">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Delete Discharge Medication</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Are you sure you want to delete this discharge medication? This action cannot be undone.</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t)}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t);
              try {
                setIsLoading(true);
                setLocalMedications(prev => prev.filter(med => med.id !== id));
                
                await deleteDischargeMedication(id);
                toast.success('Discharge medication deleted successfully');
                
                const updatedMedications = await getDischargeMedications(patientId);
                setLocalMedications(updatedMedications);
                
                onUpdate();
              } catch (error) {
                console.error('Error deleting discharge medication:', error);
                toast.error('Failed to delete discharge medication');
                
                const updatedMedications = await getDischargeMedications(patientId);
                setLocalMedications(updatedMedications);
              } finally {
                setIsLoading(false);
              }
            }}
            className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: 'top-center',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Discharge Medications</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
          disabled={isAdding || isEditing}
        >
          Add Discharge Medication
        </button>
      </div>

      {localMedications.length === 0 && !isAdding ? (
        <div className="p-4 rounded-lg border border-dashed text-center">
          <p className="text-sm text-[var(--muted-foreground)]">No discharge medications</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {localMedications.map((medication) => {
            const { id, created_at, updated_at, patient_id, ...displayMedication } = medication;
            
            return (
              <div 
                key={id} 
                className="p-2 rounded-lg border bg-[var(--muted)] flex flex-col"
              >
                <div className="flex justify-between items-start">
                  <div className="font-medium text-sm">{displayMedication.name}</div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(medication)}
                      className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1"
                      disabled={isLoading}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => id && handleDelete(id)}
                      className="text-red-400 hover:text-red-600 p-1"
                      disabled={isLoading}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 text-xs text-[var(--muted-foreground)]">
                  <div><span className="font-medium">Dosage:</span> {displayMedication.dosage}</div>
                  <div><span className="font-medium">Frequency:</span> {displayMedication.frequency}</div>
                  <div className="col-span-2">
                    <span className="font-medium">Duration:</span> {displayMedication.duration}
                  </div>
                  {displayMedication.notes && (
                    <div className="col-span-2">
                      <span className="font-medium">Notes:</span> {displayMedication.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Medication Modal */}
      {(isAdding || isEditing) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium">
                {isEditing ? 'Edit Discharge Medication' : 'Add Discharge Medication'}
              </h4>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Medication Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMedication.name}
                  onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter medication name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Dosage <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g., 50mg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Frequency <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMedication.frequency}
                  onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g., Twice daily"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Duration <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMedication.duration}
                  onChange={(e) => setNewMedication({ ...newMedication, duration: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="e.g., 7 days"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Notes
                </label>
                <textarea
                  value={newMedication.notes}
                  onChange={(e) => setNewMedication({ ...newMedication, notes: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  rows={2}
                  placeholder="Additional notes"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm rounded-md border bg-transparent hover:bg-[var(--muted)]"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 