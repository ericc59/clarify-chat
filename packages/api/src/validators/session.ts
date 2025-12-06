import { z } from "zod";

export const sessionUserInputSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(100),
	email: z.string().email(),
	image: z.string().url().nullable().optional(),
});

export type SessionUser = z.infer<typeof sessionUserInputSchema>;
