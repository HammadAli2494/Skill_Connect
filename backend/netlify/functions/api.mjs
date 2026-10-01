import serverless from 'serverless-http';
import { createApp } from '../../src/app.js';
import { connectDb } from '../../src/config/db.js';
import { assertEnv } from '../../src/config/env.js';

assertEnv();

const handleRequest = serverless(createApp());

export async function handler(event, context) {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await connectDb();
  } catch {
    console.error('Database connection failed.');

    return {
      statusCode: 503,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        message: 'Service temporarily unavailable. Please try again.',
      }),
    };
  }

  return handleRequest(event, context);
}