-- Allow authenticated users to create mock test records
ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can insert mock tests" ON public.mock_tests
  FOR INSERT TO authenticated
  WITH CHECK (true);
