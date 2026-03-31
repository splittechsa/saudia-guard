
-- Add store_status column for lifecycle management (draft -> pending_review -> active -> suspended)
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS store_status text NOT NULL DEFAULT 'draft';

-- Add IT review notes
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS it_review_notes text;

-- Add reviewed_by and reviewed_at
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS reviewed_by uuid;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- IT support can view all profiles (needed for user name lookups)
CREATE POLICY "IT support can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'it_support'));

-- Auto-generate API key trigger on store activation
CREATE OR REPLACE FUNCTION public.auto_generate_api_key()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.store_status = 'active' AND (OLD.store_status IS DISTINCT FROM 'active') THEN
    INSERT INTO public.store_api_keys (store_id)
    VALUES (NEW.id)
    ON CONFLICT (store_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_store_activated
  AFTER UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_api_key();
