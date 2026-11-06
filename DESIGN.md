# DevTrack design system

Written from the built UI (HeroUI v3 migration) and the /plan-design-review decisions D1-D11. The tokens live in `apps/web/src/app/globals.css`; this file records why, and the rules new screens follow.

## Stack

- **HeroUI v3** (`@heroui/react` 3.2.7 + `@heroui/styles` 3.2.7) is the component layer: Button, Input, Card, Modal, Drawer, Skeleton. `@heroui/styles` is imported directly after Tailwind; there is no provider.
- **Tailwind CSS 4** composes layout and spacing. **Recharts** stays for charts because HeroUI has no chart primitive.
- Dark mode is fixed: `<html class="dark" data-theme="dark">`. The product has no light theme.
- Use one documented HeroUI major version. Do not mix v2 component APIs into v3 screens.

## Mode and use scene

- **Mode: OPERATE.** DevTrack is a tool people use to finish a small task (log time, check today). Scanability beats expression; the brand lives in the details.
- **Use scene:** a developer studying in the evening, in a dim room, glancing at numbers between sessions. That is why the app is dark, low-glare and calm.
- **Slop check:** charcoal plus one violet accent. Green means success, amber means warning, red means error or destruction. No second decorative accent, no glow, no gradient backgrounds beyond one very low-opacity ambient wash, no decorative animation.

## Color tokens (CSS variables)

| Token | Value | Use | Contrast on background |
|-------|-------|-----|------------------------|
| `--background` (`--canvas`) | `#0f1115` | page background | n/a |
| `--surface` | `#171920` | sidebar, cards, panels | n/a |
| `--surface-secondary` (`--raised`) | `#1d2029` | hover, active nav, secondary buttons, skeleton | n/a |
| `--border` (`--line`) | `#292d38` | hairlines, card borders, dividers | decorative |
| `--border-strong` (`--line-strong`) | `#3a3f4e` | control borders, empty progress tracks | 1.8:1 (border only; never the sole carrier of meaning) |
| `--foreground` (`--fg`) | `#f4f4f8` | primary text | 17.2:1 |
| `--muted` | `#a3a8b5` | secondary text, labels | 7.9:1 (7.4:1 on surface) |
| `--accent` | `#a996ff` | primary action, active nav, today's bar, focus ring | 7.6:1 |
| `--accent-foreground` (`--accent-ink`) | `#171126` | text on accent | 7.4:1 on accent |
| `--success` | `#5fd39a` | success states, "Met" | 10.1:1 |
| `--warning` | `#e7b45f` | warnings, capped timer notice | 10.0:1 |
| `--danger` | `#f08a8a` | errors, destructive actions | 7.8:1 |
| `--heat-0..4` | `#191b22 #2a2350 #453a86 #6d5cc9 #a996ff` | contribution ramp (0 min, 1-29, 30-59, 60-119, 120+) | 1.3, 2.0, 3.6, 7.6 |

Rules: colors come from variables, never hard-coded in components (the six habit colours below are the one data-driven exception). Secondary text on a colored surface is tinted, not gray. The heat ramp is never the only carrier of meaning: every cell has a text label and the day detail repeats the numbers. Low-intensity cells (heat-0, heat-1) are below 3:1 against the page; this is accepted because of that rule.

The legacy names (`canvas`, `raised`, `line`, `line-strong`, `fg`, `accent-ink`) are aliases of the HeroUI semantic tokens so migrated utilities keep working while new code uses the semantic names.

### Habit palette (user choice, six values)

`#4cc38a #6fa8e8 #d9a24f #c88adf #e57f9a #5fc4c4`. Shown as a 12px dot beside the habit name and as the progress bar fill. Never used for text. The palette is persisted user data; do not re-map it to the theme.

## Typography

- **IBM Plex Sans** (UI) and **IBM Plex Mono** (data), loaded with `next/font`. Allowed as the UI voice on an OPERATE surface. No third face.
- **Mono rule:** `.num` (Plex Mono, tabular) is for durations and times inside rows and tables ("45m / 30m", "14:16-15:01"). Headline stats and inline numbers use Plex Sans with `tabular-nums` so spaces and units stay natural ("3 days").
- Scale (px / Tailwind): page title 24 `text-2xl` semibold; section title 18 `text-lg` semibold; body 16; secondary and table text 14 `text-sm`; section heading 12-14 `text-xs`/`text-sm` semibold uppercase `tracking-[0.14em]` muted; chart and heatmap labels 12 `text-xs`; stat value 24 medium tabular. Headings use `text-wrap: balance`. Body text is never below 14px; interactive text is 14px or larger.

## Layout, spacing, radius

- Shell: 256px sidebar (`md:` and up) with a 64px sticky top bar. Under 768px the sidebar becomes a HeroUI `Drawer` opened from a 44px menu button in the header. Content is `max-w-6xl`, `px-4 sm:px-6 lg:px-8`, `py-6 lg:py-8`.
- Vertical rhythm between sections: 24px (`space-y-6`) for dense dashboards, 40px (`mt-10`) when a quieter break is needed. Inside a card: 20-24px padding.
- Structure: a page is a small stack of cards, each card one coherent region. Lists inside a card use hairline dividers, not a card per row.
- Radius: 8px controls and inputs, 12px cards, dialogs and the drawer, 3px heat cells, full for dots and progress bars. No other radii.
- Touch targets: 44px minimum height (`min-h-11`) for every control; chips and icon-only controls are 44x44.
- Shadows: none on cards. Only the modal and drawer overlay carry a soft elevation shadow.

## Motion

- One rule: motion confirms a change, it never decorates. Color transitions 150ms; progress width 300ms ease-out. No entrance animations. `prefers-reduced-motion` collapses all durations.
- The only waiting animation is the skeleton pulse, and only while a request is actually pending (see states).

## Browser surfaces

Selection is the accent at 35%, caret is the accent, scrollbars use `--border-strong`, focus is a 2px accent outline with 2px offset on `:focus-visible` (HeroUI controls draw their own ring instead), the modal backdrop is `rgb(5 6 10 / .72)`, `color-scheme: dark`.

## Screens

| Screen | Job | First read |
|--------|-----|------------|
| Login / register | Enter the product | Brand, one card, email and password, sign-in/register switch |
| Today | Check and log today | Habits today (D1) with Start and Log time, then tasks with an Overdue block (hidden when empty), then the week summary, chart and 26-week heatmap |
| Habits | Define what you study | Active habits with Edit and Archive; add form |
| Tasks | Plan a day | Date switcher, task list, add |
| Calendar | Look back | 53-week heatmap, selected day's sessions and tasks |
| Analytics | Weekly check | Period switch, stat row, chart, per-habit table with "On pace" |
| Settings | Own the account | Timezone, password, CSV downloads, delete account. Reached from the sidebar footer and header (not the primary nav), so the nav stays at 5 items |

## Components

HeroUI-backed shared components in `src/components/ui/controls.tsx`: `Button` (primary, secondary, ghost, danger), `TextInput`, `Field`, `SelectInput` (native `<select>` for form semantics and testability), `Panel` (Card), `Skeleton`, `PageHeader`, `SectionHeading`, `EmptyState`, `ErrorText`, `LoadError`, `Region`.

Specialized components: `StatRow`, `HabitProgress`, `DayBars`, `Heatmap`, `DayDetail`, `FirstRun`, `OverduePanel`, `TimerBar` + `TimerProvider`, `TimezoneForm`, `PasswordForm`, `DataExport`, `DeleteAccount`, `LogSessionDialog` (HeroUI `Modal`). Reuse before adding; a new component needs a line here.

## Interaction rules

**Destructive actions use an inline two-step**, never a modal: the row swaps its action for "Confirm {verb} / Keep" (archive a habit, delete a session, discard a running timer). The only modal is logging a session.

**State contract** (every data region):

| State | What the user sees |
|-------|--------------------|
| Loading | `Skeleton` in the region's footprint |
| Empty | `EmptyState` with a primary action or context; Today with zero habits shows only the first-run panel (D4) |
| Error | `LoadError`: "Couldn't load {what}", the reason, and Retry (D3). Never a skeleton on an error |
| Success | live update in place; after saving a session an inline `role=status` line confirms it (D6) |
| Stale session | cookie cleared, `/login` with "Your session ended. Sign in again." (D2) |

**Overdue tasks:** unfinished tasks from earlier days appear in an Overdue block under the day's tasks. Nothing is moved automatically; each row offers "Move to today", or can be completed in place (completion keeps the planned due date, so analytics counts it on the day it was planned). More than 10: first 10, then "Show N more".

**Focus timer:** one timer at a time, per user, kept in the browser (localStorage) and shown in a bar pinned under the header on every page. Elapsed time is always `now - startedAt`, never counted ticks, so sleep, refresh and background tabs cannot drift it. Stop opens the HeroUI log dialog prefilled (minutes rounded up, capped at 12h with a note); the timer is cleared only after the session is saved, so a failed save loses nothing. Discard asks for confirmation. The clock is `role=timer` with `aria-live=off`; it is marked as a top-layer status so assistive technology can still read it while the log dialog is open, without exposing the timer's buttons behind the dialog. A screen-reader-only status announces which habit is being timed.

**Settings:** each section is one form with a visible label, its own error (`role=alert`) and a status line after the button. Changing the timezone warns that history is regrouped into the new timezone's days (a streak can shift) because days are bucketed at read time. A wrong current password or wrong delete-confirm password is answered with 400, never 401, because the web client treats every 401 as an ended session and signs the user out. Deleting the account uses the inline two-step (password, then "Confirm delete / Keep"), clears the local timer and does a full navigation to /login. CSV downloads are plain links the server serves as attachments; cells that start with = + - @ are prefixed with an apostrophe so a spreadsheet never runs them.

**Phones:** grid children that hold lists need `min-w-0`, or the page grows wider than the screen. Habit names wrap on phones instead of truncating. The mobile drawer closes on navigation.

**Copy:** utility language. Say what happened and what to do. No exclamation marks, no scolding. A missed day shows "Best N days" beside "0 days" (D5); history is never erased.

## Accessibility

- Landmarks: one `main`, one primary `nav` per viewport, `aria-current="page"` on the active link.
- Charts expose a text summary: the bar chart a sentence per week, the read-only heatmap one `role=img` sentence with active days, longest streak and last-7-day total (D9). Heatmap cells inside it are decorative.
- The Calendar heatmap is one tab stop (roving tabindex). Arrow keys move spatially (left/right between weeks, up/down between weekdays), Home/End jump to the start and end of the week, Enter or Space selects (D8).
- Forms: visible labels, errors in `role=alert`, specific messages in plain words.
- Dialogs: HeroUI `Modal` / `Drawer` provide focus trapping, Escape dismissal and restored focus. Background content is inert while open by design.
- Contrast: all text at 7:1 or better; see the token table for non-text exceptions.

## Decisions log (from /plan-design-review)

D1 Today leads with Habits today. D2 stale session signs out cleanly. D3 failed loads show an error block with Retry. D4 first-run panel at zero habits. D5 "Best N days" beside the streak. D6 inline confirmation after saving a session. D7 this file. D8 roving-tabindex heatmap grid. D9 one-sentence read-only heatmap. D10 delete a session with confirm. D11 inline habit edit.

Not decided here: a light theme (the use scene is evening), task title editing, a skip-to-content link.
