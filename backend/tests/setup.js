import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { beforeAll, afterAll, afterEach } from 'vitest';
import { createApp } from '../src/app.js';

let mongo;

export const app = createApp();

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-that-is-long-enough';
  process.env.FRONTEND_URL = 'http://localhost:5173';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

export function agent() {
  return request.agent(app);
}

export async function registerUser(overrides = {}) {
  const payload = {
    name: 'Ayesha Khan',
    email: `user${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`,
    password: 'Secret123',
    role: 'customer',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  return { res, payload, cookie: res.headers['set-cookie'] };
}
