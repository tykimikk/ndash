import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { CurrentMedication } from '@/types/patient';
import { Pencil, Trash2, X } from 'lucide-react';
import {
  saveCurrentMedication,
  deleteCurrentMedication,
  updateCurrentMedication
} from '@/lib/supabase';

interface CurrentMedicationProps {
  patientId: string;
  medications: CurrentMedication[];
  onUpdate: () => void;
}

// Define the type with patient_id included
type NewMedication = Omit<CurrentMedication, 'id' | 'created_at' | 'updated_at'> & { patient_id: string };

export function CurrentMedicationComponent({
  patientId,
  medications = [],
  onUpdate
}: CurrentMedicationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localMedications, setLocalMedications] = useState(medications);
  const [newMedication, setNewMedication] = useState<NewMedication>({
    patient_id: patientId,
    name: '',
    dosage: '',
    frequency: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: ''
  });

  // Update local state when props change
  useEffect(() => {
    setLocalMedications(medications);
  }, [medications]);

  const handleEdit = (medication: CurrentMedication) => {
    setEditingId(medication.id);
    setNewMedication({
      patient_id: patientId,
      name: medication.name,
      dosage: medication.dosage,
      frequency: medication.frequency,
      start_date: medication.start_date || new Date().toISOString().split('T')[0],
      end_date: medication.end_date || '',
      notes: medication.notes || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!newMedication.name || !newMedication.dosage || !newMedication.frequency) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      if (isEditing && editingId) {
        await updateCurrentMedication(editingId, newMedication);
        setLocalMedications(prev => 
          prev.map(med => med.id === editingId ? { ...med, ...newMedication } : med)
        );
        toast.success('Medication updated successfully');
      } else {
        const savedMedication = await saveCurrentMedication(newMedication);
        setLocalMedications(prev => [...prev, savedMedication]);
        toast.success('Medication added successfully');
      }
      
      // Reset form and state
      setIsAdding(false);
      setIsEditing(false);
      setEditingId(null);
      setNewMedication({
        patient_id: patientId,
        name: '',
        dosage: '',
        frequency: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        notes: ''
      });
      onUpdate();
    } catch (error) {
      console.error('Error saving medication:', error);
      toast.error(isEditing ? 'Failed to update medication' : 'Failed to add medication');
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
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
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
            <h3 className="font-medium text-gray-900 dark:text-gray-100">Delete Medication</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Are you sure you want to delete this medication? This action cannot be undone.</p>
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
                await deleteCurrentMedication(id);
                setLocalMedications(prev => prev.filter(med => med.id !== id));
                toast.success('Medication deleted successfully');
                onUpdate();
              } catch (error) {
                console.error('Error deleting medication:', error);
                toast.error('Failed to delete medication');
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
        <h3 className="text-lg font-semibold">Current Medications</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 text-sm rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
          disabled={isAdding || isEditing}
        >
          Add Medication
        </button>
      </div>

      {localMedications.length === 0 && !isAdding ? (
        <div className="p-4 rounded-lg border border-dashed text-center">
          <p className="text-sm text-[var(--muted-foreground)]">No current medications</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {localMedications.map((medication) => {
            // Filter out technical fields and only keep the relevant ones
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
                    <span className="font-medium">Started:</span> {displayMedication.start_date ? new Date(displayMedication.start_date).toLocaleDateString() : 'Not specified'}
                    {displayMedication.end_date && ` - Ended: ${new Date(displayMedication.end_date).toLocaleDateString()}`}
                  </div>
                  {displayMedication.purpose && (
                    <div className="col-span-2">
                      <span className="font-medium">Purpose:</span> {displayMedication.purpose}
                    </div>
                  )}
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
                {isEditing ? 'Edit Medication' : 'Add New Medication'}
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
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newMedication.start_date}
                  onChange={(e) => setNewMedication({ ...newMedication, start_date: e.target.value })}
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={newMedication.end_date}
                  onChange={(e) => setNewMedication({ ...newMedication, end_date: e.target.value })}
                  className="w-full p-2 border rounded-md"
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