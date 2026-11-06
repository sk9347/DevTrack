import { INestApplication } from '@nestjs/common';
import { createApp, request, resetDb, signedInAgent } from './helpers';

describe('auth', () => {
  let app: INestApplication;
  beforeAll(async () => (app = await createApp()));
  beforeEach(() => resetDb(app));
  afterAll(() => app.close());

  it('registers, sets an httpOnly cookie and serves /me', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'Me@Example.com', password: 'correct-horse' })
      .expect(201);
    const cookie = (res.headers['set-cookie'] as unknown as string[]).join(';');
    expect(cookie).toMatch(/devtrack_token=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(res.body.user).toMatchObject({ email: 'me@example.com', timezone: 'Asia/Kolkata' });
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('serves /me to a signed-in agent and rejects anonymous callers', async () => {
    const agent = await signedInAgent(app);
    await agent.get('/api/v1/auth/me').expect(200);
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    await request(app.getHttpServer()).get('/api/v1/habits').expect(401);
  });

  it('rejects duplicate emails, weak passwords and unknown timezones', async () => {
    await signedInAgent(app);
    const http = request(app.getHttpServer());
    await http.post('/api/v1/auth/register').send({ email: 'a@example.com', password: 'correct-horse' }).expect(409);
    await http.post('/api/v1/auth/register').send({ email: 'b@example.com', password: 'short' }).expect(400);
    await http
      .post('/api/v1/auth/register')
      .send({ email: 'c@example.com', password: 'correct-horse', timezone: 'Mars/Olympus' })
      .expect(400);
  });

  it('logs in with the right password only', async () => {
    await signedInAgent(app);
    const http = request(app.getHttpServer());
    await http.post('/api/v1/auth/login').send({ email: 'a@example.com', password: 'wrong-password' }).expect(401);
    await http.post('/api/v1/auth/login').send({ email: 'a@example.com', password: 'correct-horse' }).expect(200);
  });

  it('logout clears the session cookie', async () => {
    const agent = await signedInAgent(app);
    await agent.post('/api/v1/auth/logout').expect(204);
    await agent.get('/api/v1/auth/me').expect(401);
  });
});
