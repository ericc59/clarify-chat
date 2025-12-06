"use client";

import { Globe, Hash, Lock } from "lucide-react";
import Link from "next/link";

interface Room {
	id: string;
	name: string;
	description: string | null;
	isPublic: boolean;
}

interface RoomCardProps {
	room: Room;
	isHovered: boolean;
	onMouseEnter: () => void;
	onMouseLeave: () => void;
	animationDelay?: number;
}

export function RoomCard({
	room,
	isHovered,
	onMouseEnter,
	onMouseLeave,
	animationDelay = 0,
}: RoomCardProps) {
	return (
		<Link
			href={`/rooms/${room.id}`}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			className="animate-in fade-in slide-in-from-bottom-4 duration-500"
			style={{ animationDelay: `${animationDelay}ms` }}
		>
			<div
				className={`group bg-card border border-border/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 ${
					isHovered ? "border-primary/30" : ""
				}`}
			>
				<div className="flex items-start gap-4">
					<div
						className={`size-12 rounded-xl flex items-center justify-center transition-colors ${
							isHovered
								? "bg-primary text-primary-foreground"
								: "bg-accent text-accent-foreground"
						}`}
					>
						<Hash className="size-5" />
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<h3 className="font-medium text-lg truncate group-hover:text-primary transition-colors">
								{room.name}
							</h3>
							{room.isPublic ? (
								<Globe className="size-3.5 text-muted-foreground shrink-0" />
							) : (
								<Lock className="size-3.5 text-muted-foreground shrink-0" />
							)}
						</div>
						{room.description && (
							<p className="text-sm text-muted-foreground line-clamp-2 mt-1">
								{room.description}
							</p>
						)}
					</div>
				</div>
			</div>
		</Link>
	);
}
