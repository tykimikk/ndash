'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  getExpandedRowModel,
} from '@tanstack/react-table';
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Upload, Check, AlertTriangle } from 'lucide-react';
import { createLabResult, deleteLabResult, updateLabResult, getLabResults } from '@/lib/supabase';
import { LabTest, LabTestInput, LabCategory } from '@/types/lab';
import { LAB_CATEGORY_COLORS } from '@/types/patient';
import toast from 'react-hot-toast';
import { getDocument, GlobalWorkerOptions, TextItem } from 'pdfjs-dist';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

interface LabResultsTableProps {
  data: LabTest[];
  patientId: string;
  onUpdate: () => void;
}

const getStatusColor = (status?: string, severity?: string) => {
  if (status === 'normal') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  if (status === 'high') {
    return severity === 'critical'
      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  }
  if (status === 'low') {
    return severity === 'critical'
      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  }
  return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
};

const getResultColor = (status?: string, severity?: string) => {
  if (status === 'normal') return 'text-[var(--foreground)]';
  if (status === 'high') {
    return severity === 'critical'
      ? 'text-red-600 dark:text-red-400'
      : 'text-red-600 dark:text-red-400';
  }
  if (status === 'low') {
    return severity === 'critical'
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-yellow-600 dark:text-yellow-400';
  }
  return 'text-[var(--foreground)]';
};

// Custom Dropdown Component
interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

function Dropdown({ value, onChange, options, placeholder, className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-2 py-1.5 text-sm rounded-md text-[var(--foreground)] font-sans flex items-center justify-between hover:bg-[var(--muted)] transition-colors"
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 py-1 bg-[var(--background)] rounded-md shadow-lg border border-[var(--border)] max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full px-3 py-1.5 text-sm text-left hover:bg-[var(--muted)] flex items-center justify-between"
            >
              <span>{option.label}</span>
              {option.value === value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function LabResultsTable({ data: initialData, patientId, onUpdate }: LabResultsTableProps) {
  const [data, setData] = useState<LabTest[]>(initialData);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [labToDelete, setLabToDelete] = useState<LabTest | null>(null);
  const [editingLab, setEditingLab] = useState<LabTest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [filterType, setFilterType] = useState<'category' | 'status' | 'date' | ''>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [sortBy, setSortBy] = useState<'category' | 'date' | 'status'>('category');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setData(initialData);
    // Initialize all categories as expanded
    const categories = Array.from(new Set(initialData.map(item => item.category)));
    const initialExpanded = categories.reduce((acc, category) => {
      acc[category] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setExpandedCategories(initialExpanded);
  }, [initialData]);

  // Filter and sort data
  const filteredAndSortedData = React.useMemo(() => {
    let filtered = [...data];

    // Apply global filter
    if (globalFilter) {
      filtered = filtered.filter(item =>
        item.test_name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        item.result_value.toLowerCase().includes(globalFilter.toLowerCase())
      );
    }

    // Apply selected filter
    if (filterType && filterValue) {
      switch (filterType) {
        case 'category':
          filtered = filtered.filter(item => item.category === filterValue);
          break;
        case 'status':
          filtered = filtered.filter(item => item.status === filterValue);
          break;
        case 'date':
          const testDate = new Date(filterValue);
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.test_date);
            return itemDate.toDateString() === testDate.toDateString();
          });
          break;
      }
    }

    // Apply date range filter
    if (dateFilter.from || dateFilter.to) {
      filtered = filtered.filter(item => {
        const testDate = new Date(item.test_date);
        const fromDate = dateFilter.from ? new Date(dateFilter.from) : null;
        const toDate = dateFilter.to ? new Date(dateFilter.to) : null;
        
        if (fromDate && toDate) {
          return testDate >= fromDate && testDate <= toDate;
        } else if (fromDate) {
          return testDate >= fromDate;
        } else if (toDate) {
          return testDate <= toDate;
        }
        return true;
      });
    }

    // Sort data
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.test_date).getTime() - new Date(a.test_date).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'category':
        default:
          return a.category.localeCompare(b.category);
      }
    });

    return filtered;
  }, [data, globalFilter, filterType, filterValue, dateFilter, sortBy]);

  // Group data based on sort selection
  const groupedData = React.useMemo(() => {
    const groups: Record<string, LabTest[]> = {};
    
    filteredAndSortedData.forEach(item => {
      let groupKey: string;
      switch (sortBy) {
        case 'date':
          const date = new Date(item.test_date);
          groupKey = date.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          break;
        case 'status':
          groupKey = item.status.charAt(0).toUpperCase() + item.status.slice(1);
          break;
        case 'category':
        default:
          groupKey = item.category;
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return groups;
  }, [filteredAndSortedData, sortBy]);

  const refreshData = async () => {
    try {
      const updatedData = await getLabResults(patientId);
      setData(updatedData);
      await onUpdate();
    } catch (error) {
      console.error('Error refreshing lab results:', error);
      toast.error('Failed to refresh lab results');
    }
  };

  const handleAddNew = () => {
    setEditingLab(null);
    setIsModalOpen(true);
  };

  const handleEdit = (lab: LabTest) => {
    setEditingLab(lab);
    setIsModalOpen(true);
  };

  const handleDelete = async (lab: LabTest) => {
    setLabToDelete(lab);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!labToDelete) return;
    
    setIsLoading(true);
    try {
      await deleteLabResult(labToDelete.id);
      await refreshData();
      toast.success('Test deleted successfully');
    } catch (error) {
      console.error('Error deleting test:', error);
      toast.error('Failed to delete test');
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      setLabToDelete(null);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const columnHelper = createColumnHelper<LabTest>();

  const columns = [
    columnHelper.accessor('test_name', {
      header: 'Test Name',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('test_date', {
      header: 'Date',
      cell: info => new Date(info.getValue()).toLocaleDateString(),
    }),
    columnHelper.accessor('result_value', {
      header: 'Result',
      cell: info => {
        const value = info.getValue();
        const row = info.row.original;
        const color = getResultColor(row.status, row.severity);
        return (
          <span className={`font-medium ${color}`}>
            {value}
          </span>
        );
      },
    }),
    columnHelper.accessor('result_unit', {
      header: 'Unit',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('reference_range', {
      header: 'Reference Range',
      cell: info => {
        const range = info.getValue();
        if (!range) return '-';
        return range;
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue();
        const row = info.row.original;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status, row.severity)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(info.row.original)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-blue-600 dark:text-blue-400"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(info.row.original)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-red-600 dark:text-red-400"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    setIsLoading(true);
    try {
      // Read the file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load the PDF document
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      
      // Extract text from all pages
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: TextItem) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      console.log('Extracted text length:', fullText.length);

      // Process the extracted text with OpenRouter AI
      const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('OpenRouter API key not found');
      }

      // Split text into chunks of approximately 2000 characters
      const chunks = [];
      let currentChunk = '';
      const lines = fullText.split('\n');
      
      for (const line of lines) {
        if ((currentChunk + line).length > 2000) {
          chunks.push(currentChunk);
          currentChunk = line;
        } else {
          currentChunk += (currentChunk ? '\n' : '') + line;
        }
      }
      if (currentChunk) {
        chunks.push(currentChunk);
      }

      console.log('Split text into', chunks.length, 'chunks');

      // Process each chunk and combine results
      let allLabTests: any[] = [];
      
      for (const chunk of chunks) {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Lab Results Extraction'
          },
          body: JSON.stringify({
            model: 'tngtech/deepseek-r1t-chimera:free',
            messages: [
              {
                role: 'system',
                content: `You are a medical lab results extraction assistant. Your task is to extract lab test data from the provided text, translate test names to English, and return it as a valid JSON array. 
IMPORTANT: Your response must be a valid JSON array only, with no additional text or explanation before or after the JSON.
Each test in the array should be an object with these exact fields:
{
  "test_name": "string (in English, use medical abbreviations if possible)",
  "test_date": "YYYY-MM-DD",
  "result_value": "string or number",
  "result_unit": "string",
  "reference_range": "string",
  "status": "normal" | "high" | "low" | "critical",
  "severity": "normal" | "warning" | "critical",
  "category": "Complete Blood Count" | "Liver Function" | "Kidney Function" | "Coagulation" | "Tumor Markers" | "Infection Markers" | "Hormones" | "Urinalysis" | "Biochemistry" | "Immunology" | "Blood Gas" | "Toxicology" | "Genetic & Molecular" | "Nutritional" | "Other"
}

DO NOT include any explanation or text before or after the JSON array.`
              },
              {
                role: 'user',
                content: `Extract lab test data from this text and return it as a JSON array. Follow these rules:
1. Translate the text to English (test_name must be in English! and use medical abbreviations if possible)
2. Return ONLY the JSON array, no other text or explanation
3. Each test must have all required fields
4. For dates, use YYYY-MM-DD format
5. For status, compare result with reference range:
   - If result is within range: "normal"
   - If result is above range: "high"
   - If result is below range: "low"
   - If result is significantly outside range: "critical"
6. For severity:
   - If status is "normal": "normal"
   - If status is "high" or "low": "warning"
   - If status is "critical": "critical"
7. Categorize each test into the appropriate category

Text to process:
${chunk}`
              }
            ],
            temperature: 0.1,
            max_tokens: 2000,
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('AI API Error:', errorText);
          throw new Error(`Failed to process with AI: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('AI Response for chunk:', result);
        
        const aiResponse = result.choices[0]?.message?.content;
        console.log('AI Content for chunk:', aiResponse);
        
        if (!aiResponse) {
          console.warn('No response from AI for chunk, skipping');
          continue;
        }

        // Try to parse the JSON response
        let chunkTests;
        try {
          // First try direct JSON parse
          chunkTests = JSON.parse(aiResponse);
        } catch {
          console.log('Direct parse failed, trying to extract JSON from text');
          // If direct parse fails, try to find JSON array in the text
          const jsonMatch = aiResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (!jsonMatch) {
            // Try to find complete objects in the text
            const objectMatches = aiResponse.match(/\{\s*"test_name"[\s\S]*?\}\s*(?=,|$)/g);
            if (!objectMatches || objectMatches.length === 0) {
              console.warn('Could not find valid JSON in chunk response, skipping');
              continue;
            }
            
            // Try to construct a valid array from the complete objects
            try {
              const jsonString = '[' + objectMatches.join(',') + ']';
              chunkTests = JSON.parse(jsonString);
            } catch {
              console.warn('Failed to parse extracted objects from chunk, skipping');
              continue;
            }
          } else {
            try {
              chunkTests = JSON.parse(jsonMatch[0]);
            } catch {
              console.warn('Failed to parse extracted JSON from chunk, skipping');
              continue;
            }
          }
        }

        if (Array.isArray(chunkTests)) {
          allLabTests = [...allLabTests, ...chunkTests];
        }
      }

      // Validate each test object
      allLabTests = allLabTests.filter(test => {
        const isValid = test && 
          typeof test === 'object' && 
          test.test_name && 
          test.test_date && 
          test.result_value;
        
        if (!isValid) {
          console.warn('Skipping invalid test object:', test);
        }
        return isValid;
      });

      console.log('Total parsed lab tests:', allLabTests.length);
      
      // Process each lab test and save to database
      for (const test of allLabTests) {
        const labTestInput: LabTestInput = {
          patient_id: patientId,
          test_date: test.test_date,
          test_name: test.test_name,
          category: test.category || 'Other',
          result_value: test.result_value.toString(),
          result_unit: test.result_unit || '',
          reference_range: test.reference_range || '',
          status: test.status || 'normal',
          severity: test.severity || 'normal'
        };

        try {
          await createLabResult(labTestInput);
        } catch (dbError) {
          console.error('Error saving test:', test, dbError);
          // Continue with other tests even if one fails
        }
      }

      await refreshData();
      toast.success('Lab results imported successfully');
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process PDF file');
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <input
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="Search tests..."
            className="w-full sm:max-w-sm px-4 py-2 border rounded-lg bg-[var(--muted)]"
          />
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            {/* Group By */}
            <div className="relative flex-1 sm:flex-none">
              <label className="block text-xs font-medium mb-1 text-[var(--muted-foreground)]">Group By</label>
              <Dropdown
                value={sortBy}
                onChange={(value) => setSortBy(value as 'category' | 'date' | 'status')}
                options={[
                  { value: 'category', label: 'Category' },
                  { value: 'date', label: 'Date' },
                  { value: 'status', label: 'Status' }
                ]}
                className="w-full sm:w-32"
              />
            </div>

            {/* Filter */}
            <div className="flex flex-wrap items-end gap-2 flex-1 sm:flex-none">
              <div className="relative flex-1 sm:flex-none">
                <label className="block text-xs font-medium mb-1 text-[var(--muted-foreground)]">Filter</label>
                <Dropdown
                  value={filterType}
                  onChange={(value) => {
                    setFilterType(value as 'category' | 'status' | 'date' | '');
                    setFilterValue('');
                    setDateFilter({ from: '', to: '' });
                  }}
                  options={[
                    { value: '', label: 'No Filter' },
                    { value: 'category', label: 'By Category' },
                    { value: 'status', label: 'By Status' },
                    { value: 'date', label: 'By Date' }
                  ]}
                  className="w-full sm:w-32"
                />
              </div>

              {/* Nested Filter Options */}
              {filterType && (
                <div className="flex flex-wrap items-end gap-2 flex-1 sm:flex-none">
                  {filterType === 'category' && (
                    <Dropdown
                      value={filterValue}
                      onChange={setFilterValue}
                      options={[
                        { value: '', label: 'Select Category' },
                        ...Object.keys(LAB_CATEGORY_COLORS).map(category => ({
                          value: category,
                          label: category
                        }))
                      ]}
                      className="w-full sm:w-40"
                    />
                  )}

                  {filterType === 'status' && (
                    <Dropdown
                      value={filterValue}
                      onChange={setFilterValue}
                      options={[
                        { value: '', label: 'Select Status' },
                        { value: 'normal', label: 'Normal' },
                        { value: 'high', label: 'High' },
                        { value: 'low', label: 'Low' },
                        { value: 'critical', label: 'Critical' }
                      ]}
                      className="w-full sm:w-32"
                    />
                  )}

                  {filterType === 'date' && (
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <input
                        type="date"
                        value={dateFilter.from}
                        onChange={e => setDateFilter(prev => ({ ...prev, from: e.target.value }))}
                        className="w-full sm:w-32 px-2 py-1.5 text-sm rounded-md text-[var(--foreground)] font-sans appearance-none cursor-pointer hover:bg-[var(--muted)] transition-colors"
                        placeholder="From"
                      />
                      <input
                        type="date"
                        value={dateFilter.to}
                        onChange={e => setDateFilter(prev => ({ ...prev, to: e.target.value }))}
                        className="w-full sm:w-32 px-2 py-1.5 text-sm rounded-md text-[var(--foreground)] font-sans appearance-none cursor-pointer hover:bg-[var(--muted)] transition-colors"
                        placeholder="To"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="relative w-full sm:w-auto">
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                onClick={triggerFileInput}
                disabled={isLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[var(--background)] bg-[var(--primary)] rounded-lg hover:bg-[var(--primary)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Import from File
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
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
                  {table.getHeaderGroups().map(headerGroup => (
                    <React.Fragment key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-sm font-medium text-[var(--muted-foreground)] whitespace-nowrap"
                        >
                          {header.isPlaceholder ? null : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </th>
                      ))}
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedData).map(([groupKey, groupData]) => (
                  <React.Fragment key={groupKey}>
                    <tr>
                      <td colSpan={table.getAllColumns().length}>
                        <div 
                          className="flex items-center gap-2 cursor-pointer px-4 py-2"
                          onClick={() => toggleCategory(groupKey)}
                        >
                          {expandedCategories[groupKey] ? (
                            <ChevronDown className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 flex-shrink-0" />
                          )}
                          <span className={`px-3 py-1.5 rounded-md text-sm font-medium truncate ${
                            sortBy === 'category' 
                              ? LAB_CATEGORY_COLORS[groupKey as keyof typeof LAB_CATEGORY_COLORS]
                              : sortBy === 'status'
                              ? getStatusColor(groupKey)
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                          }`}>
                            {groupKey}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {expandedCategories[groupKey] && groupData.map((row) => (
                      <tr key={row.id} className="hover:bg-[var(--muted)]">
                        {table.getRowModel().rows.find(r => r.original.id === row.id)?.getVisibleCells().map(cell => (
                          <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                <tr 
                  className="group relative hover:bg-[var(--muted)] cursor-pointer"
                  onClick={handleAddNew}
                >
                  <td colSpan={table.getAllColumns().length} className="px-4 py-1">
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
            {Object.entries(groupedData).map(([groupKey, groupData]) => (
              <div key={groupKey} className="border-b border-[var(--border)] last:border-b-0">
                <div 
                  className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-[var(--muted)]"
                  onClick={() => toggleCategory(groupKey)}
                >
                  {expandedCategories[groupKey] ? (
                    <ChevronDown className="h-4 w-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  )}
                  <span className={`px-3 py-1.5 rounded-md text-sm font-medium truncate ${
                    sortBy === 'category' 
                      ? LAB_CATEGORY_COLORS[groupKey as keyof typeof LAB_CATEGORY_COLORS]
                      : sortBy === 'status'
                      ? getStatusColor(groupKey)
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                  }`}>
                    {groupKey}
                  </span>
                </div>
                
                {expandedCategories[groupKey] && (
                  <div className="divide-y divide-[var(--border)]">
                    {groupData.map((row) => (
                      <div key={row.id} className="p-4 hover:bg-[var(--muted)]">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-[var(--foreground)]">{row.test_name}</h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(row)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-blue-600 dark:text-blue-400"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(row)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-red-600 dark:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className={`text-lg font-medium ${getResultColor(row.status, row.severity)}`}>
                              {row.result_value}
                            </span>
                            <span className="text-sm text-[var(--muted-foreground)]">
                              {row.result_unit}
                            </span>
                          </div>
                          
                          <div className="text-sm text-[var(--muted-foreground)]">
                            Reference: {row.reference_range || '-'}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(row.status, row.severity)}`}>
                              {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                            </span>
                            <span className="text-xs text-[var(--muted-foreground)]">
                              {new Date(row.test_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
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
              {editingLab ? 'Edit Test' : 'Add New Test'}
            </h2>
            <LabResultForm
              initialData={editingLab}
              patientId={patientId}
              onSubmit={async (formData) => {
                setIsLoading(true);
                try {
                  if (editingLab) {
                    await updateLabResult(editingLab.id, formData);
                    toast.success('Test updated successfully');
                  } else {
                    await createLabResult(formData);
                    toast.success('Test added successfully');
                  }
                  setIsModalOpen(false);
                  await refreshData();
                } catch (error) {
                  console.error('Error saving test:', error);
                  toast.error('Failed to save test');
                } finally {
                  setIsLoading(false);
                }
              }}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && labToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--background)] rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold">Delete Test</h2>
            </div>
            
            <p className="text-[var(--muted-foreground)] mb-6">
              Are you sure you want to delete the test "{labToDelete.test_name}"? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setLabToDelete(null);
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
                Delete Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Lab Result Form Component
interface LabResultFormProps {
  initialData: LabTest | null;
  patientId: string;
  onSubmit: (data: LabTestInput) => void;
  onCancel: () => void;
}

function LabResultForm({ initialData, patientId, onSubmit, onCancel }: LabResultFormProps) {
  const [formData, setFormData] = React.useState<LabTestInput>(
    initialData || {
      patient_id: patientId,
      test_date: new Date().toISOString(),
      test_name: '',
      category: 'Complete Blood Count' as LabCategory,
      result_value: '',
      result_unit: '',
      reference_range: '',
      status: 'normal',
      severity: 'normal',
    }
  );

  const calculateStatus = (value: string, range: string): { status: 'normal' | 'high' | 'low' | 'critical', severity: 'normal' | 'warning' | 'critical' } => {
    if (!value || !range) return { status: 'normal', severity: 'normal' };

    // Try to parse the value as a number
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return { status: 'normal', severity: 'normal' };

    // Parse reference range
    const rangeMatch = range.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
    if (!rangeMatch) return { status: 'normal', severity: 'normal' };

    const [, minStr, maxStr] = rangeMatch;
    const min = parseFloat(minStr);
    const max = parseFloat(maxStr);

    if (isNaN(min) || isNaN(max)) return { status: 'normal', severity: 'normal' };

    // Calculate how far outside the range the value is (as a percentage)
    const rangeWidth = max - min;
    const deviation = numValue < min 
      ? (min - numValue) / rangeWidth 
      : (numValue - max) / rangeWidth;

    // Determine status and severity
    if (numValue >= min && numValue <= max) {
      return { status: 'normal', severity: 'normal' };
    } else if (deviation <= 0.2) { // Within 20% of range
      return { 
        status: numValue < min ? 'low' : 'high',
        severity: 'normal'
      };
    } else if (deviation <= 0.5) { // Within 50% of range
      return { 
        status: numValue < min ? 'low' : 'high',
        severity: 'warning'
      };
    } else { // More than 50% outside range
      return { 
        status: numValue < min ? 'low' : 'high',
        severity: 'critical'
      };
    }
  };

  const handleValueChange = (value: string) => {
    const { status, severity } = calculateStatus(value, formData.reference_range);
    setFormData(prev => ({
      ...prev,
      result_value: value,
      status,
      severity
    }));
  };

  const handleRangeChange = (range: string) => {
    const { status, severity } = calculateStatus(formData.result_value, range);
    setFormData(prev => ({
      ...prev,
      reference_range: range,
      status,
      severity
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Test Name</label>
        <input
          type="text"
          value={formData.test_name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, test_name: e.target.value })}
          className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          value={formData.category}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, category: e.target.value as LabCategory })}
          className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          required
        >
          {Object.keys(LAB_CATEGORY_COLORS).map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Date</label>
        <input
          type="datetime-local"
          value={formData.test_date.slice(0, 16)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, test_date: new Date(e.target.value).toISOString() })}
          className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Result Value</label>
          <input
            type="text"
            value={formData.result_value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleValueChange(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Unit</label>
          <input
            type="text"
            value={formData.result_unit}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({
              ...formData,
              result_unit: e.target.value
            })}
            className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Reference Range</label>
        <input
          type="text"
          value={formData.reference_range}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleRangeChange(e.target.value)}
          placeholder="e.g., 10-20"
          className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        />
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          {initialData ? 'Update' : 'Add'} Test
        </button>
      </div>
    </form>
  );
} 