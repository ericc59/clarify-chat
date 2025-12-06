import { z } from "zod";

export const userIdSchema = z.object({
	id: z.string(),
});

export const updateProfileSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	image: z.string().url().optional().nullable(),
});

export const searchUsersSchema = z.object({
	query: z.string().min(1).max(100),
	limit: z.number().min(1).max(50).default(10),
});

export type UserId = z.infer<typeof userIdSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type SearchUsers = z.infer<typeof searchUsersSchema>;
