import { z } from "zod";

export const messageIdSchema = z.object({
	id: z.string(),
});

export const getMessagesSchema = z.object({
	roomId: z.string(),
	cursor: z.string().optional(),
	limit: z.number().min(1).max(100).default(50),
});

export const createMessageSchema = z.object({
	roomId: z.string(),
	content: z.string().min(1).max(2000),
});

export const updateMessageSchema = z.object({
	id: z.string(),
	content: z.string().min(1).max(2000),
});

export type MessageId = z.infer<typeof messageIdSchema>;
export type GetMessages = z.infer<typeof getMessagesSchema>;
export type CreateMessage = z.infer<typeof createMessageSchema>;
export type UpdateMessage = z.infer<typeof updateMessageSchema>;
