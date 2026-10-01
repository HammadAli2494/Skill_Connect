import { Notification } from '../models/Notification.js';

export async function notify({ user, type, title, message, relatedEntity }) {
  return Notification.create({
    user,
    type,
    title,
    message,
    relatedEntity: relatedEntity || { type: '', id: null },
  });
}
