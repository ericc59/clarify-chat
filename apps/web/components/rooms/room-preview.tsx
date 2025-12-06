"use client";

import { Globe, Hash, Lock } from "lucide-react";

interface RoomPreviewProps {
	name: string;
	description: string;
	isPublic: boolean;
}

export function RoomPreview({ name, description, isPublic }: RoomPreviewProps) {
	return (
		<div className="flex items-center gap-4 p-4 bg-accent/30 rounded-xl">
			<div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center">
				<Hash className="size-6 text-primary" />
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<p className="font-medium text-lg truncate">{name || "Room name"}</p>
					{isPublic ? (
						<Globe className="size-4 text-muted-foreground" />
					) : (
						<Lock className="size-4 text-muted-foreground" />
					)}
				</div>
				<p className="text-sm text-muted-foreground truncate">
					{description || "Add a description..."}
				</p>
			</div>
		</div>
	);
}
