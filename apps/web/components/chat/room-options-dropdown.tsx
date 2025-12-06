"use client";

import { Button } from "@workspace/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Copy, Link2, LogOut, MoreHorizontal, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";

interface RoomOptionsDropdownProps {
	roomId: string;
	roomName: string;
	createdById: string;
}

export function RoomOptionsDropdown({
	roomId,
	roomName,
	createdById,
}: RoomOptionsDropdownProps) {
	const router = useRouter();
	const { data: session } = useSession();
	const [showLeaveDialog, setShowLeaveDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [copied, setCopied] = useState(false);

	const isOwner = session?.user?.id === createdById;

	const utils = trpc.useUtils();

	const leaveRoom = trpc.room.leave.useMutation({
		onSuccess: () => {
			utils.room.list.invalidate();
			router.push("/rooms");
		},
	});

	const deleteRoom = trpc.room.delete.useMutation({
		onSuccess: () => {
			utils.room.list.invalidate();
			router.push("/rooms");
		},
	});

	const handleCopyLink = async () => {
		const url = `${window.location.origin}/rooms/${roomId}`;
		await navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleCopyId = async () => {
		await navigator.clipboard.writeText(roomId);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="size-9 rounded-lg hover:bg-accent flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
					>
						<MoreHorizontal className="size-4" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					<DropdownMenuItem onClick={handleCopyLink}>
						<Link2 className="size-4" />
						{copied ? "Copied!" : "Copy Link"}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={handleCopyId}>
						<Copy className="size-4" />
						Copy Room ID
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					{!isOwner && (
						<DropdownMenuItem
							variant="destructive"
							onClick={() => setShowLeaveDialog(true)}
						>
							<LogOut className="size-4" />
							Leave Room
						</DropdownMenuItem>
					)}
					{isOwner && (
						<DropdownMenuItem
							variant="destructive"
							onClick={() => setShowDeleteDialog(true)}
						>
							<Trash2 className="size-4" />
							Delete Room
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Leave Room</DialogTitle>
						<DialogDescription>
							Are you sure you want to leave &ldquo;{roomName}&rdquo;? You can
							rejoin if it&apos;s a public room.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowLeaveDialog(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => leaveRoom.mutate({ roomId })}
							disabled={leaveRoom.isPending}
						>
							{leaveRoom.isPending ? "Leaving..." : "Leave Room"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Room</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete &ldquo;{roomName}&rdquo;? This
							action cannot be undone and all messages will be lost.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowDeleteDialog(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => deleteRoom.mutate({ id: roomId })}
							disabled={deleteRoom.isPending}
						>
							{deleteRoom.isPending ? "Deleting..." : "Delete Room"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
