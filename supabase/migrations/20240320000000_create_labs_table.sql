-- Create labs table
CREATE TABLE IF NOT EXISTS labs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    test_name TEXT NOT NULL,
    test_date DATE NOT NULL,
    result_value TEXT NOT NULL,
    result_unit TEXT,
    reference_range TEXT,
    status TEXT,
    severity TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on patient_id for faster lookups
CREATE INDEX IF NOT EXISTS labs_patient_id_idx ON labs(patient_id);

-- Create index on test_date for faster sorting
CREATE INDEX IF NOT EXISTS labs_test_date_idx ON labs(test_date);

-- Add RLS policies
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own lab results
CREATE POLICY "Users can view their own lab results"
    ON labs FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM user_profiles WHERE patient_id = labs.patient_id
    ));

-- Allow authenticated users to insert their own lab results
CREATE POLICY "Users can insert their own lab results"
    ON labs FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT user_id FROM user_profiles WHERE patient_id = labs.patient_id
    ));

-- Allow authenticated users to update their own lab results
CREATE POLICY "Users can update their own lab results"
    ON labs FOR UPDATE
    USING (auth.uid() IN (
        SELECT user_id FROM user_profiles WHERE patient_id = labs.patient_id
    ));

-- Allow authenticated users to delete their own lab results
CREATE POLICY "Users can delete their own lab results"
    ON labs FOR DELETE
    USING (auth.uid() IN (
        SELECT user_id FROM user_profiles WHERE patient_id = labs.patient_id
    )); 