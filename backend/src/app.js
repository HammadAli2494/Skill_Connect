import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import adminRoutes, { reportRouter } from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import categoryRoutes from './routes/category.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import providerRoutes from './routes/provider.routes.js';
import reviewRoutes from './routes/review.routes.js';
import serviceRoutes from './routes/service.routes.js';

const LOCAL_DEV_ORIGIN = 'http://localhost:5173';

function allowedOrigins() {
  const configured = String(process.env.FRONTEND_URL || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV === 'production') return configured;
  return [...new Set([LOCAL_DEV_ORIGIN, ...configured])];
}

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins().includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
    })
  );
  const demoDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/demo');
  app.use('/demo', express.static(demoDir));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use('/api', apiLimiter);

  app.get('/api/health', (req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/providers', providerRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/reports', reportRouter);
  app.use('/api/admin', adminRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
