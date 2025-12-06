"use client";

import { MessageSquare } from "lucide-react";

export function EmptyRooms() {
	return (
		<div className="text-center py-10 bg-card/50 rounded-2xl border border-border/30">
			<MessageSquare className="size-10 mx-auto text-muted-foreground/40 mb-3" />
			<p className="text-muted-foreground">
				You haven&apos;t joined any rooms yet
			</p>
		</div>
	);
}
