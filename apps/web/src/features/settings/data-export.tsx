const FILES = [
  { file: 'sessions.csv', label: 'Study sessions', detail: 'Every logged session: date, habit, minutes, start and end, task.' },
  { file: 'habits.csv', label: 'Habits', detail: 'Name, targets, colour, whether it is active.' },
  { file: 'tasks.csv', label: 'Tasks', detail: 'Due date, title, status, minutes logged against each.' },
] as const;

/** Plain links: the server answers with Content-Disposition: attachment, so the browser saves the file. */
export function DataExport() {
  return (
    <div className="max-w-xl">
      <p className="mb-3 text-sm text-muted">Spreadsheet-ready CSV files of everything you have recorded.</p>
      <ul className="divide-y divide-line border-y border-line">
        {FILES.map((f) => (
          <li key={f.file} className="flex min-h-14 items-center justify-between gap-4 py-2">
            <div className="min-w-0">
              <p className="text-sm font-medium">{f.label}</p>
              <p className="text-xs text-muted">{f.detail}</p>
            </div>
            <a
              href={`/api/v1/export/${f.file}`}
              download={`devtrack-${f.file}`}
              aria-label={`Download ${f.label.toLowerCase()} as CSV`}
              className="inline-flex min-h-11 shrink-0 items-center rounded-md border border-line-strong bg-raised px-4 text-sm font-medium transition-colors duration-150 hover:border-muted"
            >
              Download
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
