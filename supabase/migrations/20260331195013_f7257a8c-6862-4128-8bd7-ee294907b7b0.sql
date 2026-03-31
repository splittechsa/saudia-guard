
-- Super owners can update all subscriptions (for approval workflow)
CREATE POLICY "Super owners can update all subscriptions"
ON public.subscriptions FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_owner'::app_role));

-- Super owners can update all stores (for activation)
CREATE POLICY "Super owners can update all stores"
ON public.stores FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_owner'::app_role));
