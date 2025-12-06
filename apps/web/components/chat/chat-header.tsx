"use client";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { ArrowLeft, Hash, Phone, Settings, Users, Video } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MembersSheet } from "./members-sheet";
import { RoomOptionsDropdown } from "./room-options-dropdown";
import { RoomSettingsDialog } from "./room-settings-dialog";

interface Room {
	id: string;
	name: string;
	description?: string | null;
	isPublic: boolean;
	createdById: string;
}

interface ChatHeaderProps {
	room: Room;
	memberCount?: number;
}

export function ChatHeader({ room, memberCount = 0 }: ChatHeaderProps) {
	const [showMembers, setShowMembers] = useState(false);
	const [showSettings, setShowSettings] = useState(false);

	return (
		<>
			<header className="h-16 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
				{/* Left Section */}
				<div className="flex items-center gap-3">
					{/* Mobile Back Button */}
					<Link
						href="/rooms"
						className="lg:hidden size-9 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
					>
						<ArrowLeft className="size-5" />
					</Link>

					{/* Room Icon */}
					<div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
						<Hash className="size-5 text-primary" />
					</div>

					{/* Room Info */}
					<div className="min-w-0">
						<h2 className="font-medium truncate">{room.name}</h2>
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<Users className="size-3" />
							<span>{memberCount} members</span>
							{room.description && (
								<>
									<span className="text-border">•</span>
									<span className="truncate max-w-[200px]">
										{room.description}
									</span>
								</>
							)}
						</div>
					</div>
				</div>

				{/* Right Section */}
				<div className="flex items-center gap-1">
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								className="size-9 rounded-lg hover:bg-accent flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
							>
								<Phone className="size-4" />
							</button>
						</TooltipTrigger>
						<TooltipContent>Coming soon</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								className="size-9 rounded-lg hover:bg-accent flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
							>
								<Video className="size-4" />
							</button>
						</TooltipTrigger>
						<TooltipContent>Coming soon</TooltipContent>
					</Tooltip>
					<div className="w-px h-6 bg-border mx-1" />
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={() => setShowMembers(true)}
								className="size-9 rounded-lg hover:bg-accent flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
							>
								<Users className="size-4" />
							</button>
						</TooltipTrigger>
						<TooltipContent>Members</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={() => setShowSettings(true)}
								className="size-9 rounded-lg hover:bg-accent flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
							>
								<Settings className="size-4" />
							</button>
						</TooltipTrigger>
						<TooltipContent>Settings</TooltipContent>
					</Tooltip>
					<RoomOptionsDropdown
						roomId={room.id}
						roomName={room.name}
						createdById={room.createdById}
					/>
				</div>
			</header>

			<MembersSheet
				roomId={room.id}
				createdById={room.createdById}
				open={showMembers}
				onOpenChange={setShowMembers}
			/>

			<RoomSettingsDialog
				room={room}
				open={showSettings}
				onOpenChange={setShowSettings}
			/>
		</>
	);
}
