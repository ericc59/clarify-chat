"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CreateRoomForm, RoomsHeader } from "@/components/rooms";

export default function NewRoomPage() {
	return (
		<div className="min-h-svh p-8">
			<div className="max-w-xl mx-auto">
				<Link
					href="/rooms"
					className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors animate-in fade-in slide-in-from-left-4 duration-300"
				>
					<ArrowLeft className="size-4" />
					Back to rooms
				</Link>

				<RoomsHeader
					title="Create Room"
					description="Set up a new space for your conversations"
				/>

				<CreateRoomForm />
			</div>
		</div>
	);
}
