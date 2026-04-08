CREATE TABLE public.payments_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  tap_charge_id text NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'SAR',
  status text NOT NULL DEFAULT 'pending',
  tap_response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments_history
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON public.payments_history
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super owners can view all payments" ON public.payments_history
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_owner'::app_role));

CREATE POLICY "Service role can manage payments" ON public.payments_history
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);