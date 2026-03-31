
CREATE POLICY "Service role can insert messages"
ON public.ticket_messages
FOR INSERT
TO service_role
WITH CHECK (true);
