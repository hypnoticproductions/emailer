# WUKR WIRE

**Morphic Intelligence Network** - Automated signal distribution from MANUS to your contact network.

## 🚀 Features

- **GitHub Integration**: Automatically fetches latest Morphic Trade Signals from [Quintapoo Memory](https://github.com/hypnoticproductions/quintapoo-memory)
- **AI Personalization**: Uses Claude AI to generate personalized email content for each contact based on their sector
- **Sector Segmentation**: Send targeted signals to 8 different sectors (Fintech, Clean Energy, Tech/Web3, Tourism, Agriculture, Music/Creative, Government, Other)
- **Email Tracking**: Real-time tracking of opens, clicks, and replies via Resend webhooks
- **Beautiful Dashboard**: Visual analytics showing engagement metrics by sector and status

## 🎯 How It Works

```
MANUS (Quintapoo) generates signal Monday 6 AM
    ↓ (committed to GitHub)
WUKR Wire app pulls latest signal
    ↓
Claude builds personalized email variants from signal
    ↓
Segments and sends to 108 contacts
    ↓
Tracking feeds back to dashboard
```

## 📦 Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Prisma** - Database ORM
- **PostgreSQL** - Database (Vercel Postgres)
- **Resend** - Email sending
- **Anthropic Claude** - AI personalization
- **GitHub API** - Signal fetching
- **Apollo** (optional) - Contact enrichment

## 🛠️ Setup

### 1. Clone and Install

```bash
git clone <your-repo>
cd emailer
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
cp .env.example .env.local
```

Required variables:
- `RESEND_API_KEY` - From [Resend](https://resend.com/api-keys)
- `ANTHROPIC_API_KEY` - From [Anthropic Console](https://console.anthropic.com/settings/keys)
- `GITHUB_TOKEN` - From [GitHub Settings](https://github.com/settings/tokens) (needs `repo` scope)
- `GITHUB_OWNER` - Your GitHub username
- `GITHUB_REPO` - Repository name (e.g., `quintapoo-memory`)
- `DATABASE_URL` - PostgreSQL connection string

### 3. Set Up Database

For local development:

```bash
# Start local Postgres
npx prisma dev

# Or if you have Postgres installed:
# Update DATABASE_URL in .env.local
npx prisma db push
npx prisma generate
```

For production (Vercel):
- Create a Vercel Postgres database
- Copy the connection string to your environment variables

### 4. Seed Contacts (Optional)

Create a seed script to add your 108 contacts:

```bash
npx prisma db seed
```

Or manually add contacts via Prisma Studio:

```bash
npx prisma studio
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

### Deploy to Vercel

1. Push to GitHub:
```bash
git add .
git commit -m "Initial WUKR Wire setup"
git push
```

2. Import to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository
   - Add environment variables from `.env.local`

3. Set up Vercel Postgres:
   - Go to your project → Storage → Create Database
   - Select Postgres
   - Copy connection strings to environment variables

4. Run migration:
```bash
npx prisma db push
```

## 📊 Usage

### 1. Fetch Signal

1. Click "Fetch Latest Signal" button
2. App pulls latest signal from GitHub
3. Signal is parsed and stored in database
4. Form auto-fills with signal data

### 2. Select Segments

Choose which sectors to send to:
- ✅ Fintech
- ✅ Clean Energy
- ✅ Tech/Web3
- ✅ Tourism
- ✅ Agriculture
- ✅ Music/Creative
- ✅ Government
- ✅ Other

### 3. Send

Click "Send to X Segments" and the system will:
1. Generate personalized intro for each contact using Claude
2. Create sector-specific summaries
3. Build HTML emails with signal data
4. Send via Resend (rate-limited to avoid spam)
5. Track in database for analytics

### 4. Monitor Dashboard

Switch to Dashboard tab to see:
- Total contacts by sector
- Email delivery stats
- Open rates and click rates
- Recent newsletters

## 🔧 API Routes

- `GET /api/fetch-signal` - Fetch latest signal from GitHub
- `GET /api/signal-status` - Check signal update status
- `POST /api/send` - Send segmented emails
- `POST /api/resend/webhook` - Handle email events (opens, clicks)
- `GET /api/dashboard` - Get analytics data

## 📝 Database Schema

### Contact
- Email, name, company, title
- Sector (for segmentation)
- LinkedIn, notes

### Newsletter
- Title, content
- Signal data (JSON)
- Sent timestamp

### EmailSent
- Links to Contact and Newsletter
- Email content (HTML + text)
- Resend ID for tracking
- Status (pending, sent, delivered, failed)
- Engagement timestamps (opened, clicked, replied)

## 🎨 Customization

### Email Template

Edit `lib/claude.ts` → `generatePersonalizedEmail()` to customize:
- Email styling
- Header/footer
- Signal formatting

### Sectors

Edit `app/components/SendForm.tsx` → `SECTORS` array to modify segments.

### Signal Parsing

Edit `lib/github.ts` → `parseSignalMarkdown()` to adjust signal parsing logic.

## 🔐 Security Notes

⚠️ **NEVER commit `.env.local` to Git!** It's already in `.gitignore`.

When deploying, add all API keys as Vercel environment variables.

## 📞 Support

For issues or questions:
- Check [Resend Docs](https://resend.com/docs)
- Check [Anthropic Docs](https://docs.anthropic.com)
- Check [Prisma Docs](https://www.prisma.io/docs)

---

**Built for the Morphic Intelligence Network** 🌐
