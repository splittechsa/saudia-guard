
-- 1. Add observations column to analytics_logs
ALTER TABLE public.analytics_logs ADD COLUMN IF NOT EXISTS observations jsonb DEFAULT NULL;

-- 2. Add interval_minutes to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS interval_minutes integer DEFAULT 5;

-- 3. Create store_api_keys table for engine authentication
CREATE TABLE public.store_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  api_key text NOT NULL DEFAULT md5(random()::text || now()::text),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id)
);

ALTER TABLE public.store_api_keys ENABLE ROW LEVEL SECURITY;

-- Super owners can manage all API keys
CREATE POLICY "Super owners can manage api keys" ON public.store_api_keys
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_owner'::app_role));

-- Store owners can view their own API keys
CREATE POLICY "Store owners can view own api keys" ON public.store_api_keys
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_api_keys.store_id AND stores.user_id = auth.uid()));

-- Service role can read api keys (for edge function validation)
CREATE POLICY "Service role can read api keys" ON public.store_api_keys
  FOR SELECT TO service_role
  USING (true);
