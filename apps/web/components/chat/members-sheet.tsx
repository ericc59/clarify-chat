"use client";

import { Button } from "@workspace/ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@workspace/ui/components/sheet";
import { Crown, UserMinus } from "lucide-react";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";

interface MembersSheetProps {
	roomId: string;
	createdById: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function MembersSheet({
	roomId,
	createdById,
	open,
	onOpenChange,
}: MembersSheetProps) {
	const { data: session } = useSession();
	const { data: members, isLoading } = trpc.room.getMembers.useQuery(
		{ roomId },
		{ enabled: open },
	);

	const utils = trpc.useUtils();
	const removeMember = trpc.room.removeMember.useMutation({
		onSuccess: () => {
			utils.room.getMembers.invalidate({ roomId });
		},
	});

	const isOwner = session?.user?.id === createdById;

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const handleRemoveMember = (userId: string) => {
		if (confirm("Are you sure you want to remove this member?")) {
			removeMember.mutate({ roomId, userId });
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Members</SheetTitle>
					<SheetDescription>
						{members?.length || 0} members in this room
					</SheetDescription>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto py-4">
					{isLoading ? (
						<div className="space-y-3">
							{[...Array(3)].map((_, i) => (
								<div
									key={i.toString()}
									className="flex items-center gap-3 animate-pulse"
								>
									<div className="size-10 rounded-full bg-accent" />
									<div className="flex-1 space-y-2">
										<div className="h-4 bg-accent rounded w-24" />
										<div className="h-3 bg-accent rounded w-32" />
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="space-y-1">
							{members?.map((member) => (
								<div
									key={member.id}
									className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 group"
								>
									{member.image ? (
										<Image
											src={member.image}
											alt={member.name}
											className="size-10 rounded-full object-cover"
											width={40}
											height={40}
										/>
									) : (
										<div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
											<span className="text-sm font-medium text-primary">
												{getInitials(member.name)}
											</span>
										</div>
									)}
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<span className="font-medium truncate">
												{member.name}
											</span>
											{member.id === createdById && (
												<Crown className="size-3.5 text-amber-500" />
											)}
											{member.id === session?.user?.id && (
												<span className="text-xs text-muted-foreground">
													(you)
												</span>
											)}
										</div>
										<span className="text-xs text-muted-foreground">
											{member.email}
										</span>
									</div>
									{isOwner &&
										member.id !== session?.user?.id &&
										member.id !== createdById && (
											<Button
												variant="ghost"
												size="icon"
												className="opacity-0 group-hover:opacity-100 transition-opacity"
												onClick={() => handleRemoveMember(member.id)}
												disabled={removeMember.isPending}
											>
												<UserMinus className="size-4 text-destructive" />
											</Button>
										)}
								</div>
							))}
						</div>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
