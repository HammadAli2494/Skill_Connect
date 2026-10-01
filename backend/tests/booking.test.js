import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { Category } from '../src/models/Category.js';
import { ProviderProfile } from '../src/models/ProviderProfile.js';
import { app, registerUser } from './setup.js';

async function readyProvider(email) {
  const user = await registerUser({ role: 'provider', email });
  await request(app).post('/api/providers/me').set('Cookie', user.cookie).send({
    businessName: 'Ali Electrical',
    city: 'Lahore',
    bio: 'Home electrical repairs.',
    experienceYears: 8,
    skills: ['Wiring'],
    serviceArea: ['Model Town'],
  });
  const profile = await ProviderProfile.findOne({ user: user.res.body.data.user.id });
  profile.availability.monday = [{ start: '09:00', end: '17:00' }];
  profile.availability.tuesday = [{ start: '09:00', end: '17:00' }];
  profile.availability.wednesday = [{ start: '09:00', end: '17:00' }];
  profile.availability.thursday = [{ start: '09:00', end: '17:00' }];
  profile.availability.friday = [{ start: '09:00', end: '17:00' }];
  profile.availability.saturday = [{ start: '09:00', end: '17:00' }];
  profile.availability.sunday = [{ start: '09:00', end: '17:00' }];
  await profile.save();
  const category = await Category.create({
    name: 'Electrical',
    slug: `electrical-${Date.now()}`,
    icon: 'electrical',
  });
  const service = await request(app).post('/api/services').set('Cookie', user.cookie).send({
    category: String(category._id),
    title: 'Home electrical repair',
    description: 'Switches, sockets, and lighting faults for homes.',
    price: 2500,
    pricingType: 'starting_at',
    city: 'Lahore',
    whatsIncluded: ['Visit', 'Diagnosis'],
  });
  return { user, serviceId: service.body.data.service.id };
}

function futureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

describe('bookings, reviews, and access control', () => {
  it('creates a booking, rejects an illegal status jump, and hides another customer booking', async () => {
    const provider = await readyProvider('pro@example.com');
    const customerA = await registerUser({ email: 'a@example.com' });
    const customerB = await registerUser({ email: 'b@example.com' });
    const date = futureDate(3);

    const booking = await request(app).post('/api/bookings').set('Cookie', customerA.cookie).send({
      serviceId: provider.serviceId,
      scheduledDate: date,
      scheduledTime: '10:00',
      customerAddress: { line1: '12 Garden Road', area: 'Model Town', city: 'Lahore' },
      customerNotes: 'Gate code 12',
    });
    expect(booking.status).toBe(201);
    expect(booking.body.data.booking.priceSnapshot.amount).toBe(2500);

    const jump = await request(app)
      .patch(`/api/bookings/${booking.body.data.booking.id}/status`)
      .set('Cookie', provider.user.cookie)
      .send({ status: 'completed' });
    expect(jump.status).toBe(400);

    const hidden = await request(app)
      .get(`/api/bookings/${booking.body.data.booking.id}`)
      .set('Cookie', customerB.cookie);
    expect(hidden.status).toBe(404);
  });

  it('allows a review only after completion and only once', async () => {
    const provider = await readyProvider('pro2@example.com');
    const customer = await registerUser({ email: 'reviewer@example.com' });
    const date = futureDate(4);
    const booking = await request(app).post('/api/bookings').set('Cookie', customer.cookie).send({
      serviceId: provider.serviceId,
      scheduledDate: date,
      scheduledTime: '11:00',
      customerAddress: { line1: '8 Canal View', area: 'Johar Town', city: 'Lahore' },
    });
    const id = booking.body.data.booking.id;

    const early = await request(app).post('/api/reviews').set('Cookie', customer.cookie).send({
      bookingId: id,
      rating: 5,
      comment: 'Too early',
    });
    expect(early.status).toBe(400);

    await request(app).patch(`/api/bookings/${id}/status`).set('Cookie', provider.user.cookie).send({ status: 'accepted' });
    await request(app).patch(`/api/bookings/${id}/status`).set('Cookie', provider.user.cookie).send({ status: 'in_progress' });
    await request(app).patch(`/api/bookings/${id}/status`).set('Cookie', provider.user.cookie).send({ status: 'completed' });

    const review = await request(app).post('/api/reviews').set('Cookie', customer.cookie).send({
      bookingId: id,
      rating: 5,
      comment: 'Careful and on time.',
    });
    expect(review.status).toBe(201);
    expect(review.body.data.providerRating.averageRating).toBe(5);

    const again = await request(app).post('/api/reviews').set('Cookie', customer.cookie).send({
      bookingId: id,
      rating: 4,
      comment: 'Second try',
    });
    expect(again.status).toBe(409);
  });

  it('refuses a second accepted booking in the same slot', async () => {
    const provider = await readyProvider('pro3@example.com');
    const first = await registerUser({ email: 'first@example.com' });
    const second = await registerUser({ email: 'second@example.com' });
    const date = futureDate(5);
    const body = {
      serviceId: provider.serviceId,
      scheduledDate: date,
      scheduledTime: '12:00',
      customerAddress: { line1: '1 Main Street', area: 'DHA', city: 'Lahore' },
    };
    const a = await request(app).post('/api/bookings').set('Cookie', first.cookie).send(body);
    const b = await request(app).post('/api/bookings').set('Cookie', second.cookie).send(body);
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);

    const acceptA = await request(app)
      .patch(`/api/bookings/${a.body.data.booking.id}/status`)
      .set('Cookie', provider.user.cookie)
      .send({ status: 'accepted' });
    const acceptB = await request(app)
      .patch(`/api/bookings/${b.body.data.booking.id}/status`)
      .set('Cookie', provider.user.cookie)
      .send({ status: 'accepted' });
    expect(acceptA.status).toBe(200);
    expect(acceptB.status).toBe(409);
  });
});
