"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/chat/sidebar";
import { useSession } from "@/lib/auth-client";

export default function ChatLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const { data: session, isPending } = useSession();
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

	useEffect(() => {
		if (!isPending && !session) {
			router.push("/sign-in");
		}
	}, [session, isPending, router]);

	if (isPending) {
		return (
			<div className="grain min-h-svh flex items-center justify-center bg-background">
				<div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
					<Loader2 className="size-8 animate-spin text-primary" />
					<p className="text-muted-foreground text-sm">Loading...</p>
				</div>
			</div>
		);
	}

	if (!session) {
		return null;
	}

	return (
		<div className="grain min-h-svh flex bg-background">
			<Sidebar
				collapsed={sidebarCollapsed}
				onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
				user={session.user}
			/>
			<main
				className={`flex-1 transition-all duration-300 ${
					sidebarCollapsed ? "ml-16" : "ml-72"
				}`}
			>
				{children}
			</main>
		</div>
	);
}
