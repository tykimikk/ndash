'use client';

export default function TestEnvPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Environment Variables Test</h1>
      <div className="space-y-2">
        <p>API Key present: {process.env.NEXT_PUBLIC_HF_API_KEY ? 'Yes' : 'No'}</p>
        <p>API Key length: {process.env.NEXT_PUBLIC_HF_API_KEY?.length || 0}</p>
      </div>
    </div>
  );
} 