import type { Database } from "@workspace/db/client";
import { user } from "@workspace/db/schema";
import { eq, ilike, or } from "drizzle-orm";
import type { SessionUser } from "../validators/session.js";
import type { UpdateProfile } from "../validators/user.js";

// Public user fields (safe to expose)
const publicUserSelect = {
	id: user.id,
	name: user.name,
	email: user.email,
	image: user.image,
} as const;

export const UserService = {
	/**
	 * Get the current user's full profile
	 */
	async getMe(db: Database, userId: string) {
		const [result] = await db
			.select()
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		return result ?? null;
	},

	/**
	 * Get a user by ID (public fields only)
	 */
	async getById(db: Database, userId: string) {
		const [result] = await db
			.select({
				...publicUserSelect,
				createdAt: user.createdAt,
			})
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		return result ?? null;
	},

	/**
	 * Update the current user's profile
	 */
	async updateProfile(
		db: Database,
		data: UpdateProfile,
		sessionUser: SessionUser,
	) {
		const [updated] = await db
			.update(user)
			.set({
				name: data.name ?? sessionUser.name,
				image: data.image ?? sessionUser.image ?? null,
				updatedAt: new Date(),
			})
			.where(eq(user.id, sessionUser.id))
			.returning();

		return updated;
	},

	/**
	 * Search users by name or email
	 */
	async search(db: Database, params: { query: string; limit: number }) {
		const searchPattern = `%${params.query}%`;

		return db
			.select(publicUserSelect)
			.from(user)
			.where(
				or(ilike(user.name, searchPattern), ilike(user.email, searchPattern)),
			)
			.limit(params.limit);
	},
};
