import { useState } from 'react';
import { toast } from 'sonner';
import type { HospitalCareTreatment } from '@/types/patient';
import {
  saveHospitalCare,
  deleteHospitalCare,
  updateHospitalCare
} from '@/lib/supabase';
import { Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';

interface HospitalCareProps {
  patientId: string;
  treatments: HospitalCareTreatment[];
  onUpdate: () => void;
}

type NewTreatment = Omit<HospitalCareTreatment, 'id' | 'created_at' | 'updated_at'> & { patient_id: string };

export function HospitalCareComponent({
  patientId,
  treatments: initialTreatments = [],
  onUpdate
}: HospitalCareProps) {
  const [treatments, setTreatments] = useState(initialTreatments);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [treatmentToDelete, setTreatmentToDelete] = useState<HospitalCareTreatment | null>(null);
  const [editingTreatment, setEditingTreatment] = useState<HospitalCareTreatment | null>(null);
  const [newTreatment, setNewTreatment] = useState<NewTreatment>({
    patient_id: patientId,
    treatment: '',
    date: new Date().toISOString().split('T')[0],
    dosage: '',
    quantity: '',
    notes: ''
  });

  const refreshData = async () => {
    try {
      const updatedTreatments = await getHospitalCare(patientId);
      setTreatments(updatedTreatments);
      await onUpdate();
    } catch (error) {
      console.error('Error refreshing hospital care:', error);
      toast.error('Failed to refresh hospital care data');
    }
  };

  const handleAddNew = () => {
    setEditingTreatment(null);
    setNewTreatment({
      patient_id: patientId,
      treatment: '',
      date: new Date().toISOString().split('T')[0],
      dosage: '',
      quantity: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (treatment: HospitalCareTreatment) => {
    setEditingTreatment(treatment);
    setNewTreatment({
      patient_id: patientId,
      treatment: treatment.treatment,
      date: treatment.date,
      dosage: treatment.dosage,
      quantity: treatment.quantity,
      notes: treatment.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (treatment: HospitalCareTreatment) => {
    setTreatmentToDelete(treatment);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!treatmentToDelete) return;
    
    setIsLoading(true);
    try {
      await deleteHospitalCare(treatmentToDelete.id);
      setTreatments(prev => prev.filter(t => t.id !== treatmentToDelete.id));
      toast.success('Treatment deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Error deleting treatment:', error);
      toast.error('Failed to delete treatment');
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      setTreatmentToDelete(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTreatment.treatment || !newTreatment.date || !newTreatment.dosage || !newTreatment.quantity) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      if (editingTreatment) {
        const updatedTreatment = await updateHospitalCare(editingTreatment.id, {
          treatment: newTreatment.treatment,
          date: newTreatment.date,
          dosage: newTreatment.dosage,
          quantity: newTreatment.quantity,
          notes: newTreatment.notes
        });
        setTreatments(prev => prev.map(t => 
          t.id === editingTreatment.id ? updatedTreatment : t
        ));
        toast.success('Treatment updated successfully');
      } else {
        const newTreatmentWithId = await saveHospitalCare(newTreatment);
        setTreatments(prev => [...prev, newTreatmentWithId]);
        toast.success('Treatment added successfully');
      }
      setIsModalOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving treatment:', error);
      toast.error('Failed to save treatment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">In-Hospital Care</h3>
      </div>

      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-black/5 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--muted)]">
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">Treatment</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">Dosage</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)]">Notes</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-[var(--muted-foreground)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {treatments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[var(--muted-foreground)]">
                      No hospital care treatments recorded
                    </td>
                  </tr>
                ) : (
                  treatments.map((treatment) => (
                    <tr key={treatment.id} className="hover:bg-[var(--muted)]">
                      <td className="px-4 py-3">{treatment.treatment}</td>
                      <td className="px-4 py-3">{new Date(treatment.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{treatment.dosage}</td>
                      <td className="px-4 py-3">{treatment.quantity}</td>
                      <td className="px-4 py-3">{treatment.notes || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(treatment)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-blue-600 dark:text-blue-400"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(treatment)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-red-600 dark:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                <tr 
                  className="group relative hover:bg-[var(--muted)] cursor-pointer"
                  onClick={handleAddNew}
                >
                  <td colSpan={6} className="px-4 py-1">
                    <div className="flex items-center justify-center text-[var(--muted-foreground)] group-hover:text-[var(--foreground)] transition-colors">
                      <Plus className="w-3 h-3" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden">
            {treatments.length === 0 ? (
              <div className="p-6 text-center text-[var(--muted-foreground)]">
                No hospital care treatments recorded
              </div>
            ) : (
              <div className="divide-y divide-[var(--border)]">
                {treatments.map((treatment) => (
                  <div key={treatment.id} className="p-4 hover:bg-[var(--muted)]">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-[var(--foreground)]">{treatment.treatment}</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(treatment)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-blue-600 dark:text-blue-400"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(treatment)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-red-600 dark:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-[var(--muted-foreground)]">
                          {treatment.dosage}
                        </span>
                        <span className="text-sm text-[var(--muted-foreground)]">
                          {treatment.quantity}
                        </span>
                      </div>
                      
                      <div className="text-sm text-[var(--muted-foreground)]">
                        {new Date(treatment.date).toLocaleDateString()}
                      </div>
                      
                      {treatment.notes && (
                        <div className="text-sm text-[var(--muted-foreground)]">
                          {treatment.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div 
              className="flex items-center justify-center p-4 text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer transition-colors"
              onClick={handleAddNew}
            >
              <Plus className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--background)] rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingTreatment ? 'Edit Treatment' : 'Add New Treatment'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Treatment</label>
                <input
                  type="text"
                  value={newTreatment.treatment}
                  onChange={(e) => setNewTreatment({ ...newTreatment, treatment: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={newTreatment.date}
                  onChange={(e) => setNewTreatment({ ...newTreatment, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Dosage</label>
                  <input
                    type="text"
                    value={newTreatment.dosage}
                    onChange={(e) => setNewTreatment({ ...newTreatment, dosage: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="text"
                    value={newTreatment.quantity}
                    onChange={(e) => setNewTreatment({ ...newTreatment, quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={newTreatment.notes || ''}
                  onChange={(e) => setNewTreatment({ ...newTreatment, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : editingTreatment ? 'Update' : 'Add'} Treatment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && treatmentToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--background)] rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold">Delete Treatment</h2>
            </div>
            
            <p className="text-[var(--muted-foreground)] mb-6">
              Are you sure you want to delete the treatment &quot;{treatmentToDelete.treatment}&quot;? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setTreatmentToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete Treatment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 