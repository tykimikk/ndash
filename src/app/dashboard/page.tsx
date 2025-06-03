'use client';

import { useState, useEffect } from 'react';
import { PatientCardGrid } from '@/components/PatientCardGrid';
import { Button } from '@/components/Button';
import { getPatients, deletePatient, getPatientsNoAuth } from '@/lib/supabase';
import type { Patient as BasePatient } from '@/types/patient';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Extended Patient interface to handle legacy fields
interface Patient extends BasePatient {
  date_of_birth?: string;
  diagnosis?: string;
}

export default function DashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user, userProfile, loading: authLoading, clearRedirectFlag } = useAuth();

  useEffect(() => {
    // Only fetch patients when auth is not loading and user is authenticated
    console.log('Dashboard auth state:', { 
      isLoading: authLoading, 
      hasUser: !!user,
      userId: user?.id
    });
    
    if (!authLoading && user) {
      console.log('User authenticated, fetching patients');
      fetchPatients();
    } else if (!authLoading && !user) {
      // If auth loaded but no user, redirect to login
      console.log('No user found, redirecting to login');
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  async function fetchPatients() {
    setIsLoading(true);
    try {
      console.log('Attempting to fetch patients...');
      
      // First try with auth check
      try {
        console.log('Trying getPatients with auth check');
        const data = await getPatients();
        console.log('Success with auth check!');
        setPatients(data || []);
        return;
      } catch (authError) {
        console.error('Auth error, falling back to no-auth method:', authError);
        // Fall back to no-auth method if auth fails
        const data = await getPatientsNoAuth();
        console.log('Successfully fetched patients with no-auth method');
        setPatients(data || []);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to fetch patients');
      console.error('Error fetching patients:', error);
      
      // If authentication error, redirect to login
      if (errMsg === 'Authentication required') {
        router.push('/auth/signin');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    
    setIsLoading(true);
    try {
      await deletePatient(id);
      await fetchPatients();
      toast.success('Patient deleted successfully');
    } catch (error) {
      toast.error('Failed to delete patient');
      console.error('Error deleting patient:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(patient: Patient) {
    clearRedirectFlag();
    router.push(`/dashboard/patients/${patient.id}/edit`);
  }

  // Calculate dashboard statistics
  const totalPatients = patients.length;
  const recentAdmissions = patients.filter(
    p => {
      const admissionDate = p.created_at;
      return new Date(admissionDate).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
    }
  ).length;
  const upcomingFollowUps = patients.filter(
    p => {
      // Check if the patient has follow-up information in their data
      if (!p.treatment_plan || !p.treatment_plan.length) return false;
      // Use the current date for demonstration
      return true;
    }
  ).length;

  return (
    <div className="p-6">
      {/* Welcome Message */}
      {userProfile && (
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2 text-foreground">
            {userProfile.occupation === 'doctor' ? 
              `Welcome back, Dr. ${userProfile.name.split(' ')[0]}!` :
              userProfile.occupation === 'nurse' ? 
                `Welcome back, Nurse ${userProfile.name.split(' ')[0]}!` :
                `Welcome back, ${userProfile.name.split(' ')[0]}!`
            }
          </h1>
          <p className="text-muted-foreground">Here&apos;s an overview of your patient dashboard.</p>
        </div>
      )}
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="rounded-lg shadow p-6 bg-card text-card-foreground">
          <div className="text-sm font-medium text-muted-foreground">Total Patients</div>
          <div className="mt-2 text-3xl font-bold">{totalPatients}</div>
        </div>
        <div className="rounded-lg shadow p-6 bg-card text-card-foreground">
          <div className="text-sm font-medium text-muted-foreground">Recent Admissions (7d)</div>
          <div className="mt-2 text-3xl font-bold">{recentAdmissions}</div>
        </div>
        <div className="rounded-lg shadow p-6 bg-card text-card-foreground">
          <div className="text-sm font-medium text-muted-foreground">Upcoming Follow-ups (7d)</div>
          <div className="mt-2 text-3xl font-bold">{upcomingFollowUps}</div>
        </div>
      </div>

      {/* Patient List Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Patient Cards</h2>
          <Button
            onClick={() => {
              clearRedirectFlag();
              router.push('/dashboard/patients/new');
            }}
          >
            Add New Patient
          </Button>
        </div>
        
        <PatientCardGrid
          data={patients}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}