# Database Schema Update

## Changes Made
- ✅ Removed `licenses` table completely
- ✅ Removed all license-related indexes and RLS policies
- ✅ Kept all role-based tables and functionality intact
- ✅ Deleted new migration files created for RLS fixes
- ✅ Restored original migration files

## Current Tables
- `profiles` - User profiles
- `user_roles` - User role assignments (super_owner, it_support, customer_support, merchant)
- `subscriptions` - User subscriptions
- `stores` - Store information
- `store_cameras` - Camera configurations
- `admin_commands` - Admin commands for stores
- `engine_status` - Engine heartbeat status
- `store_api_keys` - API keys for stores
- `analytics_logs` - Analytics data
- `security_alerts` - Security alerts

## Next Steps
Run `npx supabase db reset` to apply these changes to your database.

The system now has role-based access control without licenses, focusing on store management and camera monitoring.