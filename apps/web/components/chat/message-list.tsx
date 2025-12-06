"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import { useSession } from "@/lib/auth-client";

interface Message {
	id: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
	userId: string;
	user: {
		id: string;
		name: string;
		image: string | null;
	};
}

interface MessageListProps {
	messages: Message[];
	isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
	const { data: session } = useSession();
	const bottomRef = useRef<HTMLDivElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Group messages by date and consecutive same user
	// Reverse messages so oldest are first (Slack-like: newest at bottom)
	const groupedMessages = useMemo(() => {
		const sortedMessages = [...messages].reverse();
		const groups: {
			date: string;
			messages: { userId: string; messages: Message[] }[];
		}[] = [];

		let currentDate = "";
		let currentUserId = "";
		let currentGroup: Message[] = [];

		sortedMessages.forEach((message, index) => {
			const messageDate = new Date(message.createdAt).toDateString();

			if (messageDate !== currentDate) {
				if (currentGroup.length > 0) {
					const lastDateGroup = groups[groups.length - 1];
					if (lastDateGroup) {
						lastDateGroup.messages.push({
							userId: currentUserId,
							messages: currentGroup,
						});
					}
				}
				currentDate = messageDate;
				currentUserId = message.userId;
				currentGroup = [message];
				groups.push({
					date: messageDate,
					messages: [],
				});
			} else if (message.userId !== currentUserId) {
				if (currentGroup.length > 0) {
					const lastDateGroup = groups[groups.length - 1];
					if (lastDateGroup) {
						lastDateGroup.messages.push({
							userId: currentUserId,
							messages: currentGroup,
						});
					}
				}
				currentUserId = message.userId;
				currentGroup = [message];
			} else {
				currentGroup.push(message);
			}

			if (index === sortedMessages.length - 1 && currentGroup.length > 0) {
				const lastDateGroup = groups[groups.length - 1];
				if (lastDateGroup) {
					lastDateGroup.messages.push({
						userId: currentUserId,
						messages: currentGroup,
					});
				}
			}
		});

		return groups;
	}, [messages]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const formatMessageTime = (date: Date) => {
		return new Date(date).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatDateHeader = (dateString: string) => {
		const date = new Date(dateString);
		const today = new Date();
		const yesterday = new Date(today);
		yesterday.setDate(yesterday.getDate() - 1);

		if (date.toDateString() === today.toDateString()) {
			return "Today";
		} else if (date.toDateString() === yesterday.toDateString()) {
			return "Yesterday";
		} else {
			return date.toLocaleDateString(undefined, {
				weekday: "long",
				month: "long",
				day: "numeric",
			});
		}
	};

	if (isLoading) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<div className="animate-pulse space-y-4 w-full max-w-md px-4">
					{[...Array(5)].map((_, i) => (
						<div
							key={i.toString()}
							className={`flex gap-3 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}
						>
							<div className="size-10 rounded-full bg-accent" />
							<div
								className={`space-y-2 ${i % 2 === 0 ? "" : "flex flex-col items-end"}`}
							>
								<div
									className="h-4 bg-accent rounded"
									style={{ width: `${100 + Math.random() * 100}px` }}
								/>
								<div
									className="h-4 bg-accent rounded"
									style={{ width: `${50 + Math.random() * 80}px` }}
								/>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (messages.length === 0) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<div className="text-center animate-in fade-in duration-500">
					<div className="size-16 mx-auto rounded-2xl bg-accent/50 flex items-center justify-center mb-4">
						<span className="text-2xl">💬</span>
					</div>
					<h3 className="font-medium mb-1">No messages yet</h3>
					<p className="text-sm text-muted-foreground">
						Be the first to start the conversation!
					</p>
				</div>
			</div>
		);
	}

	return (
		<div ref={containerRef} className="flex-1 overflow-y-auto scrollbar-thin">
			<div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
				{groupedMessages.map((dateGroup) => (
					<div key={dateGroup.date}>
						{/* Date Header */}
						<div className="flex items-center gap-4 my-6">
							<div className="flex-1 h-px bg-border" />
							<span className="text-xs font-medium text-muted-foreground px-2">
								{formatDateHeader(dateGroup.date)}
							</span>
							<div className="flex-1 h-px bg-border" />
						</div>

						{/* Message Groups */}
						<div className="space-y-4">
							{dateGroup.messages.map((userGroup, groupIndex) => {
								const isOwn = userGroup.userId === session?.user?.id;
								const firstMessage = userGroup.messages[0];

								if (!firstMessage) return null;

								return (
									<div
										key={`${userGroup.userId}-${groupIndex}`}
										className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
									>
										{/* Avatar */}
										<div className="shrink-0">
											{firstMessage.user.image ? (
												<Image
													src={firstMessage.user.image}
													alt={firstMessage.user.name}
													className="size-10 rounded-full object-cover"
													width={40}
													height={40}
													loading="lazy"
												/>
											) : (
												<div className="size-10 rounded-full flex items-center justify-center bg-accent text-accent-foreground">
													<span className="text-sm font-medium">
														{getInitials(firstMessage.user.name)}
													</span>
												</div>
											)}
										</div>

										{/* Messages */}
										<div
											className={`flex flex-col gap-1 max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}
										>
											{/* Name */}
											<span
												className={`text-xs font-medium text-muted-foreground mb-0.5 ${isOwn ? "text-right" : ""}`}
											>
												{isOwn ? "You" : firstMessage.user.name}
											</span>

											{userGroup.messages.map((message, messageIndex) => (
												<div
													key={message.id}
													className={`group relative animate-in fade-in slide-in-from-bottom-2 duration-300 ${
														isOwn ? "items-end" : "items-start"
													}`}
													style={{ animationDelay: `${messageIndex * 30}ms` }}
												>
													<div
														className={`px-4 py-2.5 rounded-2xl max-w-full wrap-break-word ${
															isOwn
																? "border bg-background border-message-own text-message-foreground bg-message-own/10 rounded-br-md"
																: "border bg-background border-message-other text-message-other-foreground rounded-bl-md"
														}`}
													>
														<p className="text-sm whitespace-pre-wrap">
															{message.content}
														</p>
													</div>
													<span
														className={`text-[10px] text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
															isOwn ? "text-right" : ""
														}`}
													>
														{formatMessageTime(message.createdAt)}
													</span>
												</div>
											))}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				))}
				<div ref={bottomRef} />
			</div>
		</div>
	);
}
