import { Report } from '../models/Report.js';
import { Review } from '../models/Review.js';
import { Service } from '../models/Service.js';
import { ProviderProfile } from '../models/ProviderProfile.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

async function targetExists(targetType, targetId) {
  if (targetType === 'service') return Service.exists({ _id: targetId });
  if (targetType === 'review') return Review.exists({ _id: targetId });
  return ProviderProfile.exists({ _id: targetId });
}

export const createReport = asyncHandler(async (req, res) => {
  const exists = await targetExists(req.body.targetType, req.body.targetId);
  if (!exists) throw new ApiError(404, 'That item could not be found.');

  const report = await Report.create({
    reporter: req.user._id,
    targetType: req.body.targetType,
    targetId: req.body.targetId,
    reason: req.body.reason,
  });
  res.status(201).json({
    success: true,
    data: { report: { id: report._id, status: report.status } },
  });
});

export const listReports = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = 20;
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const [reports, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('reporter', 'name email'),
    Report.countDocuments(filter),
  ]);
  res.json({
    success: true,
    data: {
      reports,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    },
  });
});

export const updateReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw new ApiError(404, 'Report not found.');
  report.status = req.body.status;
  report.adminNote = req.body.adminNote || '';
  await report.save();
  res.json({ success: true, data: { report } });
});
