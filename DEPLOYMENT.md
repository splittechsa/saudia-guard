# CRITICAL: Vercel + Supabase Configuration

## Issue: Data Routing to Lovable Cloud

Previously, the application was routing new user registrations and data to Lovable Cloud instead of the External Supabase instance. This has been resolved by:

1. **Removing Lovable Cloud Dependencies**
   - Removed `@lovable.dev/cloud-auth-js` package
   - Removed `lovable-tagger` plugin from Vite
   - Updated `/src/integrations/lovable/index.ts` to use pure Supabase OAuth

2. **Switched OAuth to Native Supabase**
   - All OAuth flows now route through Supabase directly
   - Apple, Google, and Microsoft OAuth now use Supabase's built-in providers

## Vercel Deployment Steps

### 1. Set Environment Variables in Vercel Dashboard

**CRITICAL**: These must be set in Vercel project settings, not in local .env

Navigate to: Project Settings → Environment Variables

Add these variables for **Production, Preview, and Development**:

```
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
VITE_SUPABASE_PROJECT_ID=your-supabase-project-id
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
SUPABASE_ACCESS_TOKEN=sbp_xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyxx_xxxxx
```

### 2. Verify These Steps

✓ Environment variables are set in Vercel Dashboard (NOT in .env file in repo)
✓ VITE_ prefixed variables are included (they get embedded during build)
✓ All three environments (Production, Preview, Development) have variables
✓ Package.json has removed Lovable dependencies
✓ vite.config.ts has removed lovable-tagger plugin

### 3. Redeploy on Vercel

After setting environment variables:
1. Go to Deployments in Vercel
2. Click "Redeploy" on the latest commit (or push a new commit)
3. Vercel will rebuild with correct environment variables
4. Monitor build logs to confirm VITE_ variables are properly injected

### 4. Verify Database Routing

After deployment:
1. Register a new user on production
2. Check data appears in External Supabase (not Lovable Cloud)
3. Check Supabase dashboard → Authentication → Users
4. Check data tables to confirm new registrations

## Local Development

For local development, ensure .env has correct values:

```bash
VITE_SUPABASE_URL="https://your-supabase-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
```

Run: `npm run dev` (Vite will read these automatically)

## DO NOT

❌ Do NOT commit real keys to version control
❌ Do NOT rely on .env file in production (Vercel ignores it)
❌ Do NOT use Lovable auth library for OAuth
❌ Do NOT re-add @lovable.dev packages

## Troubleshooting

**Problem**: Still seeing data in Lovable Cloud
- Solution: Force redeploy on Vercel (clear cache)
- Check Vercel build logs → confirm VITE_ variables present
- Check browser DevTools → Network → verify requests go to supabase.co

**Problem**: OAuth not working
- Solution: Check Supabase dashboard → Authentication → Redirect URLs
- Add your Vercel domain to OAuth provider settings

## References

- Supabase Client: `/src/integrations/supabase/client.ts`
- Auth Hook: `/src/hooks/useAuth.tsx`
- Login Page: `/src/pages/Login.tsx`
- Lovable Integration (Now Supabase): `/src/integrations/lovable/index.ts`
