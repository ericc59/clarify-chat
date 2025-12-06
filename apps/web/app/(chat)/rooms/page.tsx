"use client";

import { Globe, Loader2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
	CreateRoomCard,
	EmptyRooms,
	PublicRoomCard,
	RoomCard,
	RoomsHeader,
} from "@/components/rooms";
import { trpc } from "@/lib/trpc";
import type { RoomListEvent } from "@workspace/api/events";

export default function RoomsPage() {
	const router = useRouter();
	const { data: myRooms, isLoading: myRoomsLoading } =
		trpc.room.list.useQuery();
	const { data: publicRooms, isLoading: publicRoomsLoading } =
		trpc.room.listPublic.useQuery();
	const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
	const [joiningRoom, setJoiningRoom] = useState<string | null>(null);

	const utils = trpc.useUtils();
	const joinRoom = trpc.room.join.useMutation({
		onSuccess: (_, variables) => {
			utils.room.list.invalidate();
			utils.room.listPublic.invalidate();
			router.push(`/rooms/${variables.roomId}`);
		},
	});

	// Subscribe to room list changes for real-time updates
	trpc.room.onRoomListChange.useSubscription(undefined, {
		onData: useCallback(
			(event: RoomListEvent) => {
				// Refresh room lists when rooms are created or deleted
				utils.room.list.invalidate();
				utils.room.listPublic.invalidate();
			},
			[utils],
		),
	});

	const handleJoinRoom = (roomId: string) => {
		setJoiningRoom(roomId);
		joinRoom.mutate({ roomId });
	};

	const isLoading = myRoomsLoading || publicRoomsLoading;

	if (isLoading) {
		return (
			<div className="min-h-svh flex items-center justify-center">
				<div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
					<Loader2 className="size-8 animate-spin text-primary" />
					<p className="text-muted-foreground text-sm">Loading rooms...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-svh p-8">
			<div className="max-w-4xl mx-auto">
				<RoomsHeader
					title="Rooms"
					description="Select a room to start chatting or create a new one"
				/>

				<CreateRoomCard />

				<div className="mb-10">
					<h2 className="text-xl font-serif mb-4 flex items-center gap-2">
						<Users className="size-5" />
						My Rooms
					</h2>
					{myRooms && myRooms.length > 0 ? (
						<div className="grid gap-4 sm:grid-cols-2">
							{myRooms.map((room, index) => (
								<RoomCard
									key={room.id}
									room={room}
									isHovered={hoveredRoom === room.id}
									onMouseEnter={() => setHoveredRoom(room.id)}
									onMouseLeave={() => setHoveredRoom(null)}
									animationDelay={(index + 2) * 50}
								/>
							))}
						</div>
					) : (
						<EmptyRooms />
					)}
				</div>

				{publicRooms && publicRooms.length > 0 && (
					<div>
						<h2 className="text-xl font-serif mb-4 flex items-center gap-2">
							<Globe className="size-5" />
							Discover Public Rooms
						</h2>
						<div className="grid gap-4 sm:grid-cols-2">
							{publicRooms.map((room, index) => (
								<PublicRoomCard
									key={room.id}
									room={room}
									isJoining={joiningRoom === room.id}
									onJoin={() => handleJoinRoom(room.id)}
									animationDelay={(index + 2) * 50}
								/>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
