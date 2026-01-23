# Supabase Setup Guide

## Issue: Dashboard Not Loading

If you're seeing "Failed to fetch dashboard data", the most common cause is an invalid or incomplete Supabase service role key.

## How to Get Your Correct Service Role Key

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `iyjtnqrlozgejaigdilz`
3. Click on **Settings** (gear icon) in the left sidebar
4. Click on **API** under Project Settings
5. Scroll down to **Project API keys**
6. Find the **service_role** key (NOT the anon key)
7. Click the eye icon to reveal the full key
8. Copy the entire key - it should be a long JWT token starting with `eyJ...`

## Current Issue

Your `.env` file currently has:
```
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xX03yRME9g4s1Kqb-5ST8A_FlyrUTLv
```

This key appears to be incomplete or in the wrong format. The service role key should be:
- A JWT token starting with `eyJ`
- Approximately 200-300 characters long
- Look something like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...`

## How to Fix

1. Get the correct service role key from your Supabase dashboard (steps above)
2. Replace the value in `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_actual_key_here...
   ```
3. Restart your development server
4. The dashboard should now load correctly

## Security Note

⚠️ **IMPORTANT**: The service_role key has admin privileges and bypasses Row Level Security (RLS).
- NEVER commit this key to version control
- NEVER expose it in client-side code
- Only use it in server-side API routes
- Keep it in `.env` which is in `.gitignore`

## Testing the Connection

After updating the key, you can test the connection by visiting:
- http://localhost:3000/api/health - Should show database health status
- http://localhost:3000/api/debug/db - Shows detailed connection diagnostics

## Still Having Issues?

If the dashboard still doesn't load after updating the key:
1. Check the browser console for errors (F12 → Console tab)
2. Check the terminal/server logs for error messages
3. Verify all environment variables are set correctly in `.env`
4. Try restarting the development server
