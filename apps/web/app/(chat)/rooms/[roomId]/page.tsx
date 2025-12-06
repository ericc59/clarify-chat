"use client";

import type { MessageEvent, RoomEvent } from "@workspace/api";
import { Loader2 } from "lucide-react";
import { notFound, useRouter } from "next/navigation";
import { use, useCallback } from "react";
import { ChatHeader, MessageInput, MessageList } from "@/components/chat";
import { trpc } from "@/lib/trpc";
import { useSession } from "@/lib/auth-client";

interface RoomPageProps {
	params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
	const { roomId } = use(params);
	const router = useRouter();
	const { data: session } = useSession();

	const {
		data: room,
		isLoading: roomLoading,
		error: roomError,
	} = trpc.room.getById.useQuery({ id: roomId });

	const { data: messagesData, isLoading: messagesLoading } =
		trpc.message.list.useQuery({ roomId, limit: 50 }, { enabled: !!room });

	const { data: members } = trpc.room.getMembers.useQuery(
		{ roomId },
		{ enabled: !!room },
	);

	const utils = trpc.useUtils();

	// Subscribe to real-time message updates
	trpc.message.onMessage.useSubscription(
		{ roomId },
		{
			enabled: !!room,
			onData: useCallback(
				(event: MessageEvent) => {
					utils.message.list.setData({ roomId, limit: 50 }, (old) => {
						if (!old) return old;

						if (event.type === "new") {
							// Add new message to front (API stores newest first, display reverses)
							const exists = old.items.some((m) => m.id === event.message.id);
							if (exists) return old;
							return {
								...old,
								items: [event.message, ...old.items],
							};
						}

						if (event.type === "updated") {
							return {
								...old,
								items: old.items.map((m) =>
									m.id === event.message.id ? event.message : m,
								),
							};
						}

						if (event.type === "deleted") {
							return {
								...old,
								items: old.items.filter((m) => m.id !== event.message.id),
							};
						}

						return old;
					});
				},
				[roomId, utils],
			),
		},
	);

	// Subscribe to room membership events
	trpc.room.onRoomEvent.useSubscription(
		{ roomId },
		{
			enabled: !!room,
			onData: useCallback(
				(event: RoomEvent) => {
					// If room was deleted, redirect everyone to rooms list
					if (event.type === "room_deleted") {
						utils.room.list.invalidate();
						router.push("/rooms");
						return;
					}

					// If current user was removed, redirect to rooms list
					if (
						event.type === "member_removed" &&
						event.userId === session?.user?.id
					) {
						utils.room.list.invalidate();
						router.push("/rooms");
						return;
					}

					// For all membership changes, refresh the members list
					if (
						event.type === "member_joined" ||
						event.type === "member_left" ||
						event.type === "member_removed"
					) {
						utils.room.getMembers.invalidate({ roomId });
					}
				},
				[roomId, session?.user?.id, utils, router],
			),
		},
	);

	const sendMessage = trpc.message.create.useMutation();

	const handleSendMessage = (content: string) => {
		sendMessage.mutate({ roomId, content });
	};

	if (roomLoading) {
		return (
			<div className="h-svh flex items-center justify-center">
				<div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
					<Loader2 className="size-8 animate-spin text-primary" />
					<p className="text-muted-foreground text-sm">Loading room...</p>
				</div>
			</div>
		);
	}

	if (roomError || !room) {
		notFound();
	}

	const messages = messagesData?.items ?? [];

	return (
		<div className="h-svh flex flex-col">
			<ChatHeader room={room} memberCount={members?.length ?? 0} />

			<MessageList messages={messages} isLoading={messagesLoading} />

			<MessageInput
				onSend={handleSendMessage}
				isLoading={sendMessage.isPending}
				placeholder={`Message #${room.name}`}
			/>
		</div>
	);
}
