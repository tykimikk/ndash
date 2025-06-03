'use client';

import { PatientForm } from '@/components/PatientForm';
import { createPatient } from '@/lib/supabase';
import type { Patient } from '@/types/patient';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function NewPatientPage() {
  const router = useRouter();

  async function handleSubmit(data: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) {
    try {
      await createPatient(data); // This is where the actual "create" happens
      toast.success('Patient added successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error adding patient:', error); // << CHECK YOUR BROWSER CONSOLE FOR THIS
      
      let errorMessage = 'Failed to add patient';
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
      } else if (typeof error === 'object' && error !== null) {
        const errObj = error as any;
        if (errObj.message) {
          errorMessage = `Database error: ${errObj.message}`;
        } else if (errObj.details) {
          errorMessage = `Error details: ${errObj.details}`;
        }
      }
      toast.error(errorMessage);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-[calc(100vh-4rem)] bg-background">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Add New Patient</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Fill in the patient information below to create a new patient record.
        </p>
      </div>

      <div className="bg-[var(--muted)] rounded-lg shadow p-6">
        <PatientForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
}