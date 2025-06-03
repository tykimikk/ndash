'use client';

import { PatientForm } from '@/components/PatientForm';
import { getPatientById, updatePatient } from '@/lib/supabase';
import type { Patient } from '@/types/patient';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import React from 'react';

export default function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const unwrappedParams = React.use(params);

  useEffect(() => {
    async function loadPatient() {
      try {
        const data = await getPatientById(unwrappedParams.id);
        if (!data) {
          toast.error('Patient not found');
          router.push('/dashboard');
          return;
        }
        setPatient(data);
      } catch (error) {
        console.error('Error loading patient:', error);
        toast.error('Failed to load patient');
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    }

    loadPatient();
  }, [unwrappedParams.id, router]);

  async function handleSubmit(data: Omit<Patient, 'id' | 'created_at' | 'updated_at'>) {
    try {
      await updatePatient(unwrappedParams.id, data); // This is where the actual "update" happens
      toast.success('Patient updated successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error('Failed to update patient');
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 min-h-[calc(100vh-4rem)] bg-background">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-[calc(100vh-4rem)] bg-background">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Edit Patient</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Update the patient information below.
        </p>
      </div>

      <div className="bg-[var(--muted)] rounded-lg shadow p-6">
        <PatientForm 
          initialData={patient}
          onSubmit={handleSubmit}
          isLoading={isLoading} // isLoading here is for the page loading patient data
        />
      </div>
    </div>
  );
}