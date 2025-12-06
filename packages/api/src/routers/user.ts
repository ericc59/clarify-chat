import { UserService } from "../services/user.js";
import { createTRPCRouter, protectedProcedure } from "../trpc.js";
import {
	searchUsersSchema,
	updateProfileSchema,
	userIdSchema,
} from "../validators/user.js";

export const userRouter = createTRPCRouter({
	me: protectedProcedure.query(({ ctx }) => {
		return UserService.getMe(ctx.db, ctx.session.user.id);
	}),

	getById: protectedProcedure.input(userIdSchema).query(({ ctx, input }) => {
		return UserService.getById(ctx.db, input.id);
	}),

	updateProfile: protectedProcedure
		.input(updateProfileSchema)
		.mutation(({ ctx, input }) => {
			return UserService.updateProfile(ctx.db, input, ctx.session.user);
		}),

	search: protectedProcedure
		.input(searchUsersSchema)
		.query(({ ctx, input }) => {
			return UserService.search(ctx.db, {
				query: input.query,
				limit: input.limit,
			});
		}),
});
