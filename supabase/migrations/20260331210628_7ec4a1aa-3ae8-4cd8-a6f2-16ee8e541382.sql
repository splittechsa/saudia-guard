
-- Add remote_command column to stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS remote_command text NOT NULL DEFAULT 'run';

-- Create ticket_messages table for chat system
CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'merchant',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Ticket owner can view & insert messages on their tickets
CREATE POLICY "Ticket owner can view messages" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets st WHERE st.id = ticket_messages.ticket_id AND st.user_id = auth.uid()
  ));

CREATE POLICY "Ticket owner can send messages" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.support_tickets st WHERE st.id = ticket_messages.ticket_id AND st.user_id = auth.uid())
  );

-- IT support can view & reply to all ticket messages
CREATE POLICY "IT support can view all messages" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'it_support'::app_role));

CREATE POLICY "IT support can send messages" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND has_role(auth.uid(), 'it_support'::app_role));

-- Super owner can view & reply to all ticket messages
CREATE POLICY "Super owner can view all messages" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_owner'::app_role));

CREATE POLICY "Super owner can send messages" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND has_role(auth.uid(), 'super_owner'::app_role));

-- Enable realtime for ticket messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;

-- Super owner needs SELECT on profiles for user management
CREATE POLICY "Super owners can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_owner'::app_role));
