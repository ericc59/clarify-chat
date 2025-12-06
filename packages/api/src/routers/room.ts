import { observable } from "@trpc/server/observable";
import { z } from "zod";
import { ee, type RoomEvent, type RoomListEvent } from "../events.js";
import { RoomService } from "../services/room.js";
import { createTRPCRouter, protectedProcedure } from "../trpc.js";
import {
	createRoomSchema,
	roomIdParamSchema,
	roomIdSchema,
	roomMemberSchema,
	updateRoomSchema,
} from "../validators/room.js";

export const roomRouter = createTRPCRouter({
	list: protectedProcedure.query(({ ctx }) => {
		return RoomService.listUserRooms(ctx.db, ctx.session.user.id);
	}),

	listPublic: protectedProcedure.query(({ ctx }) => {
		return RoomService.listPublicRooms(ctx.db, ctx.session.user.id);
	}),

	getById: protectedProcedure.input(roomIdSchema).query(({ ctx, input }) => {
		return RoomService.getById(ctx.db, input.id);
	}),

	create: protectedProcedure
		.input(createRoomSchema)
		.mutation(({ ctx, input }) => {
			return RoomService.create(ctx.db, input, ctx.session.user);
		}),

	update: protectedProcedure
		.input(updateRoomSchema)
		.mutation(({ ctx, input }) => {
			return RoomService.update(ctx.db, input, ctx.session.user);
		}),
	delete: protectedProcedure.input(roomIdSchema).mutation(({ ctx, input }) => {
		return RoomService.delete(ctx.db, { id: input.id }, ctx.session.user);
	}),

	join: protectedProcedure
		.input(roomIdParamSchema)
		.mutation(({ ctx, input }) => {
			return RoomService.join(ctx.db, input, ctx.session.user);
		}),

	leave: protectedProcedure
		.input(roomIdParamSchema)
		.mutation(({ ctx, input }) => {
			return RoomService.leave(ctx.db, input, ctx.session.user);
		}),

	getMembers: protectedProcedure
		.input(roomIdParamSchema)
		.query(({ ctx, input }) => {
			return RoomService.getMembers(ctx.db, input);
		}),

	addMember: protectedProcedure
		.input(roomMemberSchema)
		.mutation(({ ctx, input }) => {
			return RoomService.addMember(ctx.db, input, ctx.session.user);
		}),

	removeMember: protectedProcedure
		.input(roomMemberSchema)
		.mutation(({ ctx, input }) => {
			return RoomService.removeMember(ctx.db, {
				roomId: input.roomId,
				userId: input.userId,
				requesterId: ctx.session.user.id,
			});
		}),

	// Subscriptions remain in the router as they are TRPC-specific
	onRoomEvent: protectedProcedure
		.input(z.object({ roomId: z.string() }))
		.subscription(({ input }) => {
			return observable<RoomEvent>((emit) => {
				const unsubscribe = ee.onRoom(input.roomId, (event) => {
					emit.next(event);
				});

				return () => {
					unsubscribe();
				};
			});
		}),

	onRoomListChange: protectedProcedure.subscription(() => {
		return observable<RoomListEvent>((emit) => {
			const unsubscribe = ee.onRoomList((event) => {
				emit.next(event);
			});

			return () => {
				unsubscribe();
			};
		});
	}),
});
