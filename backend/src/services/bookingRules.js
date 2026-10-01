import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';

const DAY_INDEX = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function weekdayKey(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return DAY_INDEX[date.getUTCDay()];
}

export function slotsFromWindows(windows = []) {
  const slots = [];
  for (const window of windows) {
    let [hour] = window.start.split(':').map(Number);
    const [endHour, endMin] = window.end.split(':').map(Number);
    const endMinutes = endHour * 60 + endMin;
    while (hour * 60 + 60 <= endMinutes && hour < 24) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
      hour += 1;
    }
  }
  return [...new Set(slots)];
}

export function assertFutureSlot(dateString, timeString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hour, minute] = timeString.split(':').map(Number);
  const slot = new Date(year, month - 1, day, hour, minute, 0, 0);
  const now = new Date();
  if (Number.isNaN(slot.getTime()) || slot.getTime() <= now.getTime() + 60 * 60 * 1000) {
    throw new ApiError(400, 'Choose a time at least one hour from now.');
  }
  const max = new Date();
  max.setDate(max.getDate() + 60);
  if (slot > max) {
    throw new ApiError(400, 'Bookings can be made up to 60 days ahead.');
  }
}

export async function assertSlotAvailable({ providerId, date, time, ignoreBookingId }) {
  const query = {
    provider: providerId,
    scheduledDate: date,
    scheduledTime: time,
    status: { $in: ['accepted', 'in_progress'] },
  };
  if (ignoreBookingId) query._id = { $ne: ignoreBookingId };
  const conflict = await Booking.findOne(query).select('_id');
  if (conflict) {
    throw new ApiError(409, 'That time is already booked. Choose another slot.');
  }
}

const PROVIDER_TRANSITIONS = {
  pending: ['accepted', 'rejected'],
  accepted: ['in_progress'],
  in_progress: ['completed'],
};

const CUSTOMER_TRANSITIONS = {
  pending: ['cancelled'],
  accepted: ['cancelled'],
};

export function assertTransition(role, from, to) {
  const map = role === 'customer' ? CUSTOMER_TRANSITIONS : PROVIDER_TRANSITIONS;
  const allowed = map[from] || [];
  if (!allowed.includes(to)) {
    throw new ApiError(400, 'That booking status change is not allowed.');
  }
}
