import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new ApiError(400, 'Please check the form and try again.', details));
    }
    req[source] = parsed.data;
    next();
  };
}

export function formatZod(error) {
  if (!(error instanceof ZodError)) return null;
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
}
