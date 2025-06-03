-- Grant usage on the schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permissions on the labs table
GRANT SELECT, INSERT, UPDATE, DELETE ON labs TO authenticated;

-- Grant usage on the sequence
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure the RLS policies are properly enforced
ALTER TABLE labs FORCE ROW LEVEL SECURITY; 