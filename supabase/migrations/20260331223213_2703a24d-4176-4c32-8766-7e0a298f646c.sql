
-- Broadcasts table for Owner announcements
CREATE TABLE public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  message text NOT NULL,
  target_role text DEFAULT 'all',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super owners can insert broadcasts" ON public.broadcasts
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_owner'::app_role));

CREATE POLICY "Authenticated users can view broadcasts" ON public.broadcasts
  FOR SELECT TO authenticated
  USING (true);

-- Audit trail table for tracking admin/IT actions
CREATE TABLE public.audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert audit trail" ON public.audit_trail
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Super owners can view audit trail" ON public.audit_trail
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_owner'::app_role));

CREATE POLICY "IT can view audit trail" ON public.audit_trail
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'it_support'::app_role));

-- Allow authenticated to insert audit trail too (for client-side logging)
CREATE POLICY "Authenticated can insert audit trail" ON public.audit_trail
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- Enable realtime for broadcasts
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcasts;
