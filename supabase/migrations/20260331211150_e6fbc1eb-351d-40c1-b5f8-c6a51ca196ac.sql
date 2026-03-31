
-- IT support can view all tickets
CREATE POLICY "IT support can view all tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'it_support'::app_role));

-- IT support can update all tickets
CREATE POLICY "IT support can update all tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'it_support'::app_role));

-- IT support can update all stores (for remote commands)
CREATE POLICY "IT support can update all stores" ON public.stores
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'it_support'::app_role));
