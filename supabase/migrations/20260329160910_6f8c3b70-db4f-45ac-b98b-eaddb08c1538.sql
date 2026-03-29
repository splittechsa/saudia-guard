-- Add INSERT policy for analytics_logs so authenticated users can insert for their own stores
CREATE POLICY "Users can insert own store logs" ON public.analytics_logs
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores WHERE stores.id = analytics_logs.store_id AND stores.user_id = auth.uid()
  )
);

-- Add query_status column to stores for query moderation workflow
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS query_status text NOT NULL DEFAULT 'approved';
