# 🚀 Quick Start Guide

Get WUKR Wire up and running in 5 minutes!

## ⚠️ CURRENT ISSUE: Dashboard Not Loading

Your dashboard shows "Failed to fetch dashboard data" because the **SUPABASE_SERVICE_ROLE_KEY is invalid**.

### Fix It Now (2 Minutes):

1. Go to https://supabase.com/dashboard
2. Select project **iyjtnqrlozgejaigdilz**
3. Click **Settings** → **API**
4. Find the **service_role** key (NOT anon key)
5. Copy the full key (starts with `eyJ`, 200+ characters)
6. Update your `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your_full_key...
   ```
7. Restart dev server: `npm run dev`

**Your current key** (`sb_secret_xX03yRME9g4s1Kqb-5ST8A_FlyrUTLv`) **is incomplete/invalid!**

See `SUPABASE_SETUP.md` for detailed instructions.

---

## ✅ What's Already Done

- ✅ Database tables created (contacts, newsletters, emails_sent)
- ✅ Next.js app rebuilt with clean Supabase integration
- ✅ All API routes updated with error handling
- ✅ Build passing
- ✅ Diagnostic endpoints added

## 🔑 Environment Variables

Your `.env` file needs these keys:

```bash
# Supabase (Get from Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://iyjtnqrlozgejaigdilz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (already set)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (⚠️ NEEDS TO BE FIXED!)

# Claude AI (https://console.anthropic.com/settings/keys)
ANTHROPIC_API_KEY=sk-ant-api03-... (already set)

# GitHub (https://github.com/settings/tokens)
GITHUB_TOKEN=ghp_... (already set)
GITHUB_OWNER=hypnoticproductions (already set)
GITHUB_REPO=quintapoo-memory (already set)

# Resend Email (https://resend.com/api-keys)
RESEND_API_KEY=re_... (already set)
```

**Valid service_role key must:**
- Start with `eyJ`
- Be 200-300 characters long
- Be a JWT token, NOT `sb_secret_...`

### 2. Test Everything

```bash
# Start the dev server
npm run dev

# In another terminal, check health
curl http://localhost:3000/api/health | json_pp
```

You should see all services marked as "configured: true"

### 3. Seed Test Contacts

```bash
npm run seed
```

This adds 8 sample contacts across all sectors.

### 4. Test the App

1. Open http://localhost:3000
2. Click "Load Newsletter"
3. Select a file from MANUS
4. Click "Fetch"
5. Select a sector
6. Click "Send to X Segments"

Done! 🎉

## 🔍 Verify Setup

### Check Database
```bash
# Should show 3 tables
curl http://localhost:3000/api/health
```

### Test GitHub Connection
```bash
# Should list newsletters
curl http://localhost:3000/api/content/list?type=newsletter
```

### List Contacts
```bash
# Should show your contacts
curl http://localhost:3000/api/contacts/list
```

## 📝 Next Steps

1. **Add Real Contacts**: Import your 108 contacts via Supabase Dashboard
2. **Verify Domain**: Set up dopa.buzz in Resend
3. **Test Emails**: Send to yourself first
4. **Monitor Dashboard**: Track opens and clicks

## ⚠️ Common Issues

**"Missing API keys"**
→ Add all keys to `.env` and restart dev server

**"Tables not found"**
→ Already created! Check `/api/health`

**"GitHub 404"**
→ Verify you have access to hypnoticproductions/quintapoo-memory

**"Resend error"**
→ Use `onboarding@resend.dev` as sender for testing

## 📚 Full Documentation

- **SETUP.md** - Complete setup instructions
- **README.md** - Project overview
- **.env.example** - Environment template

---

Ready to distribute intelligence! 🌐
