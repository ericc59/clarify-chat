import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { TRPCError } from "@trpc/server";
import { db } from "@workspace/db/client";
import { roomMembers, rooms } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { RoomService } from "../../services/room.js";
import type { SessionUser } from "../../validators/session.js";
import {
	cleanupAllTestData,
	createTestId,
	createTestUser,
} from "../helpers.js";

describe("RoomService", () => {
	let testUser1: Awaited<ReturnType<typeof createTestUser>>;
	let testUser2: Awaited<ReturnType<typeof createTestUser>>;
	let sessionUser1: SessionUser;
	let sessionUser2: SessionUser;

	beforeAll(async () => {
		testUser1 = await createTestUser({ name: "Room Service Test User 1" });
		testUser2 = await createTestUser({ name: "Room Service Test User 2" });

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
	});

	afterAll(async () => {
		await cleanupAllTestData(testUser1.id);
		await cleanupAllTestData(testUser2.id);
	});

	describe("create", () => {
		test("should create a room and add creator as member", async () => {
			const room = await RoomService.create(
				db,
				{
					name: "Service Test Room",
					description: "Test description",
					isPublic: true,
				},
				sessionUser1,
			);

			expect(room).toBeDefined();
			expect(room!.name).toBe("Service Test Room");
			expect(room!.description).toBe("Test description");
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
			const room = await RoomService.create(
				db,
				{ name: "Private Service Room", isPublic: false },
				sessionUser1,
			);

			expect(room!.isPublic).toBe(false);
		});
	});

	describe("getById", () => {
		test("should get room by id", async () => {
			const created = await RoomService.create(
				db,
				{ name: "GetById Test Room", isPublic: true },
				sessionUser1,
			);

			const room = await RoomService.getById(db, created!.id);

			expect(room.id).toBe(created!.id);
			expect(room.name).toBe("GetById Test Room");
		});

		test("should throw NOT_FOUND for non-existent room", async () => {
			try {
				await RoomService.getById(db, "non-existent-id");
				expect(true).toBe(false); // Should not reach here
			} catch (error) {
				expect(error).toBeInstanceOf(TRPCError);
				expect((error as TRPCError).code).toBe("NOT_FOUND");
			}
		});
	});

	describe("listUserRooms", () => {
		test("should list rooms user is a member of", async () => {
			const room = await RoomService.create(
				db,
				{ name: "List User Rooms Test", isPublic: true },
				sessionUser1,
			);

			const userRooms = await RoomService.listUserRooms(db, testUser1.id);
			const found = userRooms.find((r) => r.id === room!.id);

			expect(found).toBeDefined();
			expect(found?.name).toBe("List User Rooms Test");
		});

		test("should not list rooms user is not a member of", async () => {
			const room = await RoomService.create(
				db,
				{ name: "User1 Only Room Service", isPublic: false },
				sessionUser1,
			);

			const user2Rooms = await RoomService.listUserRooms(db, testUser2.id);
			const found = user2Rooms.find((r) => r.id === room!.id);

			expect(found).toBeUndefined();
		});
	});

	describe("listPublicRooms", () => {
		test("should list public rooms user can join", async () => {
			const room = await RoomService.create(
				db,
				{ name: "Public For Others Service", isPublic: true },
				sessionUser1,
			);

			const publicRooms = await RoomService.listPublicRooms(db, testUser2.id);
			const found = publicRooms.find((r) => r.id === room!.id);

			expect(found).toBeDefined();
		});

		test("should not list private rooms", async () => {
			const room = await RoomService.create(
				db,
				{ name: "Private Not Listed Service", isPublic: false },
				sessionUser1,
			);

			const publicRooms = await RoomService.listPublicRooms(db, testUser2.id);
			const found = publicRooms.find((r) => r.id === room!.id);

			expect(found).toBeUndefined();
		});

		test("should not list rooms user is already a member of", async () => {
			const room = await RoomService.create(
				db,
				{ name: "Already Member Service", isPublic: true },
				sessionUser1,
			);

			const publicRooms = await RoomService.listPublicRooms(db, testUser1.id);
			const found = publicRooms.find((r) => r.id === room!.id);

			expect(found).toBeUndefined();
		});
	});

	describe("update", () => {
		test("should update room as owner", async () => {
			const room = await RoomService.create(
				db,
				{ name: "Original Service Name", isPublic: true },
				sessionUser1,
			);

			const updated = await RoomService.update(
				db,
				{ id: room!.id, name: "Updated Service Name", description: "New desc" },
				sessionUser1,
			);

			expect(updated!.name).toBe("Updated Service Name");
			expect(updated!.description).toBe("New desc");
		});

		test("should throw FORBIDDEN when non-owner tries to update", async () => {
			const room = await RoomService.create(
				db,
				{ name: "Owner Only Service Update", isPublic: true },
				sessionUser1,
			);

			try {
				await RoomService.update(
					db,
					{ id: room!.id, name: "Hacked" },
					sessionUser2,
				);
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(TRPCError);
				expect((error as TRPCError).code).toBe("FORBIDDEN");
			}
		});
	});

	describe("delete", () => {
		test("should delete room as owner", async () => {
			const room = await RoomService.create(
				db,
				{ name: "To Be Deleted Service", isPublic: true },
				sessionUser1,
			);

			const result = await RoomService.delete(
				db,
				{ id: room!.id },
				sessionUser1,
			);
			expect(result.success).toBe(true);

			const deleted = await db
				.select()
				.from(rooms)
				.where(eq(rooms.id, room!.id));
			expect(deleted.length).toBe(0);
		});

		test("should throw FORBIDDEN when non-owner tries to delete", async () => {
			const room = await RoomService.create(
				db,
				{ name: "Protected Service Room", isPublic: true },
				sessionUser1,
			);

			try {
				await RoomService.delete(db, { id: room!.id }, sessionUser2);
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(TRPCError);
				expect((error as TRPCError).code).toBe("FORBIDDEN");
			}
		});
	});

	describe("join", () => {
		test("should join a public room", async () => {
			const room = await RoomService.create(
				db,
				{ name: "Joinable Service Room", isPublic: true },
				sessionUser1,
			);

			const result = await RoomService.join(
				db,
				{ roomId: room!.id },
				sessionUser2,
			);
			expect(result.alreadyMember).toBe(false);

			const members = await db
				.select()
				.from(roomMembers)
				.where(eq(roomMembers.roomId, room!.id));
			expect(members.length).toBe(2);
		});

		test("should throw FORBIDDEN when joining private room", async () => {
			const room = await RoomService.create(
				db,
				{ name: "Private No Join Service", isPublic: false },
				sessionUser1,
			);

			try {
				await RoomService.join(db, { roomId: room!.id }, sessionUser2);
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(TRPCError);
				expect((error as TRPCError).code).toBe("FORBIDDEN");
			}
		});

		test("should return alreadyMember if already a member", async () => {
			const room = await RoomService.create(
				db,
				{ name: "Already Member Join Test", isPublic: true },
				sessionUser1,
			);

			await RoomService.join(db, { roomId: room!.id }, sessionUser2);
			const result = await RoomService.join(
				db,
				{ roomId: room!.id },
				sessionUser2,
			);

			expect(result.alreadyMember).toBe(true);
		});
	});

	describe("leave", () => {
		test("should leave a room", async () => {
			const room = await RoomService.create(
				db,
				{ name: "Leave Service Test", isPublic: true },
				sessionUser1,
			);

			await RoomService.join(db, { roomId: room!.id }, sessionUser2);
			const result = await RoomService.leave(
				db,
				{ roomId: room!.id },
				sessionUser2,
			);

			expect(result.success).toBe(true);

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
			const room = await RoomService.create(
				db,
				{ name: "Members Service Test", isPublic: true },
				sessionUser1,
			);

			await RoomService.join(db, { roomId: room!.id }, sessionUser2);

			const members = await RoomService.getMembers(db, { roomId: room!.id });

			expect(members.length).toBe(2);
			expect(members.map((m) => m.id)).toContain(testUser1.id);
			expect(members.map((m) => m.id)).toContain(testUser2.id);
		});
	});

	describe("addMember", () => {
		test("should add member as owner", async () => {
			const room = await RoomService.create(
				db,
				{ name: "Add Member Service Test", isPublic: false },
				sessionUser1,
			);

			const result = await RoomService.addMember(
				db,
				{ roomId: room!.id, userId: testUser2.id },
				sessionUser1,
			);

			expect(result.alreadyMember).toBe(false);

			const members = await db
				.select()
				.from(roomMembers)
				.where(eq(roomMembers.roomId, room!.id));
			expect(members.length).toBe(2);
		});

		test("should throw FORBIDDEN when non-owner tries to add member", async () => {
			// Create a third user for this test
			const testUser3 = await createTestUser({
				name: "Room Service Test User 3",
			});

			const room = await RoomService.create(
				db,
				{ name: "Add Member Auth Test", isPublic: true },
				sessionUser1,
			);

			await RoomService.join(db, { roomId: room!.id }, sessionUser2);

			try {
				await RoomService.addMember(
					db,
					{ roomId: room!.id, userId: testUser3.id },
					sessionUser2,
				);
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(TRPCError);
				expect((error as TRPCError).code).toBe("FORBIDDEN");
			}

			await cleanupAllTestData(testUser3.id);
		});
	});

	describe("removeMember", () => {
		test("should remove member as owner", async () => {
			const room = await RoomService.create(
				db,
				{ name: "Remove Member Service Test", isPublic: true },
				sessionUser1,
			);

			await RoomService.join(db, { roomId: room!.id }, sessionUser2);

			const result = await RoomService.removeMember(db, {
				roomId: room!.id,
				userId: testUser2.id,
				requesterId: testUser1.id,
			});

			expect(result.success).toBe(true);

			const members = await db
				.select()
				.from(roomMembers)
				.where(eq(roomMembers.roomId, room!.id));
			expect(members.length).toBe(1);
		});

		test("should throw FORBIDDEN when non-owner tries to remove", async () => {
			const room = await RoomService.create(
				db,
				{ name: "Remove Member Auth Test", isPublic: true },
				sessionUser1,
			);

			await RoomService.join(db, { roomId: room!.id }, sessionUser2);

			try {
				await RoomService.removeMember(db, {
					roomId: room!.id,
					userId: testUser1.id,
					requesterId: testUser2.id,
				});
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(TRPCError);
				expect((error as TRPCError).code).toBe("FORBIDDEN");
			}
		});

		test("should throw BAD_REQUEST when trying to remove owner", async () => {
			const room = await RoomService.create(
				db,
				{ name: "Remove Owner Test", isPublic: true },
				sessionUser1,
			);

			try {
				await RoomService.removeMember(db, {
					roomId: room!.id,
					userId: testUser1.id,
					requesterId: testUser1.id,
				});
				expect(true).toBe(false);
			} catch (error) {
				expect(error).toBeInstanceOf(TRPCError);
				expect((error as TRPCError).code).toBe("BAD_REQUEST");
			}
		});
	});
});
