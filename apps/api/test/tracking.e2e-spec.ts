import { INestApplication } from '@nestjs/common';
import { addDays, toLocalDate } from '../src/common/dates';
import { createApp, request, resetDb, signedInAgent } from './helpers';

const API = '/api/v1';
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const daysAgoAt = (n: number, hour = 12) =>
  new Date(`${addDays(toLocalDate(new Date(), 'UTC'), -n)}T${String(hour).padStart(2, '0')}:00:00Z`).toISOString();

describe('habits, tasks, sessions and the daily track', () => {
  let app: INestApplication;
  let agent: ReturnType<typeof request.agent>;
  const today = () => toLocalDate(new Date(), 'UTC');

  beforeAll(async () => (app = await createApp()));
  beforeEach(async () => {
    await resetDb(app);
    agent = await signedInAgent(app);
  });
  afterAll(() => app.close());

  const makeHabit = async (name = 'DSA', extra: object = {}) =>
    (await agent.post(`${API}/habits`).send({ name, dailyTargetMinutes: 30, ...extra }).expect(201)).body;

  describe('habits', () => {
    it('creates with defaults, validates input and archives instead of deleting', async () => {
      const habit = await makeHabit('System Design');
      expect(habit).toMatchObject({ name: 'System Design', targetFrequency: 5, isActive: true });
      await agent.post(`${API}/habits`).send({ name: '' }).expect(400);
      await agent.post(`${API}/habits`).send({ name: 'x', targetFrequency: 9 }).expect(400);

      await agent.delete(`${API}/habits/${habit.id}`).expect(204);
      expect((await agent.get(`${API}/habits`).expect(200)).body).toHaveLength(0);
    });

    it('keeps past sessions after the habit is archived', async () => {
      const habit = await makeHabit();
      await agent.post(`${API}/sessions`).send({ habitId: habit.id, startedAt: minutesAgo(90), durationMinutes: 45 }).expect(201);
      await agent.delete(`${API}/habits/${habit.id}`).expect(204);
      const sessions = (await agent.get(`${API}/sessions`).expect(200)).body;
      expect(sessions).toHaveLength(1);
    });

    it("never lets one user touch another user's habit", async () => {
      const habit = await makeHabit();
      const other = await signedInAgent(app, 'b@example.com');
      await other.patch(`${API}/habits/${habit.id}`).send({ name: 'hacked' }).expect(404);
      await other.delete(`${API}/habits/${habit.id}`).expect(404);
      expect((await other.get(`${API}/habits`)).body).toHaveLength(0);
    });
  });

  describe('tasks', () => {
    it('lists by due date and stamps doneAt when completed', async () => {
      const t = (await agent.post(`${API}/tasks`).send({ title: 'Learn indexing', dueDate: today() }).expect(201)).body;
      await agent.post(`${API}/tasks`).send({ title: 'Tomorrow thing', dueDate: addDays(today(), 1) }).expect(201);

      const list = (await agent.get(`${API}/tasks?date=${today()}`).expect(200)).body;
      expect(list.map((x: any) => x.title)).toEqual(['Learn indexing']);

      const done = (await agent.patch(`${API}/tasks/${t.id}`).send({ status: 'DONE' }).expect(200)).body;
      expect(done.status).toBe('DONE');
      expect(done.doneAt).toBeTruthy();
      const reopened = (await agent.patch(`${API}/tasks/${t.id}`).send({ status: 'TODO' }).expect(200)).body;
      expect(reopened.doneAt).toBeNull();
    });

    it('rejects malformed dates', async () => {
      await agent.post(`${API}/tasks`).send({ title: 'x', dueDate: '06/11/2026' }).expect(400);
      await agent.get(`${API}/tasks?date=nope`).expect(400);
    });

    it('sums minutes across several sessions on one task', async () => {
      const habit = await makeHabit();
      const task = (await agent.post(`${API}/tasks`).send({ title: 'B-trees', dueDate: today() })).body;
      for (const m of [20, 35]) {
        await agent.post(`${API}/sessions`).send({ habitId: habit.id, taskId: task.id, startedAt: minutesAgo(60), durationMinutes: m }).expect(201);
      }
      const [row] = (await agent.get(`${API}/tasks?date=${today()}`)).body;
      expect(row.loggedMinutes).toBe(55);
    });
  });

  describe('sessions', () => {
    it('records real duration and derives endedAt', async () => {
      const habit = await makeHabit();
      const startedAt = minutesAgo(120);
      const s = (await agent.post(`${API}/sessions`).send({ habitId: habit.id, startedAt, durationMinutes: 55 }).expect(201)).body;
      expect(new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()).toBe(55 * 60_000);
      expect(s.habitName).toBe('DSA');
    });

    it('rejects future, zero-length, overlong and foreign-habit sessions', async () => {
      const habit = await makeHabit();
      const post = (body: object) => agent.post(`${API}/sessions`).send(body);
      await post({ habitId: habit.id, startedAt: new Date(Date.now() + 3_600_000).toISOString(), durationMinutes: 30 }).expect(400);
      await post({ habitId: habit.id, startedAt: minutesAgo(10), durationMinutes: 0 }).expect(400);
      await post({ habitId: habit.id, startedAt: minutesAgo(10), durationMinutes: 721 }).expect(400);

      const other = await signedInAgent(app, 'b@example.com');
      await other.post(`${API}/sessions`).send({ habitId: habit.id, startedAt: minutesAgo(10), durationMinutes: 20 }).expect(404);
    });

    it('filters by local date range and deletes', async () => {
      const habit = await makeHabit();
      await agent.post(`${API}/sessions`).send({ habitId: habit.id, startedAt: daysAgoAt(3), durationMinutes: 30 }).expect(201);
      const keep = (await agent.post(`${API}/sessions`).send({ habitId: habit.id, startedAt: daysAgoAt(1), durationMinutes: 40 }).expect(201)).body;

      const recent = (await agent.get(`${API}/sessions?from=${addDays(today(), -1)}&to=${today()}`).expect(200)).body;
      expect(recent.map((s: any) => s.id)).toEqual([keep.id]);

      await agent.delete(`${API}/sessions/${keep.id}`).expect(204);
      await agent.delete(`${API}/sessions/${keep.id}`).expect(404);
    });
  });

  describe('analytics: the daily track', () => {
    it('GET /analytics/day combines habits, tasks and sessions for one day', async () => {
      const dsa = await makeHabit('DSA', { dailyTargetMinutes: 30 });
      const sd = await makeHabit('System Design', { dailyTargetMinutes: 60 });
      await agent.post(`${API}/tasks`).send({ title: 'Indexing', dueDate: today() });
      await agent.post(`${API}/sessions`).send({ habitId: dsa.id, startedAt: minutesAgo(100), durationMinutes: 35 });
      await agent.post(`${API}/sessions`).send({ habitId: sd.id, startedAt: minutesAgo(50), durationMinutes: 20 });

      const day = (await agent.get(`${API}/analytics/day?date=${today()}`).expect(200)).body;
      expect(day.totalMinutes).toBe(55);
      expect(day.habits.find((h: any) => h.name === 'DSA')).toMatchObject({ minutes: 35, met: true });
      expect(day.habits.find((h: any) => h.name === 'System Design')).toMatchObject({ minutes: 20, met: false });
      expect(day.tasks).toHaveLength(1);
      expect(day.sessions).toHaveLength(2);
    });

    it('an untouched day is empty, not an error', async () => {
      const day = (await agent.get(`${API}/analytics/day?date=2020-01-01`).expect(200)).body;
      expect(day).toMatchObject({ totalMinutes: 0, sessions: [], tasks: [] });
    });

    it('overview is computed from stored sessions, with a zero-filled week', async () => {
      const habit = await makeHabit('DSA', { targetFrequency: 3, dailyTargetMinutes: 30 });
      await agent.post(`${API}/sessions`).send({ habitId: habit.id, startedAt: minutesAgo(60), durationMinutes: 90 }).expect(201);
      const done = (await agent.post(`${API}/tasks`).send({ title: 'a', dueDate: today() })).body;
      await agent.post(`${API}/tasks`).send({ title: 'b', dueDate: today() });
      await agent.patch(`${API}/tasks/${done.id}`).send({ status: 'DONE' });

      const o = (await agent.get(`${API}/analytics/overview?period=week`).expect(200)).body;
      expect(o.daily).toHaveLength(7);
      expect(o.totalMinutes).toBe(90);
      expect(o.studyHours).toBe(1.5);
      expect(o.tasks).toEqual({ total: 2, done: 1 });
      expect(o.habits[0]).toMatchObject({ minutes: 90, daysMet: 1, targetDays: 3 });
      expect(o.streak.current).toBe(1);

      await agent.get(`${API}/analytics/overview?period=year`).expect(400);
    });

    it('a missed day never erases earlier work or the longest streak', async () => {
      const habit = await makeHabit();
      for (const n of [5, 4, 3]) {
        await agent.post(`${API}/sessions`).send({ habitId: habit.id, startedAt: daysAgoAt(n), durationMinutes: 30 }).expect(201);
      }
      const o = (await agent.get(`${API}/analytics/overview?period=month`)).body;
      expect(o.totalMinutes).toBe(90);
      expect(o.streak).toEqual({ current: 0, longest: 3 });
    });

    it('heatmap returns one zero-filled cell per day with intensity levels', async () => {
      const habit = await makeHabit();
      await agent.post(`${API}/sessions`).send({ habitId: habit.id, startedAt: minutesAgo(30), durationMinutes: 75 }).expect(201);
      const h = (await agent.get(`${API}/analytics/heatmap?weeks=4`).expect(200)).body;
      expect(h.days.length).toBeGreaterThanOrEqual(22);
      expect(h.days.at(-1)).toMatchObject({ date: today(), minutes: 75, level: 3 });
      await agent.get(`${API}/analytics/heatmap?weeks=99`).expect(400);
    });
  });
});
