"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createWSClient,
	httpBatchLink,
	splitLink,
	wsLink,
} from "@trpc/client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import superjson from "superjson";
import { trpc } from "@/lib/trpc";
import type { AppRouter } from "@workspace/api";

function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30 * 1000,
			},
		},
	});
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
	if (typeof window === "undefined") {
		return makeQueryClient();
	}
	if (!browserQueryClient) {
		browserQueryClient = makeQueryClient();
	}
	return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
	const queryClient = getQueryClient();

	const [trpcClient] = useState(() => {
		const wsClient = createWSClient({
			url:
				process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4001",
		});

		return trpc.createClient({
			links: [
				splitLink({
					condition: (op) => op.type === "subscription",
					true: wsLink<AppRouter>({
						client: wsClient,
						transformer: superjson,
					}),
					false: httpBatchLink({
						url: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/trpc`,
						transformer: superjson,
						fetch(url, options) {
							return fetch(url, {
								...options,
								credentials: "include",
							});
						},
					}),
				}),
			],
		});
	});

	return (
		<trpc.Provider client={trpcClient} queryClient={queryClient}>
			<QueryClientProvider client={queryClient}>
				<NextThemesProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
					enableColorScheme
				>
					{children}
				</NextThemesProvider>
			</QueryClientProvider>
		</trpc.Provider>
	);
}
