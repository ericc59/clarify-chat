import { db } from "@workspace/db/client";
import { messages, roomMembers, rooms, user } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { appRouter } from "../root.js";
import { createCallerFactory, createTRPCContext } from "../trpc.js";

// Helper to generate unique IDs for tests
export function createTestId(prefix: string) {
	return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Create a test user
export async function createTestUser(
	overrides?: Partial<typeof user.$inferInsert>,
) {
	const id = createTestId("user");
	const [testUser] = await db
		.insert(user)
		.values({
			id,
			name: `Test User ${id}`,
			email: `${id}@test.com`,
			emailVerified: true,
			...overrides,
		})
		.returning();

	return testUser!;
}

// Create a test session for a user
export function createTestSession(testUser: typeof user.$inferSelect) {
	return {
		session: {
			id: createTestId("session"),
			createdAt: new Date(),
			updatedAt: new Date(),
			userId: testUser.id,
			expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
			token: createTestId("token"),
			ipAddress: null,
			userAgent: null,
		},
		user: {
			id: testUser.id,
			name: testUser.name,
			email: testUser.email,
			emailVerified: testUser.emailVerified,
			image: testUser.image,
			createdAt: testUser.createdAt,
			updatedAt: testUser.updatedAt,
		},
	};
}

// Create a tRPC caller for testing
export function createTestCaller(
	session: ReturnType<typeof createTestSession> | null = null,
) {
	const ctx = createTRPCContext({ session });
	const createCaller = createCallerFactory(appRouter);
	return createCaller(ctx);
}

// Create a test room
export async function createTestRoom(
	createdById: string,
	overrides?: Partial<typeof rooms.$inferInsert>,
) {
	const id = createTestId("room");
	const [room] = await db
		.insert(rooms)
		.values({
			id,
			name: `Test Room ${id}`,
			createdById,
			isPublic: true,
			...overrides,
		})
		.returning();

	// Add creator as member
	await db.insert(roomMembers).values({
		id: createTestId("member"),
		roomId: id,
		userId: createdById,
	});

	return room!;
}

// Cleanup helpers
export async function cleanupTestUser(userId: string) {
	await db.delete(user).where(eq(user.id, userId));
}

export async function cleanupTestRoom(roomId: string) {
	await db.delete(rooms).where(eq(rooms.id, roomId));
}

export async function cleanupTestMessage(messageId: string) {
	await db.delete(messages).where(eq(messages.id, messageId));
}

// Cleanup all test data for a user (cascades to rooms, messages, etc.)
export async function cleanupAllTestData(userId: string) {
	await db.delete(user).where(eq(user.id, userId));
}
