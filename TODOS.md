# TODOS

Deferred product work from `/plan-ceo-review` (2026-11-06, SELECTIVE EXPANSION). Accepted and now built: carry-over tasks (overdue block), the focus timer (see the CEO plan in `~/.gstack/projects/DevTrack/ceo-plans/`) and the Settings screen.

Deferred inside the timer: cross-device timers (needs server-side timer state).

Deferred inside Settings: sessions on an old JWT stay valid after a password change (tokens are stateless, 7 days); fixing it needs a token version on the user. Email change and forgot-password need email sending.

Effort is human-team / Claude Code.

## Deferred candidates

### Session notes (~2 days / 45 min)
- **What:** an optional "what I learned" field on each session, shown in the Calendar day detail.
- **Why:** turns a time log into a learning log; the base for review and insights.
- **Pros:** retention value, small model change (`StudySession.note`). **Cons:** a free-text field needs length limits and escaping.
- **Depends on:** nothing; makes the weekly insight card and spaced review possible.

### Day starts at (~1.5 days / 30 min)
- **What:** a per-user "my day starts at HH:00" setting (0-6am) so a 1am session counts toward the day it started.
- **Why:** developers study after midnight; today a session at 00:30 lands on the next day and can break a streak.
- **Pros:** correctness for night owls. **Cons:** touches streak, heatmap and day bucketing, so needs the heaviest tests.
- **Context:** `toLocalDate` in `apps/api/src/common/dates.ts` buckets by timezone midnight.
- **Depends on:** Settings screen (built; the setting goes there next to Timezone).

### Weekly insight card (~2 days / 40 min)
- **What:** plain-language summary ("Frontend: 0m this week. Your best day is Tuesday.") on Today and Analytics, computed from sessions, no AI.
- **Why:** the numbers are there but nothing says what to do next.
- **Pros:** high perceived value, low risk. **Cons:** copy rules to maintain.
- **Depends on:** better with session notes.

### Goals with deadlines (~1.5 weeks / 3 h)
- **What:** a goal with a target date, linked habits, and progress against the deadline.
- **Why:** the planning half the product lacks (PDF phase 3).
- **Pros:** biggest value step toward a study coach. **Cons:** largest build; new model and screens.
- **Depends on:** focus timer and notes recommended first.

### Starter templates (~1 day / 20 min)
- **What:** pick a ready-made habit set (e.g. "Backend interview prep") in the first-run panel.
- **Why:** faster onboarding.
- **Pros:** small, low risk. **Cons:** curating templates takes judgement.
- **Depends on:** the first-run panel (already built).

## Not offered as cherry-picks (still worth tracking)

- **Reminders:** daily nudge when a streak is at risk (push or email). Needs notification infrastructure.
- **Choose weekdays + pause days:** replace "days a week" with a schedule and holiday pause.
- **Installable PWA + quick-log:** home-screen install and one-tap +15m chips on habit rows.
- **Shareable streak card / accountability partner.**
- **Spaced review of notes and AI-built plans (PDF AI phase):** XL; needs notes first.
- **Forgot-password flow** (needs email sending).
- **30-minute delights:** "last studied 3 days ago" per habit, remember last-used minutes, Undo after logging, "copy my week", keyboard shortcut to log.
