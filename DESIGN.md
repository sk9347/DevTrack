# DevTrack design system

Written from the built UI (commit 6203cf3) and the /plan-design-review decisions D1-D11. The tokens live in `apps/web/src/app/globals.css`; this file records why, and the rules new screens follow.

## Mode and use scene

- **Mode: OPERATE.** DevTrack is a tool people use to finish a small task (log time, check today). Scanability beats expression; the brand lives in the details.
- **Use scene:** a developer studying in the evening, in a dim room, glancing at numbers between sessions. That is why the app is dark, low-glare and calm. It is not dark "because it is a developer tool".
- **Slop check:** near-black plus one green accent is the look people would guess for a dev tool. Keep it on purpose: one accent, no glow, no gradients, no shadows. If a future screen wants a second accent, it needs a reason in this file first.

## Color tokens (CSS variables)

| Token | Value | Use | Contrast on canvas |
|-------|-------|-----|--------------------|
| `--canvas` | `#0e1114` | page background | n/a |
| `--surface` | `#14181c` | side nav, bottom nav | n/a |
| `--raised` | `#1b2025` | hover, active nav, secondary buttons, skeleton | n/a |
| `--line` | `#262c33` | hairlines, list dividers | decorative |
| `--line-strong` | `#343c45` | control borders, empty progress tracks | 1.7:1 (border only; never the sole carrier of meaning) |
| `--fg` | `#e8ebee` | primary text | 15.8:1 |
| `--muted` | `#9ba6b1` | secondary text, labels | 7.7:1 (7.2:1 on surface) |
| `--accent` | `#4cc38a` | primary action, "Met", active mobile tab, today's bar | 8.6:1 |
| `--accent-ink` | `#07130d` | text on accent | 8.6:1 on accent |
| `--danger` | `#ef8a80` | errors, destructive actions | 7.8:1 |
| `--heat-0..4` | `#171c21 #1d3a2e #266549 #35935f #4cc38a` | contribution ramp (0 min, 1-29, 30-59, 60-119, 120+) | 1.1, 1.5, 2.7, 5.0, 8.6 |

Rules: colors come from variables, never hard-coded in components (the six habit colours below are the one data-driven exception). Secondary text on a colored surface is tinted, not gray. The heat ramp is never the only carrier of meaning: every cell has a text label and the day detail repeats the numbers. Low-intensity cells (heat-1, heat-2) are below 3:1 against the canvas; this is accepted because of that rule.

### Habit palette (user choice, six values)

`#4cc38a #6fa8e8 #d9a24f #c88adf #e57f9a #5fc4c4`. Shown as a 12px dot beside the habit name and as the progress bar fill. Never used for text.

## Typography

- **IBM Plex Sans** (UI) and **IBM Plex Mono** (data), loaded with `next/font`. Allowed as the UI voice on an OPERATE surface. No third face.
- **Mono rule:** `.num` (Plex Mono, tabular) is for durations and times inside rows and tables ("45m / 30m", "14:16-15:01"). Headline stats and inline numbers use Plex Sans with `tabular-nums` so spaces and units stay natural ("3 days").
- Scale (px / Tailwind): page title 24 `text-2xl` semibold; section title 18 `text-lg` semibold (day detail, first-run); body 16; secondary and table text 14 `text-sm`; section heading 14 `text-sm` semibold uppercase `tracking-wide` muted; chart and heatmap labels 12 `text-xs`; stat value 24 medium tabular. Headings use `text-wrap: balance`. Body text is never below 14px; interactive text is 14px or larger.

## Layout, spacing, radius

- Shell: 224px side nav (`md:` and up) with a 56px top bar; under 768px the side nav becomes a fixed bottom tab bar (5 items, 56px high). Content is `max-w-5xl`, `px-5 md:px-8 py-8`.
- Vertical rhythm between sections: 40px (`mt-10`), 48px for the last, quieter sections. Inside a section: 12px under its heading.
- Structure is lists with hairline dividers (`divide-y divide-line border-y border-line`), not cards. A card must be the interaction itself.
- Radius: 6px (`rounded-md`) controls and blocks, 3px heat cells, full for dots and progress bars. No other radii.
- Touch targets: 44px minimum height (`min-h-11`) for every control; chips and icons-only controls are 44x44.
- No shadows. Depth is a 1px border or a step up in surface.

## Motion

- One rule: motion confirms a change, it never decorates. Color transitions 150ms; progress width 300ms ease-out. No entrance animations. `prefers-reduced-motion` collapses all durations.
- The only waiting animation is the skeleton pulse, and only while a request is actually pending (see states).

## Browser surfaces

Selection is the accent at 35%, caret is the accent, scrollbars use `--line-strong`, focus is a 2px accent outline with 2px offset on `:focus-visible`, the dialog backdrop is `rgb(5 7 9 / .7)`, `color-scheme: dark`.

## Screens

| Screen | Job | First read |
|--------|-----|------------|
| Today | Check and log today | Habits today (D1) with Start and Log time, then tasks with an Overdue block (hidden when empty), then the week summary, chart and 26-week heatmap |
| Habits | Define what you study | Active habits with Edit and Archive; add form |
| Tasks | Plan a day | Date switcher, task list, add |
| Calendar | Look back | 53-week heatmap, selected day's sessions and tasks |
| Analytics | Weekly check | Period switch, stat row, chart, per-habit table with "On pace" |
| Settings | Own the account | Timezone, password, CSV downloads, delete account. Reached from the header (not the nav), so the nav stays at 5 items |

## Components

`Button` (primary, secondary, ghost, danger), `Field` + `TextInput` + `SelectInput` (visible labels always, hint below the label), `SectionHeading`, `EmptyState`, `Skeleton`, `ErrorText`, `LoadError`, `Region`, `StatRow`, `HabitProgress`, `DayBars`, `Heatmap`, `DayDetail`, `FirstRun`, `OverduePanel`, `TimerBar` + `TimerProvider`, `TimezoneForm`, `PasswordForm`, `DataExport`, `DeleteAccount`, `LogSessionDialog` (native `<dialog>`). Reuse before adding; a new component needs a line here.

## Interaction rules

**Destructive actions use an inline two-step**, never a modal: the row swaps its action for "Confirm {verb} / Keep" (archive a habit, delete a session, discard a running timer).

**State contract** (every data region):

| State | What the user sees |
|-------|--------------------|
| Loading | `Skeleton` in the region's footprint |
| Empty | `EmptyState` with a primary action or context; Today with zero habits shows only the first-run panel (D4) |
| Error | `LoadError`: "Couldn't load {what}", the reason, and Retry (D3). Never a skeleton on an error |
| Success | live update in place; after saving a session an inline `role=status` line confirms it (D6) |
| Stale session | cookie cleared, `/login` with "Your session ended. Sign in again." (D2) |

**Overdue tasks:** unfinished tasks from earlier days appear in an Overdue block under the day's tasks. Nothing is moved automatically; each row offers "Move to today", or can be completed in place (completion keeps the planned due date, so analytics counts it on the day it was planned). More than 10: first 10, then "Show N more".

**Focus timer:** one timer at a time, per user, kept in the browser (localStorage) and shown in a bar pinned under the header on every page. Elapsed time is always `now - startedAt`, never counted ticks, so sleep, refresh and background tabs cannot drift it. Stop opens the Log dialog prefilled (minutes rounded up, capped at 12h with a note); the timer is cleared only after the session is saved, so a failed save loses nothing. Discard asks for confirmation. The clock is `role=timer` with `aria-live=off`; a screen-reader-only status announces which habit is being timed.

**Settings:** each section is one form with a visible label, its own error (`role=alert`) and a status line after the button. Changing the timezone warns that history is regrouped into the new timezone's days (a streak can shift) because days are bucketed at read time. A wrong current password or wrong delete-confirm password is answered with 400, never 401, because the web client treats every 401 as an ended session and signs the user out. Deleting the account uses the inline two-step (password, then "Confirm delete / Keep"), clears the local timer and does a full navigation to /login. CSV downloads are plain links the server serves as attachments; cells that start with = + - @ are prefixed with an apostrophe so a spreadsheet never runs them.

**Phones:** grid children that hold lists need `min-w-0`, or the page grows wider than the screen. Habit names wrap on phones instead of truncating.

**Copy:** utility language. Say what happened and what to do. No exclamation marks, no scolding. A missed day shows "Best N days" beside "0 days" (D5); history is never erased.

## Accessibility

- Landmarks: one `main`, one primary `nav` per viewport, `aria-current="page"` on the active link.
- Charts expose a text summary: the bar chart a sentence per week, the read-only heatmap one `role=img` sentence with active days, longest streak and last-7-day total (D9). Heatmap cells inside it are decorative.
- The Calendar heatmap is one tab stop (roving tabindex). Arrow keys move spatially (left/right between weeks, up/down between weekdays), Home/End jump to the start and end of the week, Enter or Space selects (D8).
- Forms: visible labels, errors in `role=alert`, specific messages in plain words.
- Contrast: all text at 7:1 or better; see the token table for non-text exceptions.

## Decisions log (from /plan-design-review)

D1 Today leads with Habits today. D2 stale session signs out cleanly. D3 failed loads show an error block with Retry. D4 first-run panel at zero habits. D5 "Best N days" beside the streak. D6 inline confirmation after saving a session. D7 this file. D8 roving-tabindex heatmap grid. D9 one-sentence read-only heatmap. D10 delete a session with confirm. D11 inline habit edit.

Not decided here: a light theme (the use scene is evening), task title editing, a skip-to-content link.
