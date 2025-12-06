import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { TRPCError } from "@trpc/server";
import { db } from "@workspace/db/client";
import { messages } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { MessageService } from "../../services/message.js";
import { RoomService } from "../../services/room.js";
import type { SessionUser } from "../../validators/session.js";
import { cleanupAllTestData, createTestUser } from "../helpers.js";

describe("MessageService", () => {
	let testUser1: Awaited<ReturnType<typeof createTestUser>>;
	let testUser2: Awaited<ReturnType<typeof createTestUser>>;
	let sessionUser1: SessionUser;
	let sessionUser2: SessionUser;
	let testRoomId: string;

	beforeAll(async () => {
		testUser1 = await createTestUser({ name: "Message Service Test User 1" });
		testUser2 = await createTestUser({ name: "Message Service Test User 2" });

		sessionUser1 = {
			id: testUser1.id,
			name: testUser1.name,
			image: testUser1.image,
			email: testUser1.email,
		};
		sessionUser2 = {
			id: testUser2.id,
			name: testUser2.name,
			image: testUser2.image,
			email: testUser2.email,
		};

		// Create a test room for messages
		const room = await RoomService.create(
			db,
			{ name: "Message Test Room", isPublic: true },
			sessionUser1,
		);
		testRoomId = room!.id;

		// Add user2 to the room
		await RoomService.join(db, { roomId: testRoomId }, sessionUser2);
	});

	afterAll(async () => {
		await cleanupAllTestData(testUser1.id);
		await cleanupAllTestData(testUser2.id);
	});

	describe("create", () => {
		test("should create a message", async () => {
			const message = await MessageService.create(
				db,
				{ roomId: testRoomId, content: "Hello from service test!" },
				sessionUser1,
			);

			expect(message).toBeDefined();
			expect(message!.content).toBe("Hello from service test!");
			expect(message!.roomId).toBe(testRoomId);
			expect(message!.userId).toBe(testUser1.id);
		});

		test("should create multiple messages from different users", async () => {
			const message1 = await MessageService.create(
				db,
				{ roomId: testRoomId, content: "Message from user 1" },
				sessionUser1,
			);

			const message2 = await MessageService.create(
				db,
				{ roomId: testRoomId, content: "Message from user 2" },
				sessionUser2,
			);

			expect(message1!.userId).toBe(testUser1.id);
			expect(message2!.userId).toBe(testUser2.id);
		});
	});

	describe("getById", () => {
		test("should get message by id", async () => {
			const created = await MessageService.create(
				db,
				{ roomId: testRoomId, content: "GetById test message" },
				sessionUser1,
			);

			const message = await MessageService.getById(db, created!.id);

			expect(message.id).toBe(created!.id);
			expect(message.content).toBe("GetById test message");
			expect(message.user.id).toBe(testUser1.id);
			expect(message.user.name).toBe(testUser1.name);
		});

		test("should throw NOT_FOUND for non-existent message", async () => {
			try {
				await MessageService.getById(db, "non-existent-message-id");
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(TRPCError);
				expect((error as TRPCError).code).toBe("NOT_FOUND");
			}
		});
	});

	describe("list", () => {
		test("should list messages in a room", async () => {
			// Create some messages
			await MessageService.create(
				db,
				{ roomId: testRoomId, content: "List test 1" },
				sessionUser1,
			);
			await MessageService.create(
				db,
				{ roomId: testRoomId, content: "List test 2" },
				sessionUser2,
			);

			const result = await MessageService.list(db, {
				roomId: testRoomId,
				limit: 10,
			});

			expect(result.items.length).toBeGreaterThanOrEqual(2);
			expect(result.items[0]!.user).toBeDefined();
		});

		test("should support cursor-based pagination", async () => {
			// Create multiple messages
			for (let i = 0; i < 5; i++) {
				await MessageService.create(
					db,
					{ roomId: testRoomId, content: `Pagination test ${i}` },
					sessionUser1,
				);
			}

			const firstPage = await MessageService.list(db, {
				roomId: testRoomId,
				limit: 2,
			});

			expect(firstPage.items.length).toBe(2);

			if (firstPage.nextCursor) {
				const secondPage = await MessageService.list(db, {
					roomId: testRoomId,
					limit: 2,
					cursor: firstPage.nextCursor,
				});

				expect(secondPage.items.length).toBeGreaterThan(0);
				// Messages should be different
				expect(secondPage.items[0]!.id).not.toBe(firstPage.items[0]!.id);
			}
		});

		test("should return nextCursor when more items exist", async () => {
			const result = await MessageService.list(db, {
				roomId: testRoomId,
				limit: 1,
			});

			// If there are more messages, nextCursor should be defined
			if (result.items.length === 1) {
				// Check if more messages exist
				const allMessages = await db
					.select()
					.from(messages)
					.where(eq(messages.roomId, testRoomId));

				if (allMessages.length > 1) {
					expect(result.nextCursor).toBeDefined();
				}
			}
		});
	});

	describe("update", () => {
		test("should update message as owner", async () => {
			const message = await MessageService.create(
				db,
				{ roomId: testRoomId, content: "Original content" },
				sessionUser1,
			);

			const updated = await MessageService.update(
				db,
				{ id: message!.id, content: "Updated content" },
				sessionUser1,
			);

			expect(updated!.content).toBe("Updated content");
			expect(updated!.id).toBe(message!.id);
		});

		test("should throw FORBIDDEN when non-owner tries to update", async () => {
			const message = await MessageService.create(
				db,
				{ roomId: testRoomId, content: "Owner only content" },
				sessionUser1,
			);

			try {
				await MessageService.update(
					db,
					{ id: message!.id, content: "Hacked content" },
					sessionUser2,
				);
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(TRPCError);
				expect((error as TRPCError).code).toBe("FORBIDDEN");
			}
		});

		test("should throw NOT_FOUND for non-existent message", async () => {
			try {
				await MessageService.update(
					db,
					{ id: "non-existent-id", content: "New content" },
					sessionUser1,
				);
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(TRPCError);
				expect((error as TRPCError).code).toBe("NOT_FOUND");
			}
		});
	});

	describe("delete", () => {
		test("should delete message as owner", async () => {
			const message = await MessageService.create(
				db,
				{ roomId: testRoomId, content: "To be deleted" },
				sessionUser1,
			);

			const result = await MessageService.delete(
				db,
				{ id: message!.id },
				sessionUser1,
			);

			expect(result.success).toBe(true);

			// Verify message is deleted
			const deleted = await db
				.select()
				.from(messages)
				.where(eq(messages.id, message!.id));
			expect(deleted.length).toBe(0);
		});

		test("should throw FORBIDDEN when non-owner tries to delete", async () => {
			const message = await MessageService.create(
				db,
				{ roomId: testRoomId, content: "Protected content" },
				sessionUser1,
			);

			try {
				await MessageService.delete(db, { id: message!.id }, sessionUser2);
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(TRPCError);
				expect((error as TRPCError).code).toBe("FORBIDDEN");
			}
		});

		test("should throw NOT_FOUND for non-existent message", async () => {
			try {
				await MessageService.delete(
					db,
					{ id: "non-existent-id" },
					sessionUser1,
				);
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(TRPCError);
				expect((error as TRPCError).code).toBe("NOT_FOUND");
			}
		});
	});
});
