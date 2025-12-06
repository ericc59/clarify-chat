"use client";

import { Hash, Loader2, UserPlus } from "lucide-react";

interface Room {
	id: string;
	name: string;
	description: string | null;
}

interface PublicRoomCardProps {
	room: Room;
	isJoining: boolean;
	onJoin: () => void;
	animationDelay?: number;
}

export function PublicRoomCard({
	room,
	isJoining,
	onJoin,
	animationDelay = 0,
}: PublicRoomCardProps) {
	return (
		<div
			className="animate-in fade-in slide-in-from-bottom-4 bg-card border border-border/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-black/5"
			style={{ animationDelay: `${animationDelay}ms` }}
		>
			<div className="flex items-start gap-4">
				<div className="size-12 rounded-xl flex items-center justify-center bg-accent text-accent-foreground">
					<Hash className="size-5" />
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="font-medium text-lg truncate">{room.name}</h3>
					{room.description && (
						<p className="text-sm text-muted-foreground line-clamp-2 mt-1">
							{room.description}
						</p>
					)}
					<button
						type="button"
						onClick={onJoin}
						disabled={isJoining}
						className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
					>
						{isJoining ? (
							<>
								<Loader2 className="size-3.5 animate-spin" />
								Joining...
							</>
						) : (
							<>
								<UserPlus className="size-3.5" />
								Join Room
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
