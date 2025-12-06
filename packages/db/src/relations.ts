import { relations } from "drizzle-orm";
import { account, messages, roomMembers, rooms, user } from "./schema.js";

export const userRelations = relations(user, ({ many }) => ({
	accounts: many(account),
	messages: many(messages),
	roomMembers: many(roomMembers),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const messageRelations = relations(messages, ({ one }) => ({
	user: one(user, {
		fields: [messages.userId],
		references: [user.id],
	}),

	room: one(rooms, {
		fields: [messages.roomId],
		references: [rooms.id],
	}),
}));

export const roomMemberRelations = relations(roomMembers, ({ one }) => ({
	user: one(user, {
		fields: [roomMembers.userId],
		references: [user.id],
	}),

	room: one(rooms, {
		fields: [roomMembers.roomId],
		references: [rooms.id],
	}),
}));

export const roomRelations = relations(rooms, ({ many, one }) => ({
	members: many(roomMembers),
	messages: many(messages),

	createdByUser: one(user, {
		fields: [rooms.createdById],
		references: [user.id],
	}),
}));
