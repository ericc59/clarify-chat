import { messageRouter } from "./routers/message.js";
import { roomRouter } from "./routers/room.js";
import { userRouter } from "./routers/user.js";
import { createTRPCRouter } from "./trpc.js";

export const appRouter = createTRPCRouter({
	user: userRouter,
	room: roomRouter,
	message: messageRouter,
});

export type AppRouter = typeof appRouter;
