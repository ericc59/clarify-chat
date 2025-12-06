"use client";

import { Button } from "@workspace/ui/components/button";
import { Loader2, Paperclip, Send, Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface MessageInputProps {
	onSend: (content: string) => void;
	isLoading?: boolean;
	placeholder?: string;
}

export function MessageInput({
	onSend,
	isLoading,
	placeholder = "Type a message...",
}: MessageInputProps) {
	const [content, setContent] = useState("");
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Auto-resize textarea
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
		}
	}, []);

	const handleSubmit = (e?: React.FormEvent) => {
		e?.preventDefault();
		if (!content.trim() || isLoading) return;

		onSend(content.trim());
		setContent("");

		// Reset textarea height
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	return (
		<div className="border-t border-border bg-background/80 backdrop-blur-sm">
			<form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4">
				<div className="flex items-center gap-2">
					{/* Attachment Button */}
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-10 rounded-xl hover:bg-accent flex items-center justify-center transition-colors shrink-0 text-muted-foreground hover:text-foreground"
					>
						<Paperclip className="size-5" />
					</Button>

					{/* Input Container */}
					<div className="flex-1 relative">
						<div className="relative bg-input/50 border border-border/50 rounded-2xl focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-primary/50 transition-all duration-200">
							<textarea
								ref={textareaRef}
								value={content}
								onChange={(e) => setContent(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder={placeholder}
								disabled={isLoading}
								rows={1}
								className="w-full px-4 py-3 pr-12 bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none max-h-40 scrollbar-thin disabled:opacity-60"
							/>

							{/* Emoji Button */}
							<button
								type="button"
								className="absolute right-3 bottom-3 size-6 rounded-md hover:bg-accent flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
							>
								<Smile className="size-4" />
							</button>
						</div>
					</div>

					{/* Send Button */}
					<button
						type="submit"
						disabled={!content.trim() || isLoading}
						className="size-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none shrink-0"
					>
						{isLoading ? (
							<Loader2 className="size-5 animate-spin" />
						) : (
							<Send className="size-5" />
						)}
					</button>
				</div>

				{/* Helper Text */}
				<p className="text-xs text-muted-foreground mt-2 text-center">
					Press{" "}
					<kbd className="px-1.5 py-0.5 bg-accent rounded text-[10px] font-mono">
						Enter
					</kbd>{" "}
					to send,{" "}
					<kbd className="px-1.5 py-0.5 bg-accent rounded text-[10px] font-mono">
						Shift + Enter
					</kbd>{" "}
					for new line
				</p>
			</form>
		</div>
	);
}
