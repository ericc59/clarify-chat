"use client";

import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

export function CreateRoomCard() {
	return (
		<Link
			href="/rooms/new"
			className="block mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100"
		>
			<div className="group bg-card border border-dashed border-border hover:border-primary/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
				<div className="flex items-center gap-4">
					<div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
						<Plus className="size-6 text-primary" />
					</div>
					<div className="flex-1">
						<h3 className="font-medium text-lg group-hover:text-primary transition-colors">
							Create New Room
						</h3>
						<p className="text-sm text-muted-foreground">
							Start a new conversation space
						</p>
					</div>
					<ArrowRight className="size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
				</div>
			</div>
		</Link>
	);
}
