ALTER TABLE public.payments_history ADD COLUMN payment_method text;
ALTER TABLE public.payments_history ADD COLUMN receipt_url text;

ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;