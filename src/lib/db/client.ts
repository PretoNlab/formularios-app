import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set.\n" +
    "Copy .env.local.example to .env.local and fill in your Supabase credentials."
  )
}

// For Supabase Edge/Transaction Pooler, prepared statements aren't supported
const queryClient = postgres(process.env.DATABASE_URL, { prepare: false })

export const db = drizzle(queryClient, { schema })
export type Database = typeof db
