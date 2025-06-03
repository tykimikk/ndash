'use client';

import { useState } from 'react';
import { processPatientWordDocument } from '@/lib/ai-service';
import type { Patient } from '@/types/patient';
import toast from 'react-hot-toast';
import { Button } from './Button';

interface PatientDocumentUploaderProps {
  onDataExtracted: (data: Partial<Patient>) => void;
  formTemplate: Partial<Patient>;
}

export function PatientDocumentUploader({ 
  onDataExtracted, 
  formTemplate 
}: PatientDocumentUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check if it's a Word document
      if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.type === 'application/msword' ||
        // Allow other document types as fallback
        file.type === 'application/pdf' ||
        file.type === 'text/plain'
      ) {
        setSelectedFile(file);
        setProcessingStatus('');
      } else {
        toast.error('Please select a valid document file (.doc, .docx, .pdf, or .txt)');
        e.target.value = '';
      }
    }
  };

  const handleProcessDocument = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Starting document processing...');
    
    try {
      // Step 1: Update status
      setProcessingStatus('Extracting text from document...');
      
      // Process the document with AI
      const extractedData = await processPatientWordDocument(selectedFile, formTemplate);
      
      // Step 2: Update status
      setProcessingStatus('Processing complete!');
      
      // Call the callback with the extracted data
      onDataExtracted(extractedData);
      
      // Check if we got meaningful data
      const dataKeys = Object.keys(extractedData);
      if (dataKeys.length === 0) {
        toast.error('Could not extract any data from the document');
      } else if (dataKeys.length < 3) {
        toast.success(`Extracted ${dataKeys.length} fields from document`, { 
          duration: 3000,
          icon: '⚠️'
        });
      } else {
        toast.success('Patient data extracted successfully');
      }
    } catch (error) {
      console.error('Error processing document:', error);
      
      // Provide a specific error message based on the context
      let errorMessage = 'Failed to extract patient data';
      
      if (error instanceof Error) {
        if (error.message.includes('API')) {
          errorMessage = 'AI service unavailable. Using local extraction.';
          // Try to use the last fallback directly
          try {
            setProcessingStatus('AI unavailable, using local extraction...');
            
            const textContent = await fetch(URL.createObjectURL(selectedFile)).then(r => r.text());
            
            // Basic extraction directly in component as last resort
            const extractedData: Partial<Patient> = {};
            const nameMatch = textContent.match(/(?:Name|Patient):\s*([^\n]+)/i);
            if (nameMatch && nameMatch[1]) {
              extractedData.full_name = nameMatch[1].trim();
            }
            
            if (Object.keys(extractedData).length > 0) {
              onDataExtracted(extractedData);
              toast.success('Basic data extracted using local processing', { 
                duration: 4000,
                icon: '⚠️'
              });
            } else {
              toast.error(errorMessage);
            }
          } catch {
            // Silently handle fallback error and show the original error message
            toast.error(errorMessage);
          }
        } else if (error.message.includes('parse')) {
          errorMessage = 'Could not parse document format';
        }
      }
      
      if (error instanceof Error && !error.message.includes('API')) {
        toast.error(errorMessage);
      }
    } finally {
      setIsProcessing(false);
      // Keep success status but clear error status after a delay
      if (processingStatus.includes('error') || processingStatus.includes('fail')) {
        setTimeout(() => setProcessingStatus(''), 3000);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border border-[var(--border)] rounded-lg bg-[var(--card)]">
      <h3 className="font-medium text-lg">Extract Patient Data from Document</h3>
      <p className="text-sm text-[var(--muted-foreground)]">
        Upload a document containing patient information to automatically fill the form.
      </p>
      
      <div className="flex items-center gap-3 mt-2">
        <div className="relative flex-1">
          <input
            type="file"
            id="patient-document"
            accept=".doc,.docx,.pdf,.txt"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isProcessing}
          />
          <div className="w-full py-2 px-4 text-sm border border-[var(--border)] rounded-md bg-[var(--input)] overflow-hidden text-ellipsis">
            {selectedFile ? selectedFile.name : 'Choose file...'}
          </div>
        </div>
        
        <Button
          onClick={handleProcessDocument}
          disabled={!selectedFile || isProcessing}
          isLoading={isProcessing}
          variant="primary"
        >
          {isProcessing ? 'Processing...' : 'Extract Data'}
        </Button>
      </div>
      
      {processingStatus && (
        <p className={`text-xs ${processingStatus.includes('error') || processingStatus.includes('fail') 
          ? 'text-[#FF5555]' 
          : processingStatus.includes('complete') 
            ? 'text-[#77DD77]' 
            : 'text-[var(--muted-foreground)]'}`}>
          {processingStatus}
        </p>
      )}
      
      {selectedFile && !processingStatus && (
        <p className="text-xs text-[var(--muted-foreground)]">
          Selected file: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
        </p>
      )}
    </div>
  );
} 