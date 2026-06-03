# Testing

## Test Scenarios

### Authentication

| Scenario | Expected |
|----------|----------|
| Register with valid email + password (8+ chars) | 201, JWT cookie set |
| Register with duplicate email | 409 CONFLICT |
| Register with invalid email | 400 VALIDATION_ERROR |
| Register with short password | 400 VALIDATION_ERROR |
| Login with correct credentials | 200, JWT cookie set |
| Login with wrong password | 401 UNAUTHORIZED |
| Access protected route without token | 401 |
| Access protected route with expired token | 401 |

### Meeting Management

| Scenario | Expected |
|----------|----------|
| Create meeting with valid transcript | 201, meeting returned |
| Create meeting with empty transcript | 400 VALIDATION_ERROR |
| Create meeting with invalid participant email | 400 VALIDATION_ERROR |
| Create meeting with missing title | 400 VALIDATION_ERROR |
| Get meeting by ID (owner) | 200, meeting + null analysis |
| Get meeting by ID (non-owner) | 404 NOT_FOUND |
| Get meetings (paginated, page=2) | 200, correct offset applied |
| Get meetings with search query | 200, filtered by title |

### AI Analysis

| Scenario | Expected |
|----------|----------|
| Analyze meeting with clear action items | Summary, actionItems, decisions, followUps all with citations |
| Analyze meeting with no decisions | Decisions array is empty |
| Analyze the same meeting twice | Analysis upserted, action items not duplicated in DB |
| Analyze non-existent meeting | 404 NOT_FOUND |
| All returned items have citations | Every item has citations.length >= 1 |
| Citations reference only valid timestamps | No fabricated timestamps in citations |

### Action Items

| Scenario | Expected |
|----------|----------|
| Create action item (minimal: task + assignee) | 201 |
| Create action item with past dueDate | 201 (no validation error on past dates) |
| Update status PENDING → IN_PROGRESS | 200, status changed |
| Update status with invalid value | 400 VALIDATION_ERROR |
| Update non-existent item | 404 NOT_FOUND |
| Get items filtered by status=COMPLETED | Only COMPLETED items returned |
| Get items filtered by assignee | Only matching assignees returned |
| Get overdue items (all with dueDate < now, status != COMPLETED) | Correct list |

### Cron / Reminders

| Scenario | Expected |
|----------|----------|
| Trigger cron without CRON_SECRET | 401 Unauthorized |
| Trigger cron with valid secret, no overdue items | 200, processed=0 |
| Trigger cron with overdue item (assignee is an email) | Email sent, reminderHistory row created |
| Trigger cron again within 24h for same item | Email NOT sent (skipped), reminderHistory checked |

---

## Edge Cases Considered

- Transcript entries with duplicate timestamps — handled (model may cite either)
- Action items extracted but dueDate is a natural language string (e.g., "next Friday") — stored as string, not parsed to date automatically
- Empty meetings list for new users — graceful empty state in UI
- Analysis fails (API key invalid) — 500 INTERNAL_ERROR returned with trace ID
- Very short transcripts (1-2 entries) — analysis still runs, fewer items extracted

---

## Limitations Discovered

1. **No integration tests** — only unit/type-level. A full integration test suite against a real Neon instance would be ideal.
2. **No rate limiting** — the analyze endpoint could be abused. Rate limiting per user per day would be recommended for production.
3. **Action item deduplication** — if `/analyze` is called multiple times, action items accumulate in the `action_items` table. Production should deduplicate by (meetingId, task, assignee).
4. **Cron email target** — if the assignee is not an email address, the reminder falls back to `RESEND_FROM_EMAIL`. Production would need a user → email mapping.
