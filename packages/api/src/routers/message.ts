import { observable } from "@trpc/server/observable";
import { z } from "zod";
import { ee, type MessageEvent } from "../events.js";
import { MessageService } from "../services/message.js";
import { createTRPCRouter, protectedProcedure } from "../trpc.js";
import {
	createMessageSchema,
	getMessagesSchema,
	messageIdSchema,
	updateMessageSchema,
} from "../validators/message.js";

export const messageRouter = createTRPCRouter({
	list: protectedProcedure.input(getMessagesSchema).query(({ ctx, input }) => {
		return MessageService.list(ctx.db, {
			roomId: input.roomId,
			cursor: input.cursor,
			limit: input.limit,
		});
	}),

	getById: protectedProcedure.input(messageIdSchema).query(({ ctx, input }) => {
		return MessageService.getById(ctx.db, input.id);
	}),

	create: protectedProcedure
		.input(createMessageSchema)
		.mutation(({ ctx, input }) => {
			return MessageService.create(ctx.db, input, ctx.session.user);
		}),

	update: protectedProcedure
		.input(updateMessageSchema)
		.mutation(({ ctx, input }) => {
			return MessageService.update(ctx.db, input, ctx.session.user);
		}),

	delete: protectedProcedure
		.input(messageIdSchema)
		.mutation(({ ctx, input }) => {
			return MessageService.delete(ctx.db, input, ctx.session.user);
		}),

	// Subscription remains in the router as it's TRPC-specific
	onMessage: protectedProcedure
		.input(z.object({ roomId: z.string() }))
		.subscription(({ input }) => {
			return observable<MessageEvent>((emit) => {
				const unsubscribe = ee.onMessage(input.roomId, (event) => {
					emit.next(event);
				});

				return () => {
					unsubscribe();
				};
			});
		}),
});
