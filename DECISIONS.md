# Technical Decisions

## Authentication: JWT (jose) with httpOnly Cookies

**Chosen:** JWT stored in httpOnly cookie, verified in Next.js middleware.

**Why:** Stateless — no session store needed, which is ideal for Vercel serverless. The httpOnly cookie prevents XSS access to the token. The middleware approach means every protected request is validated at the edge with near-zero latency.

**Alternatives considered:**
- NextAuth — heavier, adds complexity for a pure REST-API service
- Session-based (database sessions) — requires a Redis or DB session store, adds infrastructure

**Trade-offs:** JWTs can't be revoked without a denylist. For a demo/eval service, the 7-day expiry is acceptable.

---

## Database: Neon (PostgreSQL) + Drizzle ORM

**Chosen:** Neon serverless Postgres with Drizzle ORM.

**Why:** Neon's serverless driver works seamlessly in Vercel's serverless edge functions (no persistent connection pool needed). Drizzle provides full TypeScript type safety with a thin abstraction that doesn't hide the SQL. Schema-first design means the schema IS the source of truth.

**Alternatives considered:**
- MongoDB — flexible schema but loses the relational benefits (FK constraints on actionItems → meetings)
- Prisma — more popular but heavier generated client; Drizzle is faster and more explicit
- Supabase — good option but adds unnecessary complexity (auth, realtime) for this scope

**Trade-offs:** Neon free tier has cold start latency on first connection. Acceptable for demo.

---

## AI Provider: Claude Sonnet via Vercel AI SDK

**Chosen:** `@ai-sdk/anthropic` with `claude-sonnet-4-5`.

**Why:** Claude Sonnet has strong instruction-following for grounding constraints. The Vercel AI SDK's tool-calling approach (`generateText` + tools) makes it easy to enforce structured output with Zod schemas. Every tool call is validated before the result is recorded, making hallucination rejection schema-enforced rather than prompt-only.

**Alternatives considered:**
- GPT-4o — comparable quality, slightly higher cost
- Gemini — good structured output, but less tested for citation-grounded analysis
- Groq (Llama) — faster/cheaper but weaker instruction following for strict grounding constraints

**Trade-offs:** Claude API has slightly higher latency than Groq. Worth it for citation accuracy.

---

## AI Analysis Pattern: Tool-Calling vs generateObject

**Chosen:** `generateText` with 5 Vercel AI SDK tools and `maxSteps: 30`.

**Why:** Tool-calling is more agentic and better demonstrates the Vercel AI SDK's core value. Each tool has a Zod schema with `citations.min(1)` — the SDK validates this at the tool-call layer, making citation-less outputs structurally impossible. The AI must explicitly call tools for each insight, which forces per-item grounding.

**Alternatives considered:**
- `generateObject` with a single schema — simpler, but all-or-nothing; if one citation is missing the whole response fails
- Streaming (`streamText` with tools) — would enable real-time UI updates but adds frontend complexity

**Trade-offs:** Multi-step tool calling uses more tokens per analysis. Acceptable for meeting intelligence where quality > speed.

---

## External Integration: Resend (Email)

**Chosen:** Resend for email reminders.

**Why:** Most natural "overdue reminder" UX is email. Resend has a clean SDK, generous free tier (100 emails/day), and excellent deliverability. The integration is genuinely used in the cron workflow — not just configured.

**Alternatives considered:**
- Discord Webhook — easier setup but less relevant to professional meeting intelligence
- Telegram Bot — requires users to have Telegram; less universal
- Slack Webhook — great for teams, but requires Slack workspace access

**Trade-offs:** Requires a verified sender domain in production. The demo uses a fallback from address.

---

## Scheduler: Vercel Cron Jobs

**Chosen:** `vercel.json` cron schedule hitting `/api/cron/reminders`.

**Why:** Zero infrastructure — no separate worker process, no Redis queue, no node-cron running in a long-lived process. Vercel Cron is the right primitive for serverless scheduling.

**Alternatives considered:**
- node-cron — requires a persistent process, doesn't work in serverless
- GitHub Actions scheduled workflow — possible but awkward, adds CI dependency

**Trade-offs:** Vercel Cron is only available on paid plans in production. For local testing, the cron endpoint can be triggered manually with the `CRON_SECRET`.

---

## Project Structure

Mirrors the `gemini-chatbot` reference project:
- `db/` at root (not `lib/db/`) — database is a first-class concern
- `ai/` at root — model configuration separate from business logic  
- `lib/tools/` — all Vercel AI SDK tool definitions co-located
- `components/custom/` for app-specific components, `components/ui/` for Shadcn
- Route groups `(auth)` and `(dashboard)` for layout separation
