// Seeds a demo account with ~12 weeks of realistic, imperfect study history through the public API.
// Usage: node scripts/seed-demo.mjs [http://localhost:4000]
const BASE = `${process.argv[2] ?? 'http://localhost:4000'}/api/v1`;
const EMAIL = 'demo@devtrack.dev';
const PASSWORD = 'correct-horse';
const TZ = 'Asia/Kolkata';

let cookie = '';
async function call(path, method = 'GET', body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(cookie && { cookie }) },
    body: body && JSON.stringify(body),
  });
  const set = res.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0];
  if (res.status === 204) return null;
  const json = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json)}`);
  return json;
}

// Deterministic pseudo-random so the demo looks the same every run.
let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

let r = await fetch(`${BASE}/auth/register`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD, timezone: TZ }),
});
if (r.status === 409) {
  r = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
}
if (!r.ok) throw new Error(`auth failed: ${r.status}`);
cookie = r.headers.get('set-cookie').split(';')[0];

const existing = await call('/habits');
if (existing.length > 0) {
  console.log('Demo data already present; nothing to do.');
  process.exit(0);
}

const habits = [];
for (const h of [
  { name: 'DSA', dailyTargetMinutes: 45, targetFrequency: 5, color: '#4cc38a' },
  { name: 'System Design', dailyTargetMinutes: 30, targetFrequency: 4, color: '#6fa8e8' },
  { name: 'AI Engineering', dailyTargetMinutes: 30, targetFrequency: 3, color: '#d9a24f' },
]) habits.push(await call('/habits', 'POST', h));

const ymd = (d) => d.toISOString().slice(0, 10);
const now = new Date();
let sessions = 0;
for (let ago = 84; ago >= 0; ago--) {
  const day = new Date(now.getTime() - ago * 86_400_000);
  const weekend = [0, 6].includes(day.getUTCDay());
  if (rnd() < (weekend ? 0.45 : 0.18)) continue; // missed day
  for (const h of habits) {
    if (rnd() < 0.45) continue;
    const minutes = Math.round((h.dailyTargetMinutes * (0.5 + rnd() * 1.1)) / 5) * 5 || 10;
    // evening study, local 20:00-22:00 IST == 14:30-16:30 UTC
    const started = new Date(`${ymd(day)}T14:30:00Z`);
    started.setUTCMinutes(started.getUTCMinutes() + Math.floor(rnd() * 120));
    if (started > now) continue;
    await call('/sessions', 'POST', { habitId: h.id, startedAt: started.toISOString(), durationMinutes: minutes });
    sessions++;
  }
}

const today = ymd(now);
const tasks = [
  ['Learn database indexing', true],
  ['Solve 3 sliding-window problems', true],
  ['Read the CAP theorem chapter', false],
  ['Build a tiny RAG prototype', false],
];
for (const [title, done] of tasks) {
  const t = await call('/tasks', 'POST', { title, dueDate: today });
  if (done) await call(`/tasks/${t.id}`, 'PATCH', { status: 'DONE' });
}
console.log(`Seeded ${EMAIL} / ${PASSWORD}: ${habits.length} habits, ${sessions} sessions, ${tasks.length} tasks.`);
