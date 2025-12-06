import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { appRouter, createTRPCContext } from "@workspace/api";
import { auth } from "@workspace/auth/server";
import { createLogger } from "@workspace/logger";
import Fastify, { type FastifyRequest } from "fastify";
import { WebSocketServer } from "ws";

const log = createLogger("api");

const server = Fastify({
	logger: true,
});

await server.register(cors, {
	origin: process.env.CORS_ORIGIN || "http://localhost:3000",
	credentials: true,
});

await server.register(websocket);

// Health check
server.get("/health", async () => {
	return { status: "ok" };
});

// Better Auth routes
server.all("/api/auth/*", async (request, reply) => {
	const url = new URL(
		request.url,
		`${request.protocol}://${request.headers.host}`,
	);

	const headers = new Headers();
	for (const [key, value] of Object.entries(request.headers)) {
		if (value) {
			headers.set(key, Array.isArray(value) ? value.join(", ") : value);
		}
	}

	const fetchRequest = new Request(url.toString(), {
		method: request.method,
		headers,
		body:
			request.method !== "GET" && request.method !== "HEAD"
				? JSON.stringify(request.body)
				: undefined,
	});

	const response = await auth.handler(fetchRequest);

	response.headers.forEach((value, key) => {
		reply.header(key, value);
	});

	reply.status(response.status);

	const body = await response.text();
	return reply.send(body);
});

// tRPC routes
await server.register(fastifyTRPCPlugin, {
	prefix: "/trpc",
	trpcOptions: {
		router: appRouter,
		createContext: async ({ req }: { req: FastifyRequest }) => {
			// Convert Fastify headers to Headers object for Better Auth
			const headers = new Headers();
			for (const [key, value] of Object.entries(req.headers)) {
				if (value) {
					headers.set(key, Array.isArray(value) ? value.join(", ") : value);
				}
			}

			const session = await auth.api.getSession({ headers });
			return createTRPCContext({ session });
		},
	},
});

const start = async () => {
	try {
		const port = Number(process.env.PORT) || 4000;
		const wsPort = Number(process.env.WS_PORT) || 4001;

		await server.listen({ port, host: "0.0.0.0" });
		log.info("HTTP server started", { port, url: `http://localhost:${port}` });

		// Create WebSocket server for tRPC subscriptions
		const wss = new WebSocketServer({ port: wsPort });

		const handler = applyWSSHandler({
			wss,
			router: appRouter,
			createContext: async ({ req }) => {
				// Parse cookies from WebSocket upgrade request
				const cookies = req.headers.cookie || "";
				const headers = new Headers();
				headers.set("cookie", cookies);

				const session = await auth.api.getSession({ headers });
				return createTRPCContext({ session });
			},
		});

		wss.on("connection", (ws) => {
			log.info("WebSocket client connected", {
				clients: wss.clients.size,
			});
			ws.once("close", () => {
				log.info("WebSocket client disconnected", {
					clients: wss.clients.size,
				});
			});
		});

		log.info("WebSocket server started", {
			port: wsPort,
			url: `ws://localhost:${wsPort}`,
		});

		// Graceful shutdown
		process.on("SIGTERM", () => {
			log.info("SIGTERM received, shutting down...");
			handler.broadcastReconnectNotification();
			wss.close();
			server.close();
		});
	} catch (err) {
		log.error("Failed to start server", { error: err });
		process.exit(1);
	}
};

start();
