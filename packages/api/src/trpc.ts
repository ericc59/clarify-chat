import { initTRPC, TRPCError } from "@trpc/server";
import type { Session } from "@workspace/auth/server";
import { db } from "@workspace/db/client";
import superjson from "superjson";

export interface CreateContextOptions {
	session: Session | null;
}

export const createTRPCContext = (opts: CreateContextOptions) => {
	return {
		session: opts.session,
		db,
	};
};

const t = initTRPC.context<typeof createTRPCContext>().create({
	transformer: superjson,
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.session?.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}
	return next({
		ctx: {
			session: ctx.session,
		},
	});
});
