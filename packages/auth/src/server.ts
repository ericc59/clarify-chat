import { db } from "@workspace/db/client";
import * as schema from "@workspace/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),
	emailAndPassword: {
		enabled: true,
	},
	trustedOrigins: [process.env.CORS_ORIGIN || "http://localhost:3000"],
});

export type Session = typeof auth.$Infer.Session;
