import * as path from 'path';
import * as dotenv from 'dotenv';

// Load BEFORE anything imports PrismaClient so tests never touch the dev database.
dotenv.config({ path: path.join(__dirname, '..', '.env.test'), override: true });

import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';

export async function createApp(): Promise<INestApplication> {
  const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = configureApp(mod.createNestApplication());
  await app.init();
  return app;
}

export async function resetDb(app: INestApplication) {
  const prisma = app.get(PrismaService);
  await prisma.studySession.deleteMany();
  await prisma.task.deleteMany();
  await prisma.habit.deleteMany();
  await prisma.user.deleteMany();
}

/** Registers a user and returns a cookie-carrying agent. UTC keeps date maths deterministic. */
export async function signedInAgent(app: INestApplication, email = 'a@example.com', timezone = 'UTC') {
  const agent = request.agent(app.getHttpServer());
  await agent.post('/api/v1/auth/register').send({ email, password: 'correct-horse', timezone }).expect(201);
  return agent;
}

export { request };
