import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './supabase/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Falls back to placeholder so `drizzle-kit generate` works without credentials.
    // Set DATABASE_URL in .env.local before running db:push or db:studio.
    url: process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/db',
  },
});
