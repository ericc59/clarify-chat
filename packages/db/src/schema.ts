import { createId } from "@paralleldrive/cuid2";
import {
	boolean,
	index,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => createId()),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const session = pgTable(
	"session",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
		index("session_user_id_idx").on(table.userId),
		index("session_expires_at_idx").on(table.expiresAt),
	],
);

export const account = pgTable(
	"account",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at", {
			withTimezone: true,
		}),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
			withTimezone: true,
		}),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("account_user_id_idx").on(table.userId),
		uniqueIndex("account_provider_account_idx").on(
			table.providerId,
			table.accountId,
		),
	],
);

export const verification = pgTable(
	"verification",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("verification_identifier_idx").on(table.identifier),
		index("verification_expires_at_idx").on(table.expiresAt),
	],
);

export const rooms = pgTable(
	"rooms",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		name: text("name").notNull(),
		description: text("description"),
		isPublic: boolean("is_public").notNull().default(true),
		createdById: text("created_by_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("rooms_created_by_id_idx").on(table.createdById),
		index("rooms_created_at_idx").on(table.createdAt),
		index("rooms_is_public_idx").on(table.isPublic),
	],
);

export const messages = pgTable(
	"messages",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		content: text("content").notNull(),
		roomId: text("room_id")
			.notNull()
			.references(() => rooms.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow(),
	},
	(table) => [
		index("messages_room_id_idx").on(table.roomId),
		index("messages_user_id_idx").on(table.userId),
		index("messages_room_id_created_at_idx").on(table.roomId, table.createdAt),
	],
);

export const roomMembers = pgTable(
	"room_members",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		roomId: text("room_id")
			.notNull()
			.references(() => rooms.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
	},
	(table) => [
		index("room_members_room_id_idx").on(table.roomId),
		index("room_members_user_id_idx").on(table.userId),
		uniqueIndex("room_members_room_user_idx").on(table.roomId, table.userId),
	],
);
