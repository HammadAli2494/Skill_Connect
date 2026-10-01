import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const filter = { user: req.user._id };
  const [items, total, unread] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);

  res.json({
    success: true,
    data: {
      notifications: items.map((item) => ({
        id: item._id,
        type: item.type,
        title: item.title,
        message: item.message,
        isRead: item.isRead,
        relatedEntity: item.relatedEntity,
        createdAt: item.createdAt,
      })),
      unread,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

export const markRead = asyncHandler(async (req, res) => {
  const item = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!item) throw new ApiError(404, 'Notification not found.');
  item.isRead = true;
  await item.save();
  res.json({ success: true, data: { id: item._id, isRead: true } });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
  res.json({ success: true, data: { updated: true } });
});
