import mongoose from 'mongoose';
import { isProd } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function notFound(req, res, next) {
  next(new ApiError(404, 'That page or resource was not found.'));
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = err.statusCode || 500;
  let message = err.isOperational ? err.message : 'Something went wrong.';
  let details = err.details;

  if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = 'Invalid id.';
  }

  if (err.name === 'MulterError') {
    status = 400;
    message = 'Upload a JPG, PNG, or WEBP image under 5 MB.';
  }

  if (err.code === 11000) {
    status = 409;
    message = 'That record already exists.';
  }

  if (!isProd && status === 500) {
    console.error(err);
  }

  const body = { success: false, message };
  if (details) body.details = details;
  res.status(status).json(body);
}
