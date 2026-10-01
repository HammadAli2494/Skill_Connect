import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { assertEnv, env } from './config/env.js';

assertEnv();

if (env.cloudinary.apiKey && env.cloudinary.apiKey === env.cloudinary.apiSecret) {
  console.warn(
    'Cloudinary uploads will fail: CLOUDINARY_API_SECRET matches CLOUDINARY_API_KEY. Use the API secret from the Cloudinary dashboard, then restart the API.'
  );
}

const app = createApp();
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
connectDb()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`SkillConnect API listening on port ${env.port}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed.');
    if (env.nodeEnv !== 'production') console.error(error.message);
    process.exit(1);
  });
