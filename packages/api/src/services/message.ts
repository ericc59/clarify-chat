import { TRPCError } from "@trpc/server";
import type { Database } from "@workspace/db/client";
import { messages, user } from "@workspace/db/schema";
import { and, desc, eq, lt } from "drizzle-orm";
import { ee } from "../events.js";
import type {
	CreateMessage,
	MessageId,
	UpdateMessage,
} from "../validators/message.js";
import type { SessionUser } from "../validators/session.js";

// Message with user info
const messageWithUserSelect = {
	id: messages.id,
	content: messages.content,
	roomId: messages.roomId,
	userId: messages.userId,
	createdAt: messages.createdAt,
	updatedAt: messages.updatedAt,
	user: {
		id: user.id,
		name: user.name,
		image: user.image,
	},
} as const;

export const MessageService = {
	/**
	 * List messages in a room with cursor-based pagination
	 */
	async list(
		db: Database,
		params: { roomId: string; cursor?: string; limit: number },
	) {
		const conditions = [eq(messages.roomId, params.roomId)];

		if (params.cursor) {
			conditions.push(lt(messages.id, params.cursor));
		}

		const items = await db
			.select(messageWithUserSelect)
			.from(messages)
			.innerJoin(user, eq(messages.userId, user.id))
			.where(and(...conditions))
			.orderBy(desc(messages.createdAt))
			.limit(params.limit + 1);

		let nextCursor: string | undefined;
		if (items.length > params.limit) {
			const nextItem = items.pop();
			nextCursor = nextItem?.id;
		}

		return {
			items,
			nextCursor,
		};
	},

	/**
	 * Get a message by ID
	 */
	async getById(db: Database, messageId: string) {
		const [result] = await db
			.select(messageWithUserSelect)
			.from(messages)
			.innerJoin(user, eq(messages.userId, user.id))
			.where(eq(messages.id, messageId))
			.limit(1);

		if (!result) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Message not found",
			});
		}

		return result;
	},

	/**
	 * Create a new message
	 */
	async create(db: Database, data: CreateMessage, user: SessionUser) {
		const [message] = await db
			.insert(messages)
			.values({
				roomId: data.roomId,
				userId: user.id,
				content: data.content,
			})
			.returning();

		if (message) {
			// Emit real-time event
			ee.emitMessage({
				type: "new",
				roomId: data.roomId,
				message: {
					...message,
					user: {
						id: user.id,
						name: user.name,
						image: user.image ?? null,
					},
				},
			});
		}

		return message;
	},

	/**
	 * Update a message (only owner can update)
	 */
	async update(db: Database, data: UpdateMessage, user: SessionUser) {
		const [existingMessage] = await db
			.select()
			.from(messages)
			.where(eq(messages.id, data.id))
			.limit(1);

		if (!existingMessage) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Message not found",
			});
		}

		if (existingMessage.userId !== user.id) {
			throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
		}

		const [updated] = await db
			.update(messages)
			.set({
				content: data.content ?? existingMessage.content,
				updatedAt: new Date(),
			})
			.where(eq(messages.id, data.id))
			.returning();

		if (updated) {
			// Emit real-time event
			ee.emitMessage({
				type: "updated",
				roomId: existingMessage.roomId,
				message: {
					...updated,
					user: {
						id: user.id,
						name: user.name,
						image: user.image ?? null,
					},
				},
			});
		}

		return updated;
	},

	/**
	 * Delete a message (only owner can delete)
	 */
	async delete(db: Database, data: MessageId, user: SessionUser) {
		const [message] = await db
			.select()
			.from(messages)
			.where(eq(messages.id, data.id))
			.limit(1);

		if (!message) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Message not found",
			});
		}

		if (message.userId !== user.id) {
			throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
		}

		await db.delete(messages).where(eq(messages.id, data.id));

		// Emit real-time event
		ee.emitMessage({
			type: "deleted",
			roomId: message.roomId,
			message: {
				...message,
				user: {
					id: user.id,
					name: user.name,
					image: user.image ?? null,
				},
			},
		});

		return { success: true };
	},
};
