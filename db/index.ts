import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set in .env.local");
  const client = postgres(url, { ssl: "require", max: 1, idle_timeout: 20, connect_timeout: 30 });
  return drizzle(client, { schema });
}

export * from "./schema";
