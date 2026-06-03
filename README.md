# Hintro — Meeting Intelligence Service

AI-powered meeting intelligence built with Next.js 16, Vercel AI SDK (Claude Sonnet), Shadcn UI, Framer Motion, Neon PostgreSQL, and Resend.

---

## Features

- **Meeting Management** — Create, list, and view meetings with full transcript support
- **AI Analysis** — Claude Sonnet analyzes transcripts via Vercel AI SDK tool-calling, producing grounded summaries, action items, decisions, and follow-ups — each with transcript citations
- **Action Item Tracking** — CRUD + status management (PENDING → IN_PROGRESS → COMPLETED)
- **Overdue Detection** — Automatic detection of items past their due date
- **Email Reminders** — Hourly Vercel Cron job sends overdue reminders via Resend
- **JWT Authentication** — httpOnly cookie-based auth
- **Swagger / OpenAPI** — Full API docs at `/api-docs`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| AI | Vercel AI SDK + @ai-sdk/anthropic (Claude Sonnet) |
| UI | Shadcn UI + Framer Motion |
| Database | Neon (PostgreSQL) + Drizzle ORM |
| Auth | JWT (jose) + bcryptjs |
| Email | Resend |
| Scheduling | Vercel Cron Jobs |
| Validation | Zod |

---

## Setup

### Prerequisites

- Node.js 18+
- [Neon](https://neon.tech) account (free tier)
- [Anthropic API key](https://console.anthropic.com)
- [Resend](https://resend.com) account (free tier)

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
ANTHROPIC_API_KEY=sk-ant-...
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=reminders@yourdomain.com
CRON_SECRET=your-cron-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Local Development

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

API docs at [http://localhost:3000/api-docs](http://localhost:3000/api-docs).

---

## Database Migrations

```bash
# Generate new migration after schema changes
npm run db:generate

# Run pending migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio
```

---

## API Usage Examples

### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123","name":"Alice"}'
```

### Create Meeting

```bash
curl -X POST http://localhost:3000/api/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Sprint Planning",
    "participants": ["alice@example.com", "bob@example.com"],
    "meetingDate": "2026-05-20T10:00:00Z",
    "transcript": [
      {"timestamp": "00:10", "speaker": "John", "text": "We should launch next Friday."},
      {"timestamp": "00:20", "speaker": "Alice", "text": "I will prepare release notes."}
    ]
  }'
```

### Analyze Meeting

```bash
curl -X POST http://localhost:3000/api/meetings/<id>/analyze \
  -H "Authorization: Bearer <token>"
```

### Get Overdue Action Items

```bash
curl http://localhost:3000/api/action-items/overdue \
  -H "Authorization: Bearer <token>"
```

### Trigger Reminder Cron Manually

```bash
curl http://localhost:3000/api/cron/reminders \
  -H "Authorization: Bearer <your-cron-secret>"
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import to Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy — Vercel Cron picks up the `vercel.json` schedule automatically

```bash
# Or deploy via CLI
npx vercel --prod
```

---

## Project Structure

```
app/            Next.js App Router pages + API routes
ai/             Claude model configuration
db/             Drizzle schema, queries, migrations
components/     UI (custom/ + ui/ Shadcn)
lib/            Tools, AI, auth, integrations, utilities
```
