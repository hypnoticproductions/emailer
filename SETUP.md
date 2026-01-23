# WUKR Wire Setup Guide

Complete setup instructions to get your MANUS-powered intelligence distribution system running.

## 📋 Prerequisites

You'll need accounts and API keys for:
- ✅ **Supabase** - Already configured
- 🔑 **Anthropic Claude** - For AI personalization
- 🔑 **GitHub** - For MANUS signal fetching
- 🔑 **Resend** - For email delivery
- 🔑 **Apollo** (Optional) - For contact enrichment

---

## 🚀 Quick Start

### 1. Get Your API Keys

#### Supabase (Database)
Your Supabase project is already set up! Just need the service role key:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `iyjtnqrlozgejaigdilz`
3. Go to **Settings → API**
4. Copy the **service_role** key (NOT the anon key)
5. Add it to your `.env` file

#### Anthropic Claude AI
1. Visit [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Create an account or sign in
3. Click **Create Key**
4. Copy the key (starts with `sk-ant-api03-`)
5. Add it to your `.env` file

#### GitHub Personal Access Token
1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Name it "WUKR Wire MANUS Access"
4. Select scope: `repo` (Full control of private repositories)
5. Click **Generate token**
6. Copy the token (starts with `ghp_`)
7. Add it to your `.env` file

**Important:** Make sure you have access to the `hypnoticproductions/quintapoo-memory` repository!

#### Resend Email Service
1. Visit [Resend](https://resend.com)
2. Sign up for a free account
3. Go to [API Keys](https://resend.com/api-keys)
4. Click **Create API Key**
5. Name it "WUKR Wire"
6. Copy the key (starts with `re_`)
7. Add it to your `.env` file

**Email Setup:**
- Add and verify your domain: `dopa.buzz`
- Or use their test domain: `onboarding@resend.dev`
- Update `lib/resend.ts` line 25 if using different sender

#### Apollo (Optional)
1. Visit [Apollo.io](https://www.apollo.io/)
2. Sign up and get your API key
3. Add it to your `.env` file

---

### 2. Configure Environment Variables

Open your `.env` file and fill in all the keys:

```bash
# Supabase Configuration (already set)
NEXT_PUBLIC_SUPABASE_URL=https://iyjtnqrlozgejaigdilz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # ← Add this!

# Anthropic Claude AI
ANTHROPIC_API_KEY=sk-ant-api03-...  # ← Add this!

# GitHub MANUS Integration
GITHUB_TOKEN=ghp_...  # ← Add this!
GITHUB_OWNER=hypnoticproductions
GITHUB_REPO=quintapoo-memory

# Resend Email
RESEND_API_KEY=re_...  # ← Add this!

# Apollo (Optional)
APOLLO_API_KEY=...  # ← Add this if using Apollo
```

---

### 3. Verify Database Setup

The database tables have been created automatically! Verify they exist:

```bash
# Check system health
curl http://localhost:3000/api/health | json_pp
```

Or visit: http://localhost:3000/api/health

You should see:
```json
{
  "status": "healthy",
  "database": {
    "healthy": true,
    "tables": [...]
  }
}
```

---

### 4. Seed Sample Contacts

Load 8 sample contacts for testing:

```bash
npm run seed
```

This creates contacts across all 8 sectors:
- fintech
- clean_energy
- tech_web3
- tourism
- agriculture
- music_creative
- government
- other

---

### 5. Add Your Real Contacts

#### Option A: Via Supabase Dashboard
1. Go to [Supabase Table Editor](https://supabase.com/dashboard/project/iyjtnqrlozgejaigdilz/editor)
2. Open the `contacts` table
3. Click **Insert → Insert row**
4. Fill in the fields:
   - `id`: Generate with `contact_` prefix (e.g., `contact_123`)
   - `email`: Contact's email (required, unique)
   - `sector`: One of the 8 sectors above (required)
   - `first_name`, `last_name`, `company`, `title`, etc.

#### Option B: Import from CSV
Create a CSV file with your 108 contacts:

```csv
id,email,first_name,last_name,company,title,sector,linkedin,notes
contact_1,john@company.com,John,Doe,Company Inc,CEO,fintech,https://linkedin.com/in/johndoe,Notes here
contact_2,jane@startup.com,Jane,Smith,Startup LLC,CTO,tech_web3,https://linkedin.com/in/janesmith,Notes here
...
```

Then import via:
1. Supabase Dashboard → Table Editor → Import CSV
2. Or use the API: `POST /api/import-contacts`

---

### 6. Test the System

#### Test 1: Check Health
```bash
npm run health
```

Should show all services as "configured: true"

#### Test 2: Fetch MANUS Signal
1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. Click "Load Newsletter" button
4. Select a file from the GitHub repository
5. Click "Fetch"

You should see the content preview load!

#### Test 3: Send Test Email
1. After loading a signal, select one sector
2. Click "Send to X Segments"
3. Monitor the console for progress
4. Check Resend dashboard for delivery status

---

## 🔍 Troubleshooting

### Database Issues

**Error: "Tables not found"**
- Tables should auto-create on first migration
- If not, check Supabase SQL Editor and run migration manually

**Error: "Cannot connect to database"**
```bash
# Check if Supabase URL and keys are correct
curl -H "apikey: YOUR_ANON_KEY" \
     "https://iyjtnqrlozgejaigdilz.supabase.co/rest/v1/contacts?limit=1"
```

### GitHub Issues

**Error: "Failed to fetch content"**
- Verify your GitHub token has `repo` scope
- Check if you have access to `hypnoticproductions/quintapoo-memory`
- Test manually:
```bash
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
     "https://api.github.com/repos/hypnoticproductions/quintapoo-memory/contents/newsletters"
```

### Email Issues

**Error: "Resend API error"**
- Verify API key is correct
- Check if domain is verified in Resend dashboard
- For testing, use: `onboarding@resend.dev` as sender
- Rate limit: 2 emails per second (100/day on free tier)

### Claude AI Issues

**Error: "ANTHROPIC_API_KEY is not set"**
- Double-check `.env` file has the key
- Restart dev server after adding keys
- Verify key starts with `sk-ant-api03-`

---

## 📊 System Architecture

```
MANUS Agent (GitHub)
    ↓
Signal Repo (quintapoo-memory/newsletters)
    ↓
WUKR Wire App (fetches via GitHub API)
    ↓
Claude AI (personalizes for each contact/sector)
    ↓
Resend (sends emails)
    ↓
Supabase (tracks engagement)
    ↓
Dashboard (analytics)
```

---

## 🎯 Next Steps

1. ✅ Configure all API keys
2. ✅ Verify health check passes
3. ✅ Seed sample contacts
4. ✅ Test signal fetching
5. ✅ Send test emails
6. 📝 Import your 108 real contacts
7. 🚀 Start distributing intelligence!

---

## 💡 Tips

- **Rate Limiting**: System automatically limits to 2 emails/second
- **Sector Targeting**: Use checkboxes to target specific sectors
- **Email Tracking**: Opens, clicks, and replies tracked via Resend webhooks
- **Content Types**: Supports both newsletters and proposals
- **Manual Override**: You can edit email content before sending (future feature)

---

## 🔐 Security Notes

- ⚠️ Never commit `.env` to Git (already in `.gitignore`)
- ⚠️ Service role key gives full database access - keep it secret
- ⚠️ GitHub token can access your repositories - rotate periodically
- ⚠️ Use environment variables in production (Vercel, etc.)

---

## 📞 Support

If you encounter issues:
1. Check `/api/health` endpoint
2. Review browser console for errors
3. Check Supabase logs
4. Verify all API keys are valid
5. Ensure GitHub repo access

Built for the **Morphic Intelligence Network** 🌐
