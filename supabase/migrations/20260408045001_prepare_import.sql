-- Migration to prepare for CSV data import
-- This migration ensures the schema is ready for import

-- Note: For bulk import with FK violations, use session-level bypass:
-- Before Import: SET session_replication_role = 'replica';
-- After Import: SET session_replication_role = 'origin';
-- Use this only for initial migration and verify data integrity afterwards.

-- Import order to respect FK constraints:
-- 1. Auth Users (if needed, recreate in auth.users)
-- 2. Profiles (linked to user_ids)
-- 3. Stores (linked to user_ids)
-- 4. Store API Keys (linked to store_ids)

-- Example import commands (replace with actual CSV paths):
-- COPY public.profiles FROM '/path/to/profiles.csv' WITH CSV HEADER;
-- COPY public.stores FROM '/path/to/stores.csv' WITH CSV HEADER;
-- COPY public.store_api_keys FROM '/path/to/store_api_keys.csv' WITH CSV HEADER;