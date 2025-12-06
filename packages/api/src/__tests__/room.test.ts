import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { TRPCError } from "@trpc/server";
import { db } from "@workspace/db/client";
import { roomMembers, rooms } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import {
	cleanupAllTestData,
	createTestCaller,
	createTestSession,
	createTestUser,
} from "./helpers.js";

describe("room router", () => {
	let testUser1: Awaited<ReturnType<typeof createTestUser>>;
	let testUser2: Awaited<ReturnType<typeof createTestUser>>;
	let caller1: ReturnType<typeof createTestCaller>;
	let caller2: ReturnType<typeof createTestCaller>;
	let unauthenticatedCaller: ReturnType<typeof createTestCaller>;

	beforeAll(async () => {
		// Create test users
		testUser1 = await createTestUser({ name: "Room Test User 1" });
		testUser2 = await createTestUser({ name: "Room Test User 2" });

		// Create callers
		caller1 = createTestCaller(createTestSession(testUser1));
		caller2 = createTestCaller(createTestSession(testUser2));
		unauthenticatedCaller = createTestCaller(null);
	});

	afterAll(async () => {
		// Cleanup test data
		await cleanupAllTestData(testUser1.id);
		await cleanupAllTestData(testUser2.id);
	});

	describe("create", () => {
		test("should create a public room", async () => {
			const room = await caller1.room.create({
				name: "Test Public Room",
				description: "A test room",
				isPublic: true,
			});

			expect(room).toBeDefined();
			expect(room!.name).toBe("Test Public Room");
			expect(room!.description).toBe("A test room");
			expect(room!.isPublic).toBe(true);
			expect(room!.createdById).toBe(testUser1.id);

			// Verify creator is a member
			const members = await db
				.select()
				.from(roomMembers)
				.where(eq(roomMembers.roomId, room!.id));
			expect(members.length).toBe(1);
			expect(members[0]!.userId).toBe(testUser1.id);
		});

		test("should create a private room", async () => {
			const room = await caller1.room.create({
				name: "Test Private Room",
				isPublic: false,
			});

			expect(room!.isPublic).toBe(false);
		});

		test("should fail when unauthenticated", async () => {
			expect(
				unauthenticatedCaller.room.create({
					name: "Should Fail",
					isPublic: true,
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("list", () => {
		test("should list rooms user is a member of", async () => {
			// Create a room for user1
			const room = await caller1.room.create({
				name: "List Test Room",
				isPublic: true,
			});

			const userRooms = await caller1.room.list();
			const found = userRooms.find((r) => r.id === room!.id);

			expect(found).toBeDefined();
			expect(found?.name).toBe("List Test Room");
		});

		test("should not list rooms user is not a member of", async () => {
			// Create a room for user1
			const room = await caller1.room.create({
				name: "User1 Only Room",
				isPublic: false,
			});

			// User2 should not see it
			const user2Rooms = await caller2.room.list();
			const found = user2Rooms.find((r) => r.id === room!.id);

			expect(found).toBeUndefined();
		});
	});

	describe("listPublic", () => {
		test("should list public rooms user can join", async () => {
			// Create a public room for user1
			const room = await caller1.room.create({
				name: "Public Room For Others",
				isPublic: true,
			});

			// User2 should see it in public rooms
			const publicRooms = await caller2.room.listPublic();
			const found = publicRooms.find((r) => r.id === room!.id);

			expect(found).toBeDefined();
		});

		test("should not list private rooms", async () => {
			const room = await caller1.room.create({
				name: "Private Room Not Listed",
				isPublic: false,
			});

			const publicRooms = await caller2.room.listPublic();
			const found = publicRooms.find((r) => r.id === room!.id);

			expect(found).toBeUndefined();
		});

		test("should not list rooms user is already a member of", async () => {
			const room = await caller1.room.create({
				name: "Already Member Room",
				isPublic: true,
			});

			// User1's public rooms shouldn't include their own room
			const publicRooms = await caller1.room.listPublic();
			const found = publicRooms.find((r) => r.id === room!.id);

			expect(found).toBeUndefined();
		});
	});

	describe("getById", () => {
		test("should get room by id", async () => {
			const created = await caller1.room.create({
				name: "Get By ID Room",
				isPublic: true,
			});

			const room = await caller1.room.getById({ id: created!.id });

			expect(room!.id).toBe(created!.id);
			expect(room!.name).toBe("Get By ID Room");
		});

		test("should throw for non-existent room", async () => {
			expect(caller1.room.getById({ id: "non-existent-id" })).rejects.toThrow(
				TRPCError,
			);
		});
	});

	describe("update", () => {
		test("should update room as owner", async () => {
			const room = await caller1.room.create({
				name: "Original Name",
				isPublic: true,
			});

			const updated = await caller1.room.update({
				id: room!.id,
				name: "Updated Name",
				description: "New description",
			});

			expect(updated!.name).toBe("Updated Name");
			expect(updated!.description).toBe("New description");
		});

		test("should fail to update room as non-owner", async () => {
			const room = await caller1.room.create({
				name: "Owner Only Update",
				isPublic: true,
			});

			expect(
				caller2.room.update({
					id: room!.id,
					name: "Hacked Name",
				}),
			).rejects.toThrow(TRPCError);
		});
	});

	describe("delete", () => {
		test("should delete room as owner", async () => {
			const room = await caller1.room.create({
				name: "To Be Deleted",
				isPublic: true,
			});

			const result = await caller1.room.delete({ id: room!.id });
			expect(result.success).toBe(true);

			// Verify room is deleted
			const deleted = await db
				.select()
				.from(rooms)
				.where(eq(rooms.id, room!.id));
			expect(deleted.length).toBe(0);
		});

		test("should fail to delete room as non-owner", async () => {
			const room = await caller1.room.create({
				name: "Protected Room",
				isPublic: true,
			});

			expect(caller2.room.delete({ id: room!.id })).rejects.toThrow(TRPCError);
		});
	});

	describe("join", () => {
		test("should join a public room", async () => {
			const room = await caller1.room.create({
				name: "Joinable Room",
				isPublic: true,
			});

			const result = await caller2.room.join({ roomId: room!.id });
			expect(result.alreadyMember).toBe(false);

			// Verify membership
			const members = await db
				.select()
				.from(roomMembers)
				.where(eq(roomMembers.roomId, room!.id));
			expect(members.length).toBe(2);
		});

		test("should fail to join a private room", async () => {
			const room = await caller1.room.create({
				name: "Private No Join",
				isPublic: false,
			});

			expect(caller2.room.join({ roomId: room!.id })).rejects.toThrow(
				TRPCError,
			);
		});

		test("should return alreadyMember if already a member", async () => {
			const room = await caller1.room.create({
				name: "Already Member Test",
				isPublic: true,
			});

			// Join first time
			await caller2.room.join({ roomId: room!.id });

			// Try to join again
			const result = await caller2.room.join({ roomId: room!.id });
			expect(result.alreadyMember).toBe(true);
		});
	});

	describe("leave", () => {
		test("should leave a room", async () => {
			const room = await caller1.room.create({
				name: "Leave Test Room",
				isPublic: true,
			});

			// User2 joins
			await caller2.room.join({ roomId: room!.id });

			// User2 leaves
			const result = await caller2.room.leave({ roomId: room!.id });
			expect(result.success).toBe(true);

			// Verify user2 is no longer a member
			const members = await db
				.select()
				.from(roomMembers)
				.where(eq(roomMembers.roomId, room!.id));
			expect(members.length).toBe(1);
			expect(members[0]!.userId).toBe(testUser1.id);
		});
	});

	describe("getMembers", () => {
		test("should get room members", async () => {
			const room = await caller1.room.create({
				name: "Members Test Room",
				isPublic: true,
			});

			await caller2.room.join({ roomId: room!.id });

			const members = await caller1.room.getMembers({ roomId: room!.id });

			expect(members.length).toBe(2);
			expect(members.map((m) => m.id)).toContain(testUser1.id);
			expect(members.map((m) => m.id)).toContain(testUser2.id);
		});
	});

	describe("removeMember", () => {
		test("should remove member as owner", async () => {
			const room = await caller1.room.create({
				name: "Remove Member Test",
				isPublic: true,
			});

			await caller2.room.join({ roomId: room!.id });

			const result = await caller1.room.removeMember({
				roomId: room!.id,
				userId: testUser2.id,
			});
			expect(result.success).toBe(true);

			// Verify user2 is removed
			const members = await db
				.select()
				.from(roomMembers)
				.where(eq(roomMembers.roomId, room!.id));
			expect(members.length).toBe(1);
		});

		test("should fail to remove member as non-owner", async () => {
			const room = await caller1.room.create({
				name: "Non-Owner Remove Test",
				isPublic: true,
			});

			await caller2.room.join({ roomId: room!.id });

			expect(
				caller2.room.removeMember({
					roomId: room!.id,
					userId: testUser1.id,
				}),
			).rejects.toThrow(TRPCError);
		});

		test("should fail to remove room owner", async () => {
			const room = await caller1.room.create({
				name: "Owner Remove Test",
				isPublic: true,
			});

			expect(
				caller1.room.removeMember({
					roomId: room!.id,
					userId: testUser1.id,
				}),
			).rejects.toThrow(TRPCError);
		});
	});
});
