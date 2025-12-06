import { TRPCError } from "@trpc/server";
import type { Database } from "@workspace/db/client";
import { roomMembers, rooms, user } from "@workspace/db/schema";
import { and, desc, eq, notInArray } from "drizzle-orm";
import { ee } from "../events.js";
import type {
	CreateRoom,
	RoomId,
	RoomIdParam,
	RoomMember,
	UpdateRoom,
} from "../validators/room.js";
import type { SessionUser } from "../validators/session.js";

// Common room select fields
const roomSelectFields = {
	id: rooms.id,
	name: rooms.name,
	description: rooms.description,
	isPublic: rooms.isPublic,
	createdById: rooms.createdById,
	createdAt: rooms.createdAt,
	updatedAt: rooms.updatedAt,
} as const;

export const RoomService = {
	/**
	 * List rooms that a user is a member of
	 */
	async listUserRooms(db: Database, userId: string) {
		return db
			.select(roomSelectFields)
			.from(rooms)
			.innerJoin(roomMembers, eq(rooms.id, roomMembers.roomId))
			.where(eq(roomMembers.userId, userId))
			.orderBy(desc(rooms.updatedAt));
	},

	/**
	 * List public rooms that a user can join (not already a member of)
	 */
	async listPublicRooms(db: Database, userId: string) {
		// Get rooms user is already a member of
		const memberRooms = await db
			.select({ roomId: roomMembers.roomId })
			.from(roomMembers)
			.where(eq(roomMembers.userId, userId));

		const memberRoomIds = memberRooms.map((r) => r.roomId);

		// Get public rooms not in the member list
		if (memberRoomIds.length === 0) {
			return db
				.select(roomSelectFields)
				.from(rooms)
				.where(eq(rooms.isPublic, true))
				.orderBy(desc(rooms.createdAt));
		}

		return db
			.select(roomSelectFields)
			.from(rooms)
			.where(and(eq(rooms.isPublic, true), notInArray(rooms.id, memberRoomIds)))
			.orderBy(desc(rooms.createdAt));
	},

	/**
	 * Get a room by ID
	 */
	async getById(db: Database, roomId: string) {
		const [room] = await db
			.select()
			.from(rooms)
			.where(eq(rooms.id, roomId))
			.limit(1);

		if (!room) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
		}

		return room;
	},

	/**
	 * Create a new room and add the creator as a member
	 */
	async create(db: Database, data: CreateRoom, user: SessionUser) {
		const [room] = await db
			.insert(rooms)
			.values({
				name: data.name,
				description: data.description,
				isPublic: data.isPublic,
				createdById: user.id,
			})
			.returning();

		if (room) {
			// Add creator as first member
			await db.insert(roomMembers).values({
				roomId: room.id,
				userId: user.id,
			});

			// Emit room list event for real-time updates
			ee.emitRoomList({
				type: "room_created",
				roomId: room.id,
				roomName: room.name,
				isPublic: room.isPublic,
			});
		}

		return room;
	},

	/**
	 * Update a room (only owner can update)
	 */
	async update(db: Database, data: UpdateRoom, user: SessionUser) {
		const room = await this.getById(db, data.id);

		if (room.createdById !== user.id) {
			throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
		}

		const [updated] = await db
			.update(rooms)
			.set({
				name: data.name ?? room.name,
				description: data.description ?? room.description,
				isPublic: data.isPublic ?? room.isPublic,
				updatedAt: new Date(),
			})
			.where(eq(rooms.id, data.id))
			.returning();

		return updated;
	},

	/**
	 * Delete a room (only owner can delete)
	 */
	async delete(db: Database, data: RoomId, user: SessionUser) {
		const room = await this.getById(db, data.id);

		if (room.createdById !== user.id) {
			throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
		}

		// Emit room_deleted event BEFORE deleting so subscribers can receive it
		ee.emitRoom({
			type: "room_deleted",
			roomId: data.id,
			userId: user.id,
			userName: user.name,
		});

		// Emit room list event for real-time updates
		ee.emitRoomList({
			type: "room_deleted",
			roomId: data.id,
			roomName: room.name,
			isPublic: room.isPublic,
		});

		await db.delete(rooms).where(eq(rooms.id, data.id));

		return { success: true };
	},

	/**
	 * Join a public room
	 */
	async join(db: Database, data: RoomIdParam, user: SessionUser) {
		const room = await this.getById(db, data.roomId);

		// Only allow joining public rooms
		if (!room.isPublic) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "This room is private",
			});
		}

		const [existing] = await db
			.select()
			.from(roomMembers)
			.where(
				and(
					eq(roomMembers.roomId, data.roomId),
					eq(roomMembers.userId, user.id),
				),
			)
			.limit(1);

		if (existing) {
			return { alreadyMember: true };
		}

		await db.insert(roomMembers).values({
			roomId: data.roomId,
			userId: user.id,
		});

		// Emit room event for real-time updates
		ee.emitRoom({
			type: "member_joined",
			roomId: data.roomId,
			userId: user.id,
			userName: user.name,
		});

		return { alreadyMember: false };
	},

	/**
	 * Leave a room
	 */
	async leave(db: Database, data: RoomIdParam, user: SessionUser) {
		await db
			.delete(roomMembers)
			.where(
				and(
					eq(roomMembers.roomId, data.roomId),
					eq(roomMembers.userId, user.id),
				),
			);

		// Emit room event for real-time updates
		ee.emitRoom({
			type: "member_left",
			roomId: data.roomId,
			userId: user.id,
			userName: user.name,
		});

		return { success: true };
	},

	/**
	 * Get all members of a room
	 */
	async getMembers(db: Database, data: RoomIdParam) {
		return db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				image: user.image,
			})
			.from(roomMembers)
			.innerJoin(user, eq(roomMembers.userId, user.id))
			.where(eq(roomMembers.roomId, data.roomId));
	},

	/**
	 * Add a member to a room (only owner can add)
	 */
	async addMember(db: Database, data: RoomMember, user: SessionUser) {
		const room = await this.getById(db, data.roomId);

		if (room.createdById !== user.id) {
			throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
		}

		const [existing] = await db
			.select()
			.from(roomMembers)
			.where(
				and(
					eq(roomMembers.roomId, data.roomId),
					eq(roomMembers.userId, data.userId),
				),
			)
			.limit(1);

		if (existing) {
			return { alreadyMember: true };
		}

		await db.insert(roomMembers).values({
			roomId: data.roomId,
			userId: data.userId,
		});

		return { alreadyMember: false };
	},

	/**
	 * Remove a member from a room (only owner can remove)
	 */
	async removeMember(
		db: Database,
		data: { roomId: string; userId: string; requesterId: string },
	) {
		const room = await this.getById(db, data.roomId);

		if (room.createdById !== data.requesterId) {
			throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
		}

		if (data.userId === room.createdById) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Cannot remove room owner",
			});
		}

		// Get user info before removing
		const [removedUser] = await db
			.select({ name: user.name })
			.from(user)
			.where(eq(user.id, data.userId))
			.limit(1);

		await db
			.delete(roomMembers)
			.where(
				and(
					eq(roomMembers.roomId, data.roomId),
					eq(roomMembers.userId, data.userId),
				),
			);

		// Emit room event for real-time updates
		ee.emitRoom({
			type: "member_removed",
			roomId: data.roomId,
			userId: data.userId,
			userName: removedUser?.name || "Unknown",
		});

		return { success: true };
	},
};
