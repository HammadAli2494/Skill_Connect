import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { Category } from '../src/models/Category.js';
import { app, registerUser } from './setup.js';

describe('authentication', () => {
  it('registers a customer and returns the current user from the cookie', async () => {
    const { res, payload, cookie } = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(payload.email.toLowerCase());
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(cookie?.[0]).toMatch(/accessToken=/);
    expect(cookie?.[0]).toMatch(/HttpOnly/i);

    const me = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(payload.email.toLowerCase());
  });

  it('rejects a wrong password with a generic message', async () => {
    const { payload } = await registerUser({ email: 'login@example.com' });
    const res = await request(app).post('/api/auth/login').send({
      email: payload.email,
      password: 'Wrongpass1',
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password.');
  });

  it('blocks protected routes without a session', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('blocks customers from admin stats', async () => {
    const { cookie } = await registerUser();
    const res = await request(app).get('/api/admin/stats').set('Cookie', cookie);
    expect(res.status).toBe(403);
  });

  it('does not let a provider edit another provider service', async () => {
    const owner = await registerUser({ role: 'provider', email: 'owner@example.com' });
    const other = await registerUser({ role: 'provider', email: 'other@example.com' });
    const category = await Category.create({
      name: 'Plumbing',
      slug: 'plumbing',
      description: 'Pipes and fittings',
      icon: 'plumbing',
    });

    await request(app).post('/api/providers/me').set('Cookie', owner.cookie).send({
      businessName: 'Owner Plumbing',
      city: 'Lahore',
      bio: 'Licensed local plumber.',
      experienceYears: 5,
      skills: ['Leaks'],
      serviceArea: ['Gulberg'],
    });

    const created = await request(app)
      .post('/api/services')
      .set('Cookie', owner.cookie)
      .send({
        category: String(category._id),
        title: 'Kitchen leak repair',
        description: 'Find and fix kitchen and bathroom leaks the same day.',
        price: 2500,
        pricingType: 'starting_at',
        city: 'Lahore',
        whatsIncluded: ['Inspection', 'Basic repair'],
      });

    expect(created.status).toBe(201);
    const updated = await request(app)
      .patch(`/api/services/${created.body.data.service.id}`)
      .set('Cookie', other.cookie)
      .send({ title: 'Taken over' });

    expect(updated.status).toBe(404);
  });
});
