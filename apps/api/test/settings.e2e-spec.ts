import { INestApplication } from '@nestjs/common';
import { createApp, request, resetDb, signedInAgent } from './helpers';

const API = '/api/v1';
type Agent = Awaited<ReturnType<typeof signedInAgent>>;

const noBom = (s: string) => s.replace(/^﻿/, '');
const lines = (s: string) => noBom(s).trim().split('\r\n');

async function seed(agent: Agent, habitName = 'DSA') {
  const habit = (
    await agent.post(`${API}/habits`).send({ name: habitName, dailyTargetMinutes: 30, targetFrequency: 5 }).expect(201)
  ).body;
  const task = (await agent.post(`${API}/tasks`).send({ title: 'Two pointers', dueDate: '2026-11-05' }).expect(201)).body;
  await agent
    .post(`${API}/sessions`)
    .send({ habitId: habit.id, taskId: task.id, startedAt: '2026-11-05T23:30:00.000Z', durationMinutes: 45 })
    .expect(201);
  return { habit, task };
}

describe('settings', () => {
  let app: INestApplication;
  beforeAll(async () => (app = await createApp()));
  beforeEach(() => resetDb(app));
  afterAll(() => app.close());

  describe('timezone', () => {
    it('changes the timezone and re-buckets history', async () => {
      const agent = await signedInAgent(app, 'a@example.com', 'UTC');
      await seed(agent);
      expect((await agent.get(`${API}/sessions?from=2026-11-05&to=2026-11-05`).expect(200)).body).toHaveLength(1);

      const res = await agent.patch(`${API}/auth/me`).send({ timezone: 'Asia/Kolkata' }).expect(200);
      expect(res.body.user).toMatchObject({ email: 'a@example.com', timezone: 'Asia/Kolkata' });
      expect((await agent.get(`${API}/auth/me`).expect(200)).body.user.timezone).toBe('Asia/Kolkata');
      // 23:30Z is already the next morning in Kolkata
      expect((await agent.get(`${API}/sessions?from=2026-11-05&to=2026-11-05`).expect(200)).body).toHaveLength(0);
      expect((await agent.get(`${API}/sessions?from=2026-11-06&to=2026-11-06`).expect(200)).body).toHaveLength(1);
    });

    it('rejects an unknown or missing timezone and anonymous callers', async () => {
      const agent = await signedInAgent(app);
      await agent.patch(`${API}/auth/me`).send({ timezone: 'Mars/Olympus' }).expect(400);
      await agent.patch(`${API}/auth/me`).send({}).expect(400);
      await request(app.getHttpServer()).patch(`${API}/auth/me`).send({ timezone: 'UTC' }).expect(401);
      expect((await agent.get(`${API}/auth/me`)).body.user.timezone).toBe('UTC');
    });
  });

  describe('password', () => {
    it('changes the password: the new one signs in, the old one does not', async () => {
      const agent = await signedInAgent(app);
      await agent
        .post(`${API}/auth/password`)
        .send({ currentPassword: 'correct-horse', newPassword: 'battery-staple' })
        .expect(204);
      const http = request(app.getHttpServer());
      await http.post(`${API}/auth/login`).send({ email: 'a@example.com', password: 'battery-staple' }).expect(200);
      await http.post(`${API}/auth/login`).send({ email: 'a@example.com', password: 'correct-horse' }).expect(401);
    });

    it('answers a wrong current password with 400, never 401 (a 401 signs the user out in the web app)', async () => {
      const agent = await signedInAgent(app);
      const res = await agent
        .post(`${API}/auth/password`)
        .send({ currentPassword: 'nope-nope-nope', newPassword: 'battery-staple' })
        .expect(400);
      expect(res.body.message).toBe('Current password is incorrect');
      await agent.get(`${API}/auth/me`).expect(200);
    });

    it('rejects a short or unchanged new password and anonymous callers', async () => {
      const agent = await signedInAgent(app);
      const short = await agent
        .post(`${API}/auth/password`)
        .send({ currentPassword: 'correct-horse', newPassword: 'short' })
        .expect(400);
      expect(JSON.stringify(short.body.message)).toMatch(/at least 8/);
      await agent
        .post(`${API}/auth/password`)
        .send({ currentPassword: 'correct-horse', newPassword: 'correct-horse' })
        .expect(400);
      await request(app.getHttpServer())
        .post(`${API}/auth/password`)
        .send({ currentPassword: 'correct-horse', newPassword: 'battery-staple' })
        .expect(401);
    });
  });

  describe('delete account', () => {
    it('refuses a wrong password with 400 and keeps everything', async () => {
      const agent = await signedInAgent(app);
      await seed(agent);
      const res = await agent.delete(`${API}/auth/me`).send({ password: 'wrong-password' }).expect(400);
      expect(res.body.message).toBe('Password is incorrect');
      await agent.get(`${API}/auth/me`).expect(200);
      expect((await agent.get(`${API}/habits`)).body).toHaveLength(1);
    });

    it('deletes the account and all its data, clears the cookie, and leaves other users alone', async () => {
      const agent = await signedInAgent(app, 'a@example.com');
      const other = await signedInAgent(app, 'b@example.com');
      await seed(agent);
      await seed(other, 'Other habit');

      const res = await agent.delete(`${API}/auth/me`).send({ password: 'correct-horse' }).expect(204);
      expect((res.headers['set-cookie'] as unknown as string[]).join(';')).toMatch(/devtrack_token=;/);

      await request(app.getHttpServer())
        .post(`${API}/auth/login`)
        .send({ email: 'a@example.com', password: 'correct-horse' })
        .expect(401);
      await agent.get(`${API}/auth/me`).expect(401);

      expect((await other.get(`${API}/habits`)).body.map((h: { name: string }) => h.name)).toEqual(['Other habit']);
      expect((await other.get(`${API}/tasks?date=2026-11-05`)).body).toHaveLength(1);
      expect((await other.get(`${API}/sessions`)).body).toHaveLength(1);
    });

    it('requires a password and a session', async () => {
      const agent = await signedInAgent(app);
      await agent.delete(`${API}/auth/me`).send({}).expect(400);
      await request(app.getHttpServer()).delete(`${API}/auth/me`).send({ password: 'correct-horse' }).expect(401);
    });
  });

  describe('export', () => {
    it('downloads sessions as CSV with local dates, task names and a download header', async () => {
      const agent = await signedInAgent(app, 'a@example.com', 'Asia/Kolkata');
      await seed(agent);
      const res = await agent.get(`${API}/export/sessions.csv`).expect(200);
      expect(res.headers['content-type']).toMatch(/^text\/csv/);
      expect(res.headers['content-disposition']).toBe('attachment; filename="devtrack-sessions.csv"');
      const rows = lines(res.text);
      expect(rows[0]).toBe('date,habit,minutes,started_at,ended_at,task');
      expect(rows[1]).toBe('2026-11-06,DSA,45,2026-11-05T23:30:00.000Z,2026-11-06T00:15:00.000Z,Two pointers');
    });

    it('exports habits and tasks, with minutes logged per task', async () => {
      const agent = await signedInAgent(app);
      await seed(agent);
      const habits = lines((await agent.get(`${API}/export/habits.csv`).expect(200)).text);
      expect(habits[0]).toBe('name,daily_target_minutes,days_per_week,color,active,created_at');
      expect(habits[1]).toMatch(/^DSA,30,5,#[0-9a-fA-F]{6},true,/);
      const tasks = lines((await agent.get(`${API}/export/tasks.csv`).expect(200)).text);
      expect(tasks[0]).toBe('due_date,title,status,done_at,minutes_logged');
      expect(tasks[1]).toBe('2026-11-05,Two pointers,TODO,,45');
    });

    it('writes only a header for an account with no data', async () => {
      const agent = await signedInAgent(app);
      const res = await agent.get(`${API}/export/sessions.csv`).expect(200);
      expect(noBom(res.text)).toBe('date,habit,minutes,started_at,ended_at,task\r\n');
    });

    it('neutralises spreadsheet formulas and quotes awkward names', async () => {
      const agent = await signedInAgent(app);
      await agent
        .post(`${API}/habits`)
        .send({ name: '=HYPERLINK("http://x")', dailyTargetMinutes: 30, targetFrequency: 5 })
        .expect(201);
      await agent.post(`${API}/habits`).send({ name: 'Read, write', dailyTargetMinutes: 30, targetFrequency: 5 }).expect(201);
      const body = (await agent.get(`${API}/export/habits.csv`).expect(200)).text;
      expect(body).toContain(`"'=HYPERLINK(""http://x"")"`);
      expect(body).toContain('"Read, write"');
    });

    it("never includes another user's rows", async () => {
      const agent = await signedInAgent(app, 'a@example.com');
      const other = await signedInAgent(app, 'b@example.com');
      await seed(other, 'Secret habit');
      for (const f of ['habits', 'tasks', 'sessions']) {
        const text = (await agent.get(`${API}/export/${f}.csv`).expect(200)).text;
        expect(text).not.toMatch(/Secret habit|Two pointers/);
      }
    });

    it('needs a session and knows only the three files', async () => {
      const agent = await signedInAgent(app);
      await request(app.getHttpServer()).get(`${API}/export/habits.csv`).expect(401);
      await agent.get(`${API}/export/users.csv`).expect(404);
      await agent.get(`${API}/export/..%2Fpasswd`).expect(404);
    });
  });
});
