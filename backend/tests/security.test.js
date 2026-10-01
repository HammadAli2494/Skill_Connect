import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, registerUser } from './setup.js';

describe('security boundaries', () => {
  it('rejects service creation without a session', async () => {
    const res = await request(app).post('/api/services').send({
      title: 'Unauthorized listing',
      description: 'This request should never create a service.',
      price: 1000,
      pricingType: 'fixed',
      city: 'Lahore',
    });
    expect(res.status).toBe(401);
  });

  it('rejects a customer editing a provider service', async () => {
    const provider = await registerUser({ role: 'provider', email: 'secure-provider@example.com' });
    const customer = await registerUser({ email: 'secure-customer@example.com' });
    await request(app).post('/api/providers/me').set('Cookie', provider.cookie).send({
      businessName: 'Secure Provider',
      city: 'Lahore',
      bio: 'Profile for the security test.',
      experienceYears: 2,
      skills: ['Testing'],
      serviceArea: ['Gulberg'],
    });
    const { Category } = await import('../src/models/Category.js');
    const category = await Category.create({ name: 'Security', slug: `security-${Date.now()}`, icon: 'repair' });
    const created = await request(app).post('/api/services').set('Cookie', provider.cookie).send({
      category: String(category._id),
      title: 'Security test service',
      description: 'A listing used only to check ownership rules.',
      price: 1000,
      pricingType: 'fixed',
      city: 'Lahore',
    });
    expect(created.status).toBe(201);
    const edited = await request(app)
      .patch(`/api/services/${created.body.data.service.id}`)
      .set('Cookie', customer.cookie)
      .send({ title: 'Hijacked title' });
    expect(edited.status).toBe(403);
  });
});
