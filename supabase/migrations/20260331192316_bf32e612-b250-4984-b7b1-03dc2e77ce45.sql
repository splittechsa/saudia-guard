
-- Allow service role to insert security alerts (used by ingest-audit edge function)
CREATE POLICY "Service role can insert alerts"
ON public.security_alerts FOR INSERT
TO service_role
WITH CHECK (true);

-- Allow it_support to view stores for system status
CREATE POLICY "IT support can view all stores"
ON public.stores FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'it_support'));

-- Allow it_support to view analytics_logs for system status
CREATE POLICY "IT support can view all logs"
ON public.analytics_logs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'it_support'));

-- Restrict subscriptions visibility - it_support should NOT see financial data
-- (already handled: only super_owner and own user can see subscriptions)
