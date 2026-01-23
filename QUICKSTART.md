# 🚀 Quick Start Guide

Get WUKR Wire up and running in 5 minutes!

## ✅ What's Already Done

- ✅ Database tables created (contacts, newsletters, emails_sent)
- ✅ Next.js app configured
- ✅ Supabase connected
- ✅ All API routes set up
- ✅ Build passing

## 🔑 What You Need to Do

### 1. Get API Keys (5 minutes)

Open your `.env` file and add these keys:

```bash
# Get from Supabase Dashboard → Settings → API
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Get from https://console.anthropic.com/settings/keys
ANTHROPIC_API_KEY=sk-ant-api03-...

# Get from https://github.com/settings/tokens (needs 'repo' scope)
GITHUB_TOKEN=ghp_...

# Get from https://resend.com/api-keys
RESEND_API_KEY=re_...
```

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
