# Changelog

## [0.1.0] — 2026-06-03

### Added
- Project scaffold: Next.js 16, Vercel AI SDK, Shadcn UI, Framer Motion
- **Database**: Neon PostgreSQL + Drizzle ORM (5 tables: users, meetings, meetingAnalyses, actionItems, reminderHistory)
- **Authentication**: JWT (jose) + bcryptjs, httpOnly cookie, Next.js middleware
- **Meeting API**: `POST /api/meetings`, `GET /api/meetings` (paginated + search), `GET /api/meetings/:id`
- **AI Analysis**: `POST /api/meetings/:id/analyze` using Vercel AI SDK tool-calling with 5 tools (addSummaryPoint, addActionItem, addDecision, addFollowUp, finishAnalysis) — all grounded with Zod-enforced citations
- **Action Items API**: CRUD, status update, overdue detection
- **Resend Integration**: HTML email reminders for overdue action items
- **Vercel Cron**: Hourly cron job at `/api/cron/reminders` with 24h deduplication
- **Utility Layer**: Unified response format, trace IDs, structured JSON logging
- **Validation**: Zod schemas on all endpoints
- **OpenAPI / Swagger**: Full spec at `/api/docs`, UI at `/api-docs`
- **UI Pages**: Login, Register, Dashboard, Meetings list, New Meeting (2-step form), Meeting detail (transcript + analysis), Action Items board
- **Framer Motion**: Page animations on auth forms, meeting cards, analysis panel items, stats cards
- **Documentation**: README, DECISIONS, AI_APPROACH, TESTING, CHANGELOG, CHECKLIST
