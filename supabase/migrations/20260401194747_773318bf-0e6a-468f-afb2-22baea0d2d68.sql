
-- Indexes for scaling to 100+ stores
CREATE INDEX IF NOT EXISTS idx_analytics_logs_store_id_created ON public.analytics_logs (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_logs_created_at ON public.analytics_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id_status ON public.subscriptions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_system_logs_store_id_created ON public.system_logs (store_id, created_at DESC);

-- Archive table for old analytics logs
CREATE TABLE IF NOT EXISTS public.analytics_logs_archive (
  id uuid PRIMARY KEY,
  store_id uuid NOT NULL,
  score integer,
  status text,
  summary text,
  result jsonb,
  observations jsonb,
  ai_reasoning text,
  confidence_score numeric,
  client_environment jsonb,
  disputed boolean DEFAULT false,
  created_at timestamptz NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now()
);

-- RLS on archive table
ALTER TABLE public.analytics_logs_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own archived logs" ON public.analytics_logs_archive
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = analytics_logs_archive.store_id AND stores.user_id = auth.uid()));

CREATE POLICY "Super owners can view all archived logs" ON public.analytics_logs_archive
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_owner'::app_role));

CREATE POLICY "IT support can view all archived logs" ON public.analytics_logs_archive
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'it_support'::app_role));

-- Service role can insert into archive
CREATE POLICY "Service role can manage archive" ON public.analytics_logs_archive
  FOR ALL TO service_role USING (true) WITH CHECK (true);
