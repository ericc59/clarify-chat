import { createLogger } from "@workspace/logger";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const log = createLogger("db");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
	log.error("DATABASE_URL environment variable is not set");
	throw new Error("DATABASE_URL environment variable is not set");
}

log.debug("Connecting to database");

const client = postgres(connectionString);

export const db = drizzle(client, { schema });

export type Database = typeof db;

log.info("Database client initialized");
