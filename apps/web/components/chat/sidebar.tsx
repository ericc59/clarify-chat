"use client";

import type { RoomListEvent } from "@workspace/api/events";
import {
	ChevronLeft,
	ChevronRight,
	Hash,
	Loader2,
	LogOut,
	MessageSquare,
	Plus,
	Search,
	Settings,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { signOut } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";

interface User {
	id: string;
	name: string;
	email: string;
	image?: string | null;
}

interface SidebarProps {
	collapsed: boolean;
	onToggleCollapse: () => void;
	user: User;
}

export function Sidebar({ collapsed, onToggleCollapse, user }: SidebarProps) {
	const pathname = usePathname();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [isSigningOut, setIsSigningOut] = useState(false);

	const utils = trpc.useUtils();
	const { data: rooms, isLoading: roomsLoading } = trpc.room.list.useQuery();

	// Subscribe to room list changes for real-time updates
	trpc.room.onRoomListChange.useSubscription(undefined, {
		onData: useCallback(
			(event: RoomListEvent) => {
				utils.room.list.invalidate();
			},
			[utils],
		),
	});

	const filteredRooms = rooms?.filter((room) =>
		room.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	const handleSignOut = async () => {
		setIsSigningOut(true);
		await signOut();
		router.push("/sign-in");
	};

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<aside
			className={`fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50 ${
				collapsed ? "w-16" : "w-72"
			}`}
		>
			{/* Header */}
			<div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
				{!collapsed && (
					<Link href="/rooms" className="flex items-center gap-2">
						<div className="size-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
							<MessageSquare className="size-4 text-sidebar-primary-foreground" />
						</div>
						<span className="font-serif text-xl tracking-tight">
							Clarify Chat
						</span>
					</Link>
				)}
				<button
					type="button"
					onClick={onToggleCollapse}
					className={`size-8 rounded-lg hover:bg-sidebar-accent flex items-center justify-center transition-colors ${
						collapsed ? "mx-auto" : ""
					}`}
				>
					{collapsed ? (
						<ChevronRight className="size-4 text-sidebar-foreground" />
					) : (
						<ChevronLeft className="size-4 text-sidebar-foreground" />
					)}
				</button>
			</div>

			{/* Search */}
			{!collapsed && (
				<div className="p-3">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search rooms..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full h-9 pl-9 pr-3 rounded-lg bg-sidebar-accent/50 border border-sidebar-border text-sm text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-ring/50 transition-all"
						/>
					</div>
				</div>
			)}

			{/* Rooms List */}
			<div className="flex-1 overflow-y-auto scrollbar-thin py-2">
				{!collapsed && (
					<div className="px-3 mb-2 flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Rooms
						</span>
						<Link
							href="/rooms/new"
							className="size-6 rounded hover:bg-sidebar-accent flex items-center justify-center transition-colors"
						>
							<Plus className="size-3.5 text-muted-foreground" />
						</Link>
					</div>
				)}

				{roomsLoading ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="size-5 animate-spin text-muted-foreground" />
					</div>
				) : filteredRooms && filteredRooms.length > 0 ? (
					<nav className="space-y-0.5 px-2">
						{filteredRooms.map((room) => {
							const isActive = pathname === `/rooms/${room.id}`;
							return (
								<Link
									key={room.id}
									href={`/rooms/${room.id}`}
									className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-200 group ${
										isActive
											? "bg-sidebar-accent text-sidebar-accent-foreground"
											: "text-sidebar-foreground hover:bg-sidebar-accent/50"
									}`}
								>
									<div
										className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
											isActive
												? "bg-sidebar-primary text-sidebar-primary-foreground"
												: "bg-sidebar-accent text-sidebar-foreground"
										}`}
									>
										<Hash className="size-4" />
									</div>
									{!collapsed && (
										<div className="flex-1 min-w-0">
											<p className="font-medium truncate text-sm">
												{room.name}
											</p>
											{room.description && (
												<p className="text-xs text-muted-foreground truncate">
													{room.description}
												</p>
											)}
										</div>
									)}
								</Link>
							);
						})}
					</nav>
				) : (
					!collapsed && (
						<div className="px-4 py-8 text-center">
							<Users className="size-10 mx-auto text-muted-foreground/50 mb-3" />
							<p className="text-sm text-muted-foreground">No rooms yet</p>
							<Link
								href="/rooms/new"
								className="text-sm text-primary hover:text-primary/80 font-medium"
							>
								Create your first room
							</Link>
						</div>
					)
				)}

				{collapsed && (
					<div className="px-2">
						<Link
							href="/rooms/new"
							className="size-12 mx-auto rounded-lg hover:bg-sidebar-accent flex items-center justify-center transition-colors"
						>
							<Plus className="size-5 text-sidebar-foreground" />
						</Link>
					</div>
				)}
			</div>

			{/* User Section */}
			<div className="border-t border-sidebar-border p-3">
				<div
					className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
				>
					<div className="size-9 rounded-full bg-sidebar-primary flex items-center justify-center shrink-0">
						{user.image ? (
							<Image
								src={user.image}
								alt={user.name}
								className="size-9 rounded-full object-cover"
							/>
						) : (
							<span className="text-sm font-medium text-sidebar-primary-foreground">
								{getInitials(user.name)}
							</span>
						)}
					</div>
					{!collapsed && (
						<>
							<div className="flex-1 min-w-0">
								<p className="font-medium text-sm truncate text-sidebar-foreground">
									{user.name}
								</p>
								<p className="text-xs text-muted-foreground truncate">
									{user.email}
								</p>
							</div>
							<div className="flex items-center gap-1">
								<button
									type="button"
									className="size-8 rounded-lg hover:bg-sidebar-accent flex items-center justify-center transition-colors"
								>
									<Settings className="size-4 text-muted-foreground" />
								</button>
								<button
									type="button"
									onClick={handleSignOut}
									disabled={isSigningOut}
									className="size-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors"
								>
									{isSigningOut ? (
										<Loader2 className="size-4 animate-spin text-muted-foreground" />
									) : (
										<LogOut className="size-4 text-muted-foreground" />
									)}
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</aside>
	);
}
