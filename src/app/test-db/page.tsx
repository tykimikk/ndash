'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getPatientsNoAuth } from '@/lib/supabase';

export default function TestDbPage() {
  const [status, setStatus] = useState<string>('Checking...');
  const [sessionData, setSessionData] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkConnection() {
      try {
        // Test direct database access
        const { count, error } = await supabase
          .from('patients')
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          setStatus('Database error: ' + error.message);
          setError(JSON.stringify(error, null, 2));
          return;
        }
        
        setStatus(`Connected to database. Found ${count} patients.`);
        
        // Also test session
        const { data } = await supabase.auth.getSession();
        setSessionData(data);
        
        // Fetch patients with the no-auth function
        try {
          const patientData = await getPatientsNoAuth();
          setPatients(patientData || []);
        } catch (err) {
          console.error('Error fetching patients:', err);
          setError(err instanceof Error ? err.message : String(err));
        }
      } catch (err) {
        setStatus('Connection failed');
        setError(err instanceof Error ? err.message : String(err));
      }
    }
    
    checkConnection();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Connection Status:</h2>
        <div className={status.includes('error') ? 'text-red-500' : 'text-green-500'}>
          {status}
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Session Data:</h2>
        <pre className="text-xs overflow-auto p-2 bg-gray-200 rounded">
          {JSON.stringify(sessionData, null, 2)}
        </pre>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 rounded">
          <h2 className="font-semibold mb-2">Error:</h2>
          <pre className="text-xs overflow-auto p-2 bg-red-200 rounded">
            {error}
          </pre>
        </div>
      )}
      
      <div className="p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Patients Data (No Auth Check):</h2>
        {patients.length > 0 ? (
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {patients.slice(0, 5).map((patient) => (
                <tr key={patient.id}>
                  <td className="px-4 py-2">{patient.id.substring(0, 8)}...</td>
                  <td className="px-4 py-2">{patient.full_name}</td>
                  <td className="px-4 py-2">
                    {new Date(patient.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No patients found</p>
        )}
      </div>
    </div>
  );
} 