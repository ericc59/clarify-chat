import { z } from "zod";

export const roomIdSchema = z.object({
	id: z.string(),
});

export const roomIdParamSchema = z.object({
	roomId: z.string(),
});

export const createRoomSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().max(500).optional(),
	isPublic: z.boolean().default(true),
});

export const updateRoomSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(100).optional(),
	description: z.string().max(500).optional(),
	isPublic: z.boolean().optional(),
});

export const roomMemberSchema = z.object({
	roomId: z.string(),
	userId: z.string(),
});

export type RoomId = z.infer<typeof roomIdSchema>;
export type RoomIdParam = z.infer<typeof roomIdParamSchema>;
export type CreateRoom = z.infer<typeof createRoomSchema>;
export type UpdateRoom = z.infer<typeof updateRoomSchema>;
export type RoomMember = z.infer<typeof roomMemberSchema>;
