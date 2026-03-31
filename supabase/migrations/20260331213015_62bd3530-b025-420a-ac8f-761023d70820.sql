
-- Add emergency fields to analytics_logs
ALTER TABLE public.analytics_logs 
  ADD COLUMN IF NOT EXISTS disputed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_reasoning text,
  ADD COLUMN IF NOT EXISTS confidence_score numeric,
  ADD COLUMN IF NOT EXISTS client_environment jsonb;

-- Create system_logs table for debug mode
CREATE TABLE public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  log_type text NOT NULL DEFAULT 'debug',
  raw_response jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- IT support and super owners can view system logs
CREATE POLICY "IT support can view system logs" ON public.system_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'it_support'));

CREATE POLICY "Super owners can view system logs" ON public.system_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_owner'));

-- Service role can insert (from edge functions)
CREATE POLICY "Service role can insert system logs" ON public.system_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Allow merchants to update disputed flag on their own store logs
CREATE POLICY "Users can dispute own store logs" ON public.analytics_logs
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM stores WHERE stores.id = analytics_logs.store_id AND stores.user_id = auth.uid()
  ));

-- Add debug_mode column to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS debug_mode boolean DEFAULT false;

-- Enable realtime for system_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_logs;
