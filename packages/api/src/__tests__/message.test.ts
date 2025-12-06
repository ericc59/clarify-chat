import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { TRPCError } from "@trpc/server";
import { db } from "@workspace/db/client";
import { messages } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
	cleanupAllTestData,
	createTestCaller,
	createTestRoom,
	createTestSession,
	createTestUser,
} from "./helpers.js";

describe("message router", () => {
	let testUser1: Awaited<ReturnType<typeof createTestUser>>;
	let testUser2: Awaited<ReturnType<typeof createTestUser>>;
	let caller1: ReturnType<typeof createTestCaller>;
	let caller2: ReturnType<typeof createTestCaller>;
	let unauthenticatedCaller: ReturnType<typeof createTestCaller>;
	let testRoom: Awaited<ReturnType<typeof createTestRoom>>;

	beforeAll(async () => {
		// Create test users
		testUser1 = await createTestUser({ name: "Message Test User 1" });
		testUser2 = await createTestUser({ name: "Message Test User 2" });

		// Create callers
		caller1 = createTestCaller(createTestSession(testUser1));
		caller2 = createTestCaller(createTestSession(testUser2));
		unauthenticatedCaller = createTestCaller(null);

		// Create a test room
		testRoom = await createTestRoom(testUser1.id, {
			name: "Message Test Room",
		});
	});

	afterAll(async () => {
		// Cleanup test data
		await cleanupAllTestData(testUser1.id);
		await cleanupAllTestData(testUser2.id);
	});

	describe("create", () => {
		test("should create a message", async () => {
			const message = await caller1.message.create({
				roomId: testRoom.id,
				content: "Hello, world!",
			});

			expect(message).toBeDefined();
			expect(message!.content).toBe("Hello, world!");
			expect(message!.roomId).toBe(testRoom.id);
			expect(message!.userId).toBe(testUser1.id);
		});

		test("should fail when unauthenticated", async () => {
			expect(
				unauthenticatedCaller.message.create({
					roomId: testRoom.id,
					content: "Should fail",
				}),
			).rejects.toThrow(TRPCError);
		});

		test("should fail for non-existent room", async () => {
			expect(
				caller1.message.create({
					roomId: "non-existent-room",
					content: "Should fail",
				}),
			).rejects.toThrow();
		});
	});

	describe("list", () => {
		test("should list messages in a room", async () => {
			// Create some messages
			await caller1.message.create({
				roomId: testRoom.id,
				content: "Message 1",
			});
			await caller1.message.create({
				roomId: testRoom.id,
				content: "Message 2",
			});

			const result = await caller1.message.list({
				roomId: testRoom.id,
				limit: 10,
			});

			expect(result.items.length).toBeGreaterThanOrEqual(2);
			expect(result.items.some((m) => m.content === "Message 1")).toBe(true);
			expect(result.items.some((m) => m.content === "Message 2")).toBe(true);
		});

		test("should return messages with user info", async () => {
			const result = await caller1.message.list({
				roomId: testRoom.id,
				limit: 10,
			});

			expect(result.items.length).toBeGreaterThan(0);
			expect(result.items[0]!.user).toBeDefined();
			expect(result.items[0]!.user.id).toBeDefined();
			expect(result.items[0]!.user.name).toBeDefined();
		});

		test("should support pagination with limit", async () => {
			// Create messages with small delays to ensure different timestamps
			for (let i = 0; i < 5; i++) {
				await caller1.message.create({
					roomId: testRoom.id,
					content: `Pagination message ${i}`,
				});
			}

			const page1 = await caller1.message.list({
				roomId: testRoom.id,
				limit: 3,
			});

			// Should return exactly the limit
			expect(page1.items.length).toBe(3);

			// If there are more messages, nextCursor should be set
			// (this depends on total messages in the room)
			if (page1.nextCursor) {
				expect(typeof page1.nextCursor).toBe("string");
			}
		});
	});

	describe("getById", () => {
		test("should get message by id", async () => {
			const created = await caller1.message.create({
				roomId: testRoom.id,
				content: "Get by ID test",
			});

			const message = await caller1.message.getById({ id: created!.id });

			expect(message!.id).toBe(created!.id);
			expect(message!.content).toBe("Get by ID test");
		});

		test("should throw for non-existent message", async () => {
			expect(
				caller1.message.getById({ id: "non-existent-id" }),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("update", () => {
		test("should update own message", async () => {
			const message = await caller1.message.create({
				roomId: testRoom.id,
				content: "Original content",
			});

			const updated = await caller1.message.update({
				id: message!.id,
				content: "Updated content",
			});

			expect(updated!.content).toBe("Updated content");
		});

		test("should fail to update another user's message", async () => {
			const message = await caller1.message.create({
				roomId: testRoom.id,
				content: "User 1 message",
			});

			expect(
				caller2.message.update({
					id: message!.id,
					content: "Hacked content",
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("delete", () => {
		test("should delete own message", async () => {
			const message = await caller1.message.create({
				roomId: testRoom.id,
				content: "To be deleted",
			});

			const result = await caller1.message.delete({ id: message!.id });
			expect(result.success).toBe(true);

			// Verify message is deleted
			const deleted = await db
				.select()
				.from(messages)
				.where(eq(messages.id, message!.id));
			expect(deleted.length).toBe(0);
		});

		test("should fail to delete another user's message", async () => {
			const message = await caller1.message.create({
				roomId: testRoom.id,
				content: "Protected message",
			});

			expect(caller2.message.delete({ id: message!.id })).rejects.toThrow(
				TRPCError,
			);
		});
	});
});
